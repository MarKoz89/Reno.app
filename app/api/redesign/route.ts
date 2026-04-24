import { getStyleById } from "@/data/renovation-styles";
import type {
  QualityLevel,
  RedesignVariant,
  RenovationScope,
  RoomType,
} from "@/features/projects/types";

export const runtime = "nodejs";

const maxImageBytes = 8 * 1024 * 1024;
const maxRequestBytes = maxImageBytes + 512 * 1024;
const generationTimeoutMs = 60_000;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const roomTypes: RoomType[] = ["kitchen", "bathroom", "living-room", "bedroom"];
const renovationScopes: RenovationScope[] = ["light", "standard", "full"];
const qualityLevels: QualityLevel[] = ["budget", "standard", "premium"];

type RedesignErrorCode =
  | "BAD_REQUEST"
  | "REQUEST_TOO_LARGE"
  | "MISSING_IMAGE"
  | "UNKNOWN_STYLE"
  | "UNSUPPORTED_IMAGE_TYPE"
  | "IMAGE_TOO_LARGE"
  | "MISSING_AI_KEY"
  | "AI_TIMEOUT"
  | "AI_PROVIDER_ERROR"
  | "INTERNAL_ERROR";

type OpenAIImageResponse = {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
  error?: {
    message?: string;
  };
};

type RedesignDebugConfig = {
  enabled: boolean;
  disableImageInput: boolean;
  logFullOpenAIResponse: boolean;
};

function jsonError(
  code: RedesignErrorCode,
  message: string,
  status: number,
  retryable: boolean,
  requestId: string,
) {
  return Response.json(
    {
      ok: false,
      error: {
        code,
        message,
        retryable,
        requestId,
      },
    },
    { status },
  );
}

function logRedesignFailure({
  requestId,
  code,
  status,
  message,
  details,
  error,
}: {
  requestId: string;
  code: RedesignErrorCode;
  status: number;
  message: string;
  details?: Record<string, unknown>;
  error?: unknown;
}) {
  console.error("[api/redesign]", {
    requestId,
    code,
    status,
    message,
    details,
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error,
  });
}

function logRedesignEvent(
  event: string,
  details: Record<string, unknown>,
  level: "info" | "warn" | "error" = "info",
) {
  const logger =
    level === "error" ? console.error : level === "warn" ? console.warn : console.info;

  logger("[api/redesign]", {
    event,
    ...details,
  });
}

function jsonLoggedError({
  requestId,
  code,
  message,
  status,
  retryable,
  details,
  error,
}: {
  requestId: string;
  code: RedesignErrorCode;
  message: string;
  status: number;
  retryable: boolean;
  details?: Record<string, unknown>;
  error?: unknown;
}) {
  logRedesignFailure({
    requestId,
    code,
    status,
    message,
    details,
    error,
  });

  return jsonError(code, message, status, retryable, requestId);
}

function clampCount(value: FormDataEntryValue | null) {
  const count = Number(value ?? 3);

  if (!Number.isFinite(count)) {
    return 3;
  }

  return Math.max(1, Math.min(3, Math.round(count)));
}

