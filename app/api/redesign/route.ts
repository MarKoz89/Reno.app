import { getStyleById } from "@/data/renovation-styles";
import type {
  QualityLevel,
  RedesignVariant,
  RenovationScope,
  RoomType,
} from "@/features/projects/types";

export const runtime = "nodejs";

const maxImageBytes = 8 * 1024 * 1024;
const generationTimeoutMs = 60_000;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const roomTypes: RoomType[] = ["kitchen", "bathroom", "living-room", "bedroom"];
const renovationScopes: RenovationScope[] = ["light", "standard", "full"];
const qualityLevels: QualityLevel[] = ["budget", "standard", "premium"];

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

function isRoomType(value: unknown): value is RoomType {
  return typeof value === "string" && roomTypes.includes(value as RoomType);
}

function isRenovationScope(value: unknown): value is RenovationScope {
  return (
    typeof value === "string" &&
    renovationScopes.includes(value as RenovationScope)
  );
}

function isQualityLevel(value: unknown): value is QualityLevel {
  return typeof value === "string" && qualityLevels.includes(value as QualityLevel);
}

function normalizeRoomSize(value: FormDataEntryValue | null) {
  const roomSizeM2 = Number(value ?? "");

  if (!Number.isFinite(roomSizeM2) || roomSizeM2 <= 0) {
    return undefined;
  }

  return roomSizeM2;
}

function buildPrompt({
  style,
  roomType,
  roomSizeM2,
  renovationScope,
  qualityLevel,
  materialPreferences,
  notes,
}: {
  style: { name: string; description: string };
  roomType: RoomType;
  roomSizeM2?: number;
  renovationScope: RenovationScope;
  qualityLevel: QualityLevel;
  materialPreferences: string;
  notes: string;
}) {
  return [
    `Edit the provided room photo into one realistic renovation suggestion using the selected style: ${style.name}.`,
    `Style grounding: ${style.description}`,
    `Room type: ${roomType}.`,
    `Room size: ${roomSizeM2 ? `${roomSizeM2} m2` : "not provided"}.`,
    `Renovation scope: ${renovationScope}.`,
    `Quality level: ${qualityLevel}.`,
    `Material preferences: ${materialPreferences || "None provided."}`,
    `User priorities and notes: ${notes || "None provided."}`,
    "The result must look like a real photo of the same room after a normal renovation, not a render, visualization, catalog image, advertisement, or AI concept image.",
    "Keep the room clearly recognizable as the same space. Preserve the original layout, room proportions, camera angle, perspective, wall positions, ceiling height, floor footprint, doors, windows, openings, stairs, built-ins, plumbing locations, light direction, shadows, and major architectural elements.",
    "Do not improve or redesign the architecture itself. Do not reinterpret the room layout, move walls, change perspective, add or remove windows or doors, change room size, invent adjacent rooms, or alter structural-looking elements.",
    "Only make realistic renovation changes a homeowner could actually implement: paint or wall finish, surfaces, flooring, lighting fixtures, cabinets, vanities, counters, backsplash, trim, furniture, curtains, rugs, textiles, decor, hardware, faucets, sinks, mirrors, and other replaceable non-structural fixtures.",
    "The renovation scope, quality level, selected style, material preferences, and user notes should all influence the finish choices and amount of visible change.",
    "Style should guide the finish language, colors, materials, fixtures, and decor tone, but realism is more important than dramatic style expression. Style should be visible but subtle and practical.",
    "Use real-world materials, believable colors, correct scale, natural proportions, practical lighting, and normal residential installation quality.",
    "Keep lighting natural and consistent with the original image. Preserve realistic shadows, everyday imperfections, and the lived-in feel of a normal home.",
    "Keep the design conservative, useful, and achievable within a normal renovation budget. Avoid excessive decoration or luxury elements unless the selected style clearly requires them.",
    "Negative constraints: no showroom styling, catalog polish, staged luxury presentation, fantasy interiors, surreal design, AI concept art, unreal lighting, excessive symmetry, perfect spotless staging, fake depth, impossible reflections, surreal material shine, glossy hyper-polished materials, warped geometry, distorted furniture, overly curated Pinterest styling, text, labels, logos, watermarks, people, prices, measurements, or contractor claims.",
    "Do not imply a discount, feasibility claim, construction guarantee, contractor recommendation, or pricing authority.",
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
  const roomType = form.get("roomType");
  const renovationScope = form.get("renovationScope");
  const qualityLevel = form.get("qualityLevel");
  const roomSizeM2 = normalizeRoomSize(form.get("roomSizeM2"));
  const materialPreferences = String(form.get("materialPreferences") ?? "").slice(
    0,
    300,
  );
  const notes = String(form.get("notes") ?? "").slice(0, 1200);
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

  if (
    !isRoomType(roomType) ||
    !isRenovationScope(renovationScope) ||
    !isQualityLevel(qualityLevel)
  ) {
    return jsonError(
      "BAD_REQUEST",
      "Choose room type, renovation scope, and quality level before generating redesign ideas.",
      400,
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
  providerForm.set(
    "prompt",
    buildPrompt({
      style,
      roomType,
      roomSizeM2,
      renovationScope,
      qualityLevel,
      materialPreferences,
      notes,
    }),
  );
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

  const imageUrls = getImageUrlsFromPayload(payload, count).slice(0, 1);

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
