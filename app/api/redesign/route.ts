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
    `Edit the provided room photo into a realistic residential renovation preview in the selected style: ${style.name}.`,
    `Style guidance: ${style.description}`,
    "Keep the original room recognizable and preserve the room layout, camera angle, wall positions, ceiling height, floor footprint, doors, windows, openings, stairs, structural-looking built-ins, and major architecture.",
    "Focus changes on plausible renovation surfaces and movable elements: paint, flooring, lighting, cabinet fronts, countertops, backsplash, trim, hardware, window treatments, decor, and movable furniture.",
    "Use realistic materials, colors, lighting, and scale that a homeowner could reasonably plan or ask a contractor to install.",
    "Do not move walls, add new windows or doors, create impossible lighting, invent extra rooms, change the room footprint, use fantasy interiors, exaggerate scale, or add ultra-luxury upgrades unless the selected style clearly implies them.",
    "Do not add people, text, labels, captions, signs, logos, watermarks, floor plans, measurements, prices, estimate tables, discounts, feasibility claims, or contractor claims.",
    "This is visual inspiration only and must not imply a cost estimate, pricing recommendation, construction feasibility, or project guarantee.",
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

  const images = form.getAll("image");
  const styleId = String(form.get("styleId") ?? "");
  const count = clampCount(form.get("count"));
  const style = getStyleById(styleId);

  if (images.length !== 1) {
    return jsonError(
      images.length === 0 ? "MISSING_IMAGE" : "BAD_REQUEST",
      images.length === 0
        ? "Add one room photo before generating redesign ideas."
        : "Send exactly one room photo for redesign generation.",
      400,
      false,
    );
  }

  const image = images[0];

  if (!(image instanceof File)) {
    return jsonError(
      "MISSING_IMAGE",
      "Add one room photo before generating redesign ideas.",
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
  providerForm.set("model", process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1-mini");
  providerForm.set("image", image);
  providerForm.set("prompt", buildPrompt(style));
  providerForm.set("n", "1");
  providerForm.set("size", "1024x1024");

  let providerResponse: Response;

  try {
    console.log("redesign route hit");
    console.log("OPENAI KEY EXISTS:", !!process.env.OPENAI_API_KEY);
    console.log("model:", process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1-mini");
    console.log("calling OpenAI edits...");
    providerResponse = await postToImageProvider({
      apiKey,
      body: providerForm,
    });
    console.log("OpenAI response status:", providerResponse.status);
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
      model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1-mini",
    },
  });
}
