import { getStyleById } from "@/data/renovation-styles";
import type {
  QualityLevel,
  RenovationScope,
  RoomType,
} from "@/features/projects/types";

export const runtime = "nodejs";

type PlanningErrorCode =
  | "BAD_REQUEST"
  | "UNKNOWN_STYLE"
  | "MISSING_AI_KEY"
  | "AI_TIMEOUT"
  | "AI_PROVIDER_ERROR"
  | "AI_RESPONSE_INVALID";

type PlanningRequest = {
  styleId?: unknown;
  roomType?: unknown;
  roomSizeM2?: unknown;
  renovationScope?: unknown;
  qualityLevel?: unknown;
  notes?: unknown;
};

type NormalizedPlanningRequest = {
  styleId: string;
  roomType: RoomType;
  roomSizeM2?: number;
  renovationScope: RenovationScope;
  qualityLevel: QualityLevel;
  notes: string;
};

type PlanningOutput = {
  recommendations: string[];
  contractorQuestions: string[];
  risks: string[];
};

type OpenAIResponsesPayload = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

const requestTimeoutMs = 45_000;
const roomTypes: RoomType[] = ["kitchen", "bathroom", "living-room", "bedroom"];
const renovationScopes: RenovationScope[] = ["light", "standard", "full"];
const qualityLevels: QualityLevel[] = ["budget", "standard", "premium"];
const moneyPatterns = [
  /\$/,
  /\bUSD\b/i,
  /\bEUR\b/i,
  /\bcurrency\b/i,
  /\bcost range\b/i,
  /\bprice\b/i,
  /\bpricing\b/i,
  /\bquote\b/i,
  /\bestimate total\b/i,
  /\bper square (meter|metre|foot|ft)\b/i,
  /\b\d+\s?-\s?\d+\s?(k|thousand|dollars|usd|eur)\b/i,
];

function jsonError(
  code: PlanningErrorCode,
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

function normalizeRequest(input: PlanningRequest) {
  if (typeof input.styleId !== "string" || !input.styleId.trim()) {
    return null;
  }

  if (!isRoomType(input.roomType)) {
    return null;
  }

  if (!isRenovationScope(input.renovationScope)) {
    return null;
  }

  if (!isQualityLevel(input.qualityLevel)) {
    return null;
  }

  const roomSizeM2 =
    typeof input.roomSizeM2 === "number" &&
    Number.isFinite(input.roomSizeM2) &&
    input.roomSizeM2 > 0
      ? input.roomSizeM2
      : undefined;

  return {
    styleId: input.styleId,
    roomType: input.roomType,
    roomSizeM2,
    renovationScope: input.renovationScope,
    qualityLevel: input.qualityLevel,
    notes: typeof input.notes === "string" ? input.notes.slice(0, 1200) : "",
  } satisfies NormalizedPlanningRequest;
}

function hasMoneyLikeOutput(text: string) {
  return moneyPatterns.some((pattern) => pattern.test(text));
}

function validateOutput(value: unknown): value is PlanningOutput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const output = value as Partial<PlanningOutput>;
  const groups = [
    { items: output.recommendations, min: 3, max: 5 },
    { items: output.contractorQuestions, min: 3, max: 5 },
    { items: output.risks, min: 2, max: 4 },
  ];

  return groups.every(({ items, min, max }) => {
    if (!Array.isArray(items) || items.length < min || items.length > max) {
      return false;
    }

    return items.every(
      (item) =>
        typeof item === "string" &&
        item.trim().length > 0 &&
        !hasMoneyLikeOutput(item),
    );
  });
}

function extractOutputText(payload: OpenAIResponsesPayload) {
  if (payload.output_text) {
    return payload.output_text;
  }

  return (
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .find((text): text is string => Boolean(text)) ?? ""
  );
}