function readBooleanFlag(value: string | undefined) {
  if (!value) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function getDebugConfig(): RedesignDebugConfig {
  return {
    enabled: readBooleanFlag(process.env.REDESIGN_DEBUG),
    disableImageInput: readBooleanFlag(process.env.REDESIGN_DEBUG_DISABLE_IMAGE),
    logFullOpenAIResponse: readBooleanFlag(
      process.env.REDESIGN_DEBUG_LOG_FULL_OPENAI_RESPONSE,
    ),
  };
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

function truncateForLog(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
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
  endpoint,
  body,
  contentType,
}: {
  apiKey: string;
  endpoint: string;
  body: FormData | string;
  contentType?: string;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), generationTimeoutMs);

  try {
    return await fetch(`https://api.openai.com/v1${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...(contentType ? { "Content-Type": contentType } : {}),
      },
      body,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function isRequestTooLargeError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("too large") ||
    message.includes("body exceeded") ||
    message.includes("request entity too large") ||
    message.includes("content length")
  );
}

function parseContentLength(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

async function handlePost(request: Request, requestId: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  const contentLength = parseContentLength(request.headers.get("content-length"));
  const debug = getDebugConfig();

  logRedesignEvent("request_start", {
    requestId,
    contentType: request.headers.get("content-type") ?? "unknown",
    contentLength: contentLength ?? "unknown",
    debugEnabled: debug.enabled,
    disableImageInput: debug.disableImageInput,
    logFullOpenAIResponse: debug.logFullOpenAIResponse,
  });

  if (!apiKey) {
    return jsonLoggedError({
      requestId,
      code: "MISSING_AI_KEY",
      message: "AI redesign generation is not configured yet.",
      status: 500,
      retryable: false,
    });
  }

  if (contentLength && contentLength > maxRequestBytes) {
    return jsonLoggedError({
      requestId,
      code: "REQUEST_TOO_LARGE",
      message: "The redesign request is too large. Try a smaller room photo.",
      status: 413,
      retryable: false,
      details: {
        contentLength,
        maxRequestBytes,
      },
    });
  }

  let form: FormData;

  try {
    form = await request.formData();
  } catch (error) {
    if (isRequestTooLargeError(error)) {
      return jsonLoggedError({
        requestId,
        code: "REQUEST_TOO_LARGE",
        message:
          "The redesign request is too large. Try a smaller room photo.",
        status: 413,
        retryable: false,
        error,
      });
    }

    return jsonLoggedError({
      requestId,
      code: "BAD_REQUEST",
      message: "Send one room image and selected style as form data.",
      status: 400,
      retryable: false,
      error,
    });
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

  logRedesignEvent("parsed_form_data", {
    requestId,
    styleId,
    roomType: typeof roomType === "string" ? roomType : null,
    roomSizeM2: roomSizeM2 ?? null,
    renovationScope: typeof renovationScope === "string" ? renovationScope : null,
    qualityLevel: typeof qualityLevel === "string" ? qualityLevel : null,
    count,
    imageCount: images.length,
    materialPreferencesLength: materialPreferences.length,
    notesLength: notes.length,
  });

  if (images.length !== 1) {
    return jsonLoggedError({
      requestId,
      code: images.length === 0 ? "MISSING_IMAGE" : "BAD_REQUEST",
      message:
        images.length === 0
          ? "Add one room photo before generating redesign ideas."
          : "Send exactly one room photo for redesign generation.",
      status: 400,
      retryable: false,
      details: { imageCount: images.length },
    });
  }

  const image = images[0];

  if (!(image instanceof File)) {
    return jsonLoggedError({
      requestId,
      code: "MISSING_IMAGE",
      message: "Add one room photo before generating redesign ideas.",
      status: 400,
      retryable: false,
    });
  }

  if (!style) {
    return jsonLoggedError({
      requestId,
      code: "UNKNOWN_STYLE",
      message: "Choose a renovation style before generating redesign ideas.",
      status: 404,
      retryable: false,
      details: { styleId },
    });
  }

  if (
    !isRoomType(roomType) ||
    !isRenovationScope(renovationScope) ||
    !isQualityLevel(qualityLevel)
  ) {
    return jsonLoggedError({
      requestId,
      code: "BAD_REQUEST",
      message:
        "Choose room type, renovation scope, and quality level before generating redesign ideas.",
      status: 400,
      retryable: false,
      details: {
        roomType,
        renovationScope,
        qualityLevel,
      },
    });
  }

  if (!allowedImageTypes.has(image.type)) {
    return jsonLoggedError({
      requestId,
      code: "UNSUPPORTED_IMAGE_TYPE",
      message: "Use a JPG, PNG, or WebP room photo.",
      status: 415,
      retryable: false,
      details: {
        imageType: image.type || "unknown",
      },
    });
  }

  if (image.size > maxImageBytes) {
    return jsonLoggedError({
      requestId,
      code: "IMAGE_TOO_LARGE",
      message: "Use a room photo smaller than 8 MB.",
      status: 413,
      retryable: false,
      details: {
        imageBytes: image.size,
        maxImageBytes,
      },
    });
  }

  const prompt = buildPrompt({
    style,
    roomType,
    roomSizeM2,
    renovationScope,
    qualityLevel,
    materialPreferences,
    notes,
  });
  const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1-mini";
  const providerEndpoint = debug.disableImageInput
    ? "/images/generations"
    : "/images/edits";

  const providerPayloadSummary = {
    requestId,
    endpoint: providerEndpoint,
    model,
    promptLength: prompt.length,
    promptPreview: debug.enabled ? truncateForLog(prompt, 300) : undefined,
    styleId: style.id,
    styleName: style.name,
    roomType,
    roomSizeM2: roomSizeM2 ?? null,
    renovationScope,
    qualityLevel,
    materialPreferencesLength: materialPreferences.length,
    notesLength: notes.length,
    disableImageInput: debug.disableImageInput,
    imageName: image.name,
    imageType: image.type,
    imageBytes: image.size,
    count,
    size: "1024x1024",
  };

  logRedesignEvent("provider_request_prepared", providerPayloadSummary);

  const providerBody = debug.disableImageInput
    ? JSON.stringify({
        model,
        prompt,
        n: 1,
        size: "1024x1024",
      })
    : (() => {
        const providerForm = new FormData();
        providerForm.set("model", model);
        providerForm.set("image", image);
        providerForm.set("prompt", prompt);
        providerForm.set("n", "1");
        providerForm.set("size", "1024x1024");
        return providerForm;
      })();

  let providerResponse: Response;

  try {
    providerResponse = await postToImageProvider({
      apiKey,
      endpoint: providerEndpoint,
      body: providerBody,
      contentType: debug.disableImageInput ? "application/json" : undefined,
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";

    return jsonLoggedError({
      requestId,
      code: aborted ? "AI_TIMEOUT" : "AI_PROVIDER_ERROR",
      message: aborted
        ? "AI redesign generation took too long. Try again with a smaller image."
        : "AI redesign generation failed. Try again later.",
      status: aborted ? 504 : 502,
      retryable: true,
      details: {
        imageBytes: image.size,
        imageType: image.type,
        styleId: style.id,
        roomType,
        renovationScope,
        qualityLevel,
      },
      error,
    });
  }

  const responseText = await providerResponse.text();
  const openaiRequestId =
    providerResponse.headers.get("x-request-id") ??
    providerResponse.headers.get("openai-request-id") ??
    undefined;

  logRedesignEvent("provider_response_received", {
    requestId,
    endpoint: providerEndpoint,
    status: providerResponse.status,
    statusText: providerResponse.statusText,
    openaiRequestId: openaiRequestId ?? null,
    responseLength: responseText.length,
    responseBody: debug.logFullOpenAIResponse
      ? responseText
      : truncateForLog(responseText, 500),
  });

  let payload: OpenAIImageResponse;

  try {
    payload = responseText
      ? (JSON.parse(responseText) as OpenAIImageResponse)
      : {};
  } catch (error) {
    return jsonLoggedError({
      requestId,
      code: "AI_PROVIDER_ERROR",
      message: "AI redesign generation returned an unreadable response.",
      status: 502,
      retryable: true,
      details: {
        endpoint: providerEndpoint,
        providerStatus: providerResponse.status,
        providerStatusText: providerResponse.statusText,
        openaiRequestId,
        responsePreview: responseText.slice(0, 500),
      },
      error,
    });
  }

  if (!providerResponse.ok) {
    return jsonLoggedError({
      requestId,
      code: "AI_PROVIDER_ERROR",
      message: payload.error?.message ?? "AI redesign generation failed.",
      status: 502,
      retryable: true,
      details: {
        endpoint: providerEndpoint,
        providerStatus: providerResponse.status,
        providerStatusText: providerResponse.statusText,
        openaiRequestId,
        imageBytes: image.size,
        imageType: image.type,
        responsePreview: responseText.slice(0, 500),
      },
    });
  }

  const imageUrls = getImageUrlsFromPayload(payload, count).slice(0, 1);

  if (imageUrls.length === 0) {
    return jsonLoggedError({
      requestId,
      code: "AI_PROVIDER_ERROR",
      message: "AI redesign generation returned no usable image. Try again.",
      status: 502,
      retryable: true,
      details: {
        endpoint: providerEndpoint,
        providerStatus: providerResponse.status,
        openaiRequestId,
        responsePreview: responseText.slice(0, 500),
      },
    });
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

  logRedesignEvent("request_success", {
    requestId,
    endpoint: providerEndpoint,
    openaiRequestId: openaiRequestId ?? null,
    imageBytes: image.size,
    variantCount: variants.length,
    usedImageInput: !debug.disableImageInput,
  });

  return Response.json({
    ok: true,
    variants,
    meta: {
      styleId: style.id,
      styleName: style.name,
      model,
      imageBytes: image.size,
    },
  });
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    return await handlePost(request, requestId);
  } catch (error) {
    return jsonLoggedError({
      requestId,
      code: "INTERNAL_ERROR",
      message: "AI redesign generation failed unexpectedly. Try again later.",
      status: 500,
      retryable: true,
      error,
    });
  }
}
