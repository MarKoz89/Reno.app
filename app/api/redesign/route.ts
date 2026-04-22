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
    `Edit the provided room photo into a realistic residential renovation preview using the selected style: ${style.name}.`,
    `Style grounding: ${style.description}`,
    "The selected style should guide colors, finishes, fixtures, and decor, but realism and the original room structure are more important than dramatic style expression.",
    "Style should influence details, not override realism.",
    "Preserve the original room exactly: keep the same layout, camera angle, perspective, wall positions, ceiling height, floor footprint, room size, doors, windows, openings, stairs, built-ins, plumbing locations, and major architectural features.",
    "Lighting direction, shadows, and perspective must match the original image.",
    "Do not move walls, change the layout, change the camera angle, add new windows or doors, remove existing windows or doors, change the room size, invent adjacent rooms, or alter structural-looking elements.",
    "Do not change the position of light sources or windows.",
    "Only make plausible renovation changes to visible finishes and replaceable elements: paint or wall finish, flooring, lighting fixtures, cabinets, vanities, counters, backsplash, furniture, curtains, rugs, decorations, hardware, faucets, sinks, mirrors, and other non-structural fixtures.",
    "The result must look like a real photograph, not a render, mockup, visualization, catalog image, or advertisement.",
    "Use real-world materials, believable colors, correct scale, natural proportions, practical lighting, and normal residential installation quality.",
    "Use natural lighting consistent with the original photo, and preserve imperfections typical for real homes.",
    "Keep the design conservative and useful for a homeowner planning a real renovation; avoid excessive creativity, luxury exaggeration, dramatic staging, and unrealistic upgrades unless they are clearly appropriate for the selected style.",
    "Keep the design practical and achievable within a normal renovation budget.",
    "Avoid fantasy interiors, surreal or conceptual design, impossible lighting, glossy showroom rendering, overdesigned Pinterest-style styling, warped geometry, distorted furniture, fake reflections, cluttered decor, and objects that do not fit the room.",
    "Avoid perfect symmetry, unrealistic cleanliness, overly staged interiors, overdecorating, and adding too many design elements.",
    "Do not create a showroom-style interior, staged catalog look, advertisement look, glossy or hyper-polished materials, exaggerated lighting, exaggerated reflections, or dramatic shadows.",
    "Do not add people, text, labels, captions, signs, logos, watermarks, floor plans, measurements, prices, estimate tables, discounts, feasibility claims, or contractor claims.",
    "This is visual inspiration only and must not imply a cost estimate, pricing recommendation, construction feasibility, or project guarantee.",
  ].join(" ");
}

function isUsableImageUrl(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const trimmedValue = value.trim();

  return (
    trimmedValue.startsWith("data:image/") ||
    trimmedValue.startsWith("https://") ||
    trimmedValue.startsWith("http://")
  );
}

function isUsableBase64Image(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getImageUrlsFromPayload(payload: OpenAIImageResponse, count: number) {
  if (!Array.isArray(payload.data)) {
    return [];
  }

  return payload.data
    .map((item) => {
      if (!item || typeof item !== "object") {
        return undefined;
      }

      const imageItem = item as { b64_json?: unknown; url?: unknown };

      if (isUsableBase64Image(imageItem.b64_json)) {
        return `data:image/png;base64,${imageItem.b64_json.trim()}`;
      }

      return imageItem.url;
    })
    .filter(isUsableImageUrl)
    .slice(0, count);
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

  const imageUrls = getImageUrlsFromPayload(payload, count);

  if (imageUrls.length === 0) {
    return jsonError(
      "AI_PROVIDER_ERROR",
      "AI redesign generation returned no usable image. Try again.",
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
