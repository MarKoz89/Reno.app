import { getStyleById } from "@/data/renovation-styles";
import type { RedesignVariant } from "@/features/projects/types";

export const runtime = "nodejs";

const maxImageBytes = 8 * 1024 * 1024;
const generationTimeoutMs = 60_000;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

type RedesignErrorCode =
  | "BAD_REQUEST"
  | "MISSING_IMAGE"
  | "UNKNOWN_STYLE"
  | "UNSUPPORTED_IMAGE_TYPE"
  | "IMAGE_TOO_LARGE"
  | "MISSING_AI_KEY"
  | "AI_TIMEOUT"
  | "AI_PROVIDER_ERROR";

type OpenAIImageResponse = {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
  error?: {
    message?: string;
  };
};

function jsonError(
  code: RedesignErrorCode,
  message: string,
  status: number,
  retryable: boolean,
) {
  return Response.json(
    {
      ok: false,
      error: {
        code,
        message,
        retryable,
      },
    },
    { status },
  );
}

function clampCount(value: FormDataEntryValue | null) {
  const count = Number(value ?? 3);

  if (!Number.isFinite(count)) {
    return 3;
  }

  return Math.max(1, Math.min(3, Math.round(count)));
}

function buildPrompt(style: { name: string; description: string }) {
  return [
    `Create a realistic renovation redesign of this room in the selected style: ${style.name}.`,
    `Style guidance: ${style.description}`,
    "Preserve the room layout, camera angle, doors, windows, and major architecture.",
    "Change finishes, color palette, lighting, built-ins, and furnishings only where visually plausible.",
    "Do not add text, prices, floor plans, watermarks, people, or contractor claims.",
    "This is inspiration only and must not imply a cost estimate.",
  ].join(" ");
}

async function postToImageProvider({
  apiKey,
  body,
}: {
  apiKey: string;
  body: FormData;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), generationTimeoutMs);

  try {
    return await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return jsonError(
      "MISSING_AI_KEY",
      "AI redesign generation is not configured yet.",
      500,
      false,
    );
  }

  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return jsonError(
      "BAD_REQUEST",
      "Send one room image and selected style as form data.",
      400,
      false,
    );
  }

  const image = form.get("image");
  const styleId = String(form.get("styleId") ?? "");
  const count = clampCount(form.get("count"));
  const style = getStyleById(styleId);

  if (!(image instanceof File)) {
    return jsonError(
      "MISSING_IMAGE",
      "Add a room photo before generating redesign ideas.",
      400,
      false,
    );
  }

  if (!style) {
    return jsonError(
      "UNKNOWN_STYLE",
      "Choose a renovation style before generating redesign ideas.",
      404,
      false,
    );
  }

  if (!allowedImageTypes.has(image.type)) {
    return jsonError(
      "UNSUPPORTED_IMAGE_TYPE",
      "Use a JPG, PNG, or WebP room photo.",
      415,
      false,
    );
  }

  if (image.size > maxImageBytes) {
    return jsonError(
      "IMAGE_TOO_LARGE",
      "Use a room photo smaller than 8 MB.",
      413,
      false,
    );
  }

  const providerForm = new FormData();
  providerForm.set("model", process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1.5");
  providerForm.set("image", image);
  providerForm.set("prompt", buildPrompt(style));
  providerForm.set("n", String(count));
  providerForm.set("size", "1536x1024");

  let providerResponse: Response;

  try {
    providerResponse = await postToImageProvider({
      apiKey,
      body: providerForm,
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";

    return jsonError(
      aborted ? "AI_TIMEOUT" : "AI_PROVIDER_ERROR",
      aborted
        ? "AI redesign generation took too long. Try again with a smaller image."
        : "AI redesign generation failed. Try again later.",
      aborted ? 504 : 502,
      true,
    );
  }

  let payload: OpenAIImageResponse;

  try {
    payload = (await providerResponse.json()) as OpenAIImageResponse;
  } catch {
    return jsonError(
      "AI_PROVIDER_ERROR",
      "AI redesign generation returned an unreadable response.",
      502,
      true,
    );
  }

  if (!providerResponse.ok) {
    return jsonError(
      "AI_PROVIDER_ERROR",
      payload.error?.message ?? "AI redesign generation failed.",
      502,
      true,
    );
  }

  const imageUrls =
    payload.data
      ?.map((item) => {
        if (item.b64_json) {
          return `data:image/png;base64,${item.b64_json}`;
        }

        return item.url;
      })
      .filter((url): url is string => Boolean(url))
      .slice(0, count) ?? [];

  if (imageUrls.length === 0) {
    return jsonError(
      "AI_PROVIDER_ERROR",
      "AI redesign generation did not return any images.",
      502,
      true,
    );
  }

  const timestamp = Date.now().toString(36);
  const variants: RedesignVariant[] = imageUrls.map((imageUrl, index) => ({
    id: `ai-${style.id}-${timestamp}-${index + 1}`,
    title: `${style.name} option ${index + 1}`,
    styleLabel: style.name,
    imageUrl,
    description:
      "AI-generated renovation inspiration based on your room photo and selected style.",
  }));

  return Response.json({
    ok: true,
    variants,
    meta: {
      styleId: style.id,
      styleName: style.name,
      model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1.5",
    },
  });
}
