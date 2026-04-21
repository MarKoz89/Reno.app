import type {
  EstimateLineItem,
  ProjectSession,
  QualityLevel,
  RenovationEstimate,
  RenovationScope,
  RoomType,
  WizardAnswers,
} from "@/features/projects/types";

type CostInput = {
  roomType?: RoomType;
  roomSizeM2?: number;
  renovationScope?: RenovationScope;
  qualityLevel?: QualityLevel;
  notes?: string;
  hasSelectedStyle: boolean;
  uploadedImageCount: number;
};

type NormalizedCostInput = {
  roomType: RoomType;
  roomSizeM2: number;
  renovationScope: RenovationScope;
  qualityLevel: QualityLevel;
  notes: string;
  hasSelectedStyle: boolean;
  uploadedImageCount: number;
  usedFallbacks: string[];
};

type LineItemRule = {
  label: string;
  share: number;
  explanation: string;
};

const defaultRoomType: RoomType = "kitchen";
const defaultRoomSizeM2 = 12;
const defaultRenovationScope: RenovationScope = "standard";
const defaultQualityLevel: QualityLevel = "standard";

// Standard-scope, standard-quality planning rates in USD per square meter.
const costPerM2ByRoomType: Record<RoomType, number> = {
  kitchen: 1800,
  bathroom: 2200,
  "living-room": 650,
  bedroom: 550,
};

const scopeMultipliers: Record<RenovationScope, number> = {
  light: 0.55,
  standard: 1,
  full: 1.65,
};

const qualityMultipliers: Record<QualityLevel, number> = {
  budget: 0.8,
  standard: 1,
  premium: 1.35,
};

const defaultLineItems: LineItemRule[] = [
  {
    label: "Preparation and protection",
    share: 0.1,
    explanation: "Room protection, surface prep, minor removal, and setup.",
  },
  {
    label: "Labor and installation",
    share: 0.34,
    explanation: "Core trade labor and installation time for the selected scope.",
  },
  {
    label: "Materials and finishes",
    share: 0.3,
    explanation: "Finish materials such as paint, flooring, tile, trim, or surfaces.",
  },
  {
    label: "Fixtures and equipment",
    share: 0.16,
    explanation: "Visible fixtures, hardware, lighting, and room-specific fittings.",
  },
  {
    label: "Planning contingency",
    share: 0.1,
    explanation: "Buffer for unknowns, small scope changes, and pricing variance.",
  },
];

const wetRoomLineItems: LineItemRule[] = [
  {
    label: "Preparation and protection",
    share: 0.1,
    explanation: "Room protection, surface prep, minor removal, and setup.",
  },
  {
    label: "Labor and installation",
    share: 0.34,
    explanation: "Core trade labor and installation time for the selected scope.",
  },
  {
    label: "Materials and finishes",
    share: 0.24,
    explanation: "Finish materials such as tile, surfaces, paint, and flooring.",
  },
  {
    label: "Fixtures and equipment",
    share: 0.22,
    explanation: "Room-specific fixtures, hardware, lighting, and equipment allowances.",
  },
  {
    label: "Planning contingency",
    share: 0.1,
    explanation: "Buffer for unknowns, small scope changes, and pricing variance.",
  },
];

const exclusions = [
  "Permit fees beyond a basic planning allowance.",
  "Structural engineering or structural repairs.",
  "Hazardous material testing or remediation.",
  "Major plumbing, electrical, or HVAC service upgrades.",
  "Furniture, appliances, decor, financing, tax, and contractor margin variability.",
];

export const renovationScopeOptions: Array<{
  id: RenovationScope;
  label: string;
  description: string;
}> = [
  {
    id: "light",
    label: "Light",
    description: "Cosmetic updates, finishes, and minor fixture changes.",
  },
  {
    id: "standard",
    label: "Standard",
    description: "Typical refresh with finishes, fixtures, and installation work.",
  },
  {
    id: "full",
    label: "Full",
    description: "Broad renovation scope with trade-heavy work and more unknowns.",
  },
];

export const qualityLevelOptions: Array<{
  id: QualityLevel;
  label: string;
  description: string;
}> = [
  {
    id: "budget",
    label: "Budget",
    description: "Cost-conscious finishes and simple, durable choices.",
  },
  {
    id: "standard",
    label: "Standard",
    description: "Balanced materials and broadly available fixtures.",
  },
  {
    id: "premium",
    label: "Premium",
    description: "Higher-end finishes, fixtures, and detail allowances.",
  },
];