function buildPrompt({
  input,
  style,
}: {
  input: NormalizedPlanningRequest;
  style: { name: string; description: string };
}) {
  return [
    "Create homeowner-friendly renovation planning insights for Reno App.",
    "Use only the provided inputs. Do not infer prices, cost ranges, budgets, savings, rates, allowances, discounts, or contractor quotes.",
    "Do not replace, critique, explain, or override Reno App's deterministic estimate engine.",
    "Do not mention currencies, numbers that look like prices, quote language, cost totals, or price-per-area language.",
    "Recommendations should be practical priorities for planning and decision-making.",
    "Contractor questions should clarify scope, site conditions, materials, sequencing, permits, or constraints without asking for prices.",
    "Risks should be phrased as things to confirm early, not guarantees or code, safety, permit, structural, electrical, plumbing, or HVAC certainty.",
    `Selected style: ${style.name}. ${style.description}`,
    `Room type: ${input.roomType}.`,
    `Room size: ${input.roomSizeM2 ? `${input.roomSizeM2} m2` : "not provided"}.`,
    `Renovation scope: ${input.renovationScope}.`,
    `Quality level: ${input.qualityLevel}.`,
    `User notes: ${input.notes || "None provided."}`,
  ].join(" ");
}

async function postToOpenAI({
  apiKey,
  body,
}: {
  apiKey: string;
  body: unknown;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    return await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
      "Planning insights are not configured yet.",
      500,
      false,
    );
  }

  let body: PlanningRequest;

  try {
    body = (await request.json()) as PlanningRequest;
  } catch {
    return jsonError(
      "BAD_REQUEST",
      "Send valid planning inputs as JSON.",
      400,
      false,
    );
  }

  const input = normalizeRequest(body);

  if (!input) {
    return jsonError(
      "BAD_REQUEST",
      "Planning insights need style, room type, scope, and quality level.",
      400,
      false,
    );
  }

  const style = getStyleById(input.styleId);

  if (!style) {
    return jsonError(
      "UNKNOWN_STYLE",
      "Choose a valid renovation style before generating planning insights.",
      404,
      false,
    );
  }

  const model = process.env.OPENAI_PLANNING_MODEL ?? "gpt-4.1-mini";
  const prompt = buildPrompt({ input, style });

  let providerResponse: Response;

  try {
    providerResponse = await postToOpenAI({
      apiKey,
      body: {
        model,
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "reno_planning_guidance",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["recommendations", "contractorQuestions", "risks"],
              properties: {
                recommendations: {
                  type: "array",
                  minItems: 3,
                  maxItems: 5,
                  items: { type: "string" },
                },
                contractorQuestions: {
                  type: "array",
                  minItems: 3,
                  maxItems: 5,
                  items: { type: "string" },
                },
                risks: {
                  type: "array",
                  minItems: 2,
                  maxItems: 4,
                  items: { type: "string" },
                },
              },
            },
          },
        },
      },
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";

    return jsonError(
      aborted ? "AI_TIMEOUT" : "AI_PROVIDER_ERROR",
      aborted
        ? "Planning insights took too long to generate."
        : "Planning insights could not be generated.",
      aborted ? 504 : 502,
      true,
    );
  }

  let payload: OpenAIResponsesPayload;

  try {
    payload = (await providerResponse.json()) as OpenAIResponsesPayload;
  } catch {
    return jsonError(
      "AI_PROVIDER_ERROR",
      "Planning insights returned an unreadable response.",
      502,
      true,
    );
  }

  if (!providerResponse.ok) {
    return jsonError(
      "AI_PROVIDER_ERROR",
      payload.error?.message ?? "Planning insights could not be generated.",
      502,
      true,
    );
  }

  let output: unknown;

  try {
    output = JSON.parse(extractOutputText(payload));
  } catch {
    return jsonError(
      "AI_RESPONSE_INVALID",
      "Planning insights were not returned in the expected format.",
      502,
      true,
    );
  }

  if (!validateOutput(output)) {
    return jsonError(
      "AI_RESPONSE_INVALID",
      "Planning insights included unsupported pricing or invalid content.",
      502,
      true,
    );
  }

  return Response.json({
    ok: true,
    recommendations: output.recommendations,
    contractorQuestions: output.contractorQuestions,
    risks: output.risks,
    meta: {
      styleId: style.id,
      styleName: style.name,
      model,
    },
  });
}