function normalizeInput(input: CostInput): NormalizedCostInput {
  const usedFallbacks: string[] = [];

  if (!input.roomType) {
    usedFallbacks.push("Room type was missing, so kitchen rates were used.");
  }

  if (!input.roomSizeM2 || input.roomSizeM2 <= 0) {
    usedFallbacks.push("Room size was missing, so a 12 m2 planning size was used.");
  }

  if (!input.renovationScope) {
    usedFallbacks.push("Renovation scope was missing, so standard scope was used.");
  }

  if (!input.qualityLevel) {
    usedFallbacks.push("Quality level was missing, so standard quality was used.");
  }

  return {
    roomType: input.roomType ?? defaultRoomType,
    roomSizeM2:
      input.roomSizeM2 && input.roomSizeM2 > 0
        ? input.roomSizeM2
        : defaultRoomSizeM2,
    renovationScope: input.renovationScope ?? defaultRenovationScope,
    qualityLevel: input.qualityLevel ?? defaultQualityLevel,
    notes: input.notes ?? "",
    hasSelectedStyle: input.hasSelectedStyle,
    uploadedImageCount: input.uploadedImageCount,
    usedFallbacks,
  };
}

function getComplexityFactor(input: NormalizedCostInput) {
  let factor = 1;

  // Kitchens and bathrooms usually carry more trade coordination and fixture risk.
  if (input.roomType === "kitchen" || input.roomType === "bathroom") {
    factor += 0.08;
  }

  // Full renovations have more unknowns than finish-only refreshes.
  if (input.renovationScope === "full") {
    factor += 0.12;
  }

  // Sparse notes make the early estimate less specific.
  if (!input.notes.trim()) {
    factor += 0.05;
  }

  return Math.min(factor, 1.3);
}

function getConfidenceScore(input: NormalizedCostInput) {
  let confidence = 92;

  confidence -= input.usedFallbacks.length * 10;

  if (!input.notes.trim()) {
    confidence -= 5;
  }

  if (!input.hasSelectedStyle) {
    confidence -= 3;
  }

  if (input.uploadedImageCount === 0) {
    confidence -= 7;
  }

  return Math.max(35, Math.min(95, confidence));
}

function createLineItems(midTotal: number, input: NormalizedCostInput) {
  const rules =
    input.roomType === "kitchen" || input.roomType === "bathroom"
      ? wetRoomLineItems
      : defaultLineItems;

  return rules.map<EstimateLineItem>((rule) => {
    const mid = Math.round(midTotal * rule.share);

    return {
      label: rule.label,
      low: Math.round(mid * 0.9),
      mid,
      high: Math.round(mid * 1.15),
      explanation: rule.explanation,
    };
  });
}

function createAssumptions(input: NormalizedCostInput, complexityFactor: number) {
  return [
    "Estimate is a planning range, not a contractor quote.",
    "Costs are based on room type, room size, renovation scope, and quality level.",
    "Room size is treated as usable floor area in square meters.",
    "Pricing assumes no major structural repairs unless full scope is selected.",
    `Complexity factor applied: ${complexityFactor.toFixed(2)}.`,
    ...input.usedFallbacks,
    input.renovationScope === "full"
      ? "Full scope allows for broader trade coordination and higher unknowns."
      : "Existing room layout is assumed to remain mostly unchanged.",
  ];
}

function calculateCostEstimate(input: CostInput): RenovationEstimate {
  const normalizedInput = normalizeInput(input);
  const complexityFactor = getComplexityFactor(normalizedInput);

  const midBeforeRange =
    normalizedInput.roomSizeM2 *
    costPerM2ByRoomType[normalizedInput.roomType] *
    scopeMultipliers[normalizedInput.renovationScope] *
    qualityMultipliers[normalizedInput.qualityLevel] *
    complexityFactor;

  const midTotal = Math.round(midBeforeRange);
  const lineItems = createLineItems(midTotal, normalizedInput);

  return {
    engineVersion: "v1",
    lowTotal: lineItems.reduce((sum, item) => sum + item.low, 0),
    midTotal: lineItems.reduce((sum, item) => sum + item.mid, 0),
    highTotal: lineItems.reduce((sum, item) => sum + item.high, 0),
    lineItems,
    assumptions: createAssumptions(normalizedInput, complexityFactor),
    exclusions,
    confidenceScore: getConfidenceScore(normalizedInput),
  };
}

function toCostInput(project: ProjectSession): CostInput {
  const answers = project.wizardAnswers;

  return {
    roomType: answers?.roomType,
    roomSizeM2: answers?.roomSizeM2,
    renovationScope: answers?.renovationScope,
    qualityLevel: answers?.qualityLevel,
    notes: answers?.notes,
    hasSelectedStyle: Boolean(project.selectedStyle),
    uploadedImageCount: project.uploadedImages.length,
  };
}

export function calculateEstimate(project: ProjectSession): RenovationEstimate {
  return calculateCostEstimate(toCostInput(project));
}

export function getEstimateInputSummary(answers: WizardAnswers) {
  return {
    roomType: answers.roomType.replace("-", " "),
    roomSize: `${answers.roomSizeM2 ?? defaultRoomSizeM2} m2`,
    renovationScope: answers.renovationScope ?? defaultRenovationScope,
    qualityLevel: answers.qualityLevel ?? defaultQualityLevel,
  };
}
