import {
  pricingCatalog,
  roomTemplateByType,
} from "@/data/pricing-catalog";
import type {
  ScopeItemRule,
  RoomPricingTemplate,
} from "@/features/estimation/pricing-types";
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
  roomTemplate: RoomPricingTemplate;
  usedFallbacks: string[];
  missingFields: string[];
};

export const renovationScopeOptions = Object.values(
  pricingCatalog.scopeModifiers,
).map(({ id, label, description }) => ({
  id,
  label,
  description,
}));

export const qualityLevelOptions = Object.values(pricingCatalog.qualityBands).map(
  ({ id, label, description }) => ({
    id,
    label,
    description,
  }),
);

function getRoomTemplate(roomType: RoomType) {
  return roomTemplateByType[roomType];
}

function normalizeInput(input: CostInput): NormalizedCostInput {
  const usedFallbacks: string[] = [];
  const missingFields: string[] = [];

  if (!input.roomType) {
    missingFields.push("room type");
    usedFallbacks.push("Room type was missing, so the default room template was used.");
  }

  const roomType = input.roomType ?? pricingCatalog.defaultRoomType;
  const roomTemplate = getRoomTemplate(roomType);

  if (!input.roomSizeM2 || input.roomSizeM2 <= 0) {
    missingFields.push("room size");
    usedFallbacks.push(
      `Room size was missing, so a ${roomTemplate.defaultRoomSizeM2} m2 planning size was used.`,
    );
  }

  if (!input.renovationScope) {
    missingFields.push("renovation scope");
    usedFallbacks.push("Renovation scope was missing, so standard scope was used.");
  }

  if (!input.qualityLevel) {
    missingFields.push("quality level");
    usedFallbacks.push("Quality level was missing, so standard quality was used.");
  }

  return {
    roomType,
    roomSizeM2:
      input.roomSizeM2 && input.roomSizeM2 > 0
        ? input.roomSizeM2
        : roomTemplate.defaultRoomSizeM2,
    renovationScope: input.renovationScope ?? pricingCatalog.defaultRenovationScope,
    qualityLevel: input.qualityLevel ?? pricingCatalog.defaultQualityLevel,
    notes: input.notes ?? "",
    hasSelectedStyle: input.hasSelectedStyle,
    uploadedImageCount: input.uploadedImageCount,
    roomTemplate,
    usedFallbacks,
    missingFields,
  };
}

function getComplexityFactor(input: NormalizedCostInput) {
  let factor = 1;

  // Kitchens and bathrooms usually carry more Czech-market trade coordination and hidden-condition risk.
  if (input.roomType === "kitchen" || input.roomType === "bathroom") {
    factor += 0.08;
  }

  // Full renovations have more unknowns than finish-only refreshes.
  if (input.renovationScope === "full") {
    factor += 0.14;
  }

  // Sparse notes make the early estimate less specific.
  if (!input.notes.trim()) {
    factor += 0.05;
  }

  return Math.min(factor, 1.3);
}

function isRealisticRoomSize(input: NormalizedCostInput) {
  const range = input.roomTemplate.realisticSizeM2;

  return input.roomSizeM2 >= range.min && input.roomSizeM2 <= range.max;
}

function getConfidence(input: NormalizedCostInput) {
  let confidence = 55;
  const positiveReasons: string[] = [];
  const limitingReasons: string[] = [];

  if (input.missingFields.length > 0) {
    confidence -= input.missingFields.length * 8;
    limitingReasons.push(
      `Missing ${input.missingFields.join(", ")} reduced confidence because defaults were used.`,
    );
  }

  if (input.missingFields.includes("room size")) {
    confidence -= 10;
    limitingReasons.push("Room size was not provided, so a default planning size was used.");
  } else if (isRealisticRoomSize(input)) {
    confidence += 14;
    positiveReasons.push("Room size is provided and falls within a realistic planning range.");
  } else {
    confidence -= 10;
    limitingReasons.push("Room size looks unusual, so the estimate is less specific.");
  }

  if (!input.missingFields.includes("renovation scope")) {
    confidence += 8;
    positiveReasons.push("Renovation scope is defined, which helps size the work.");
  }

  if (!input.missingFields.includes("quality level")) {
    confidence += 8;
    positiveReasons.push("Quality level is selected, which helps set material allowances.");
  }

  if (!input.notes.trim()) {
    confidence -= 6;
    limitingReasons.push("No project notes were added, so site-specific details are limited.");
  } else {
    confidence += 8;
    positiveReasons.push("Project notes add useful context about priorities and constraints.");
  }

  if (!input.hasSelectedStyle) {
    confidence -= 4;
    limitingReasons.push("No style was selected, so finish expectations are less clear.");
  } else {
    confidence += 5;
    positiveReasons.push("Selected style gives more context for finish expectations.");
  }

  if (input.uploadedImageCount === 0) {
    confidence -= 8;
    limitingReasons.push("No room photo was added, so the estimate relies only on written inputs.");
  } else {
    confidence += 7;
    positiveReasons.push("A room photo improves context for the saved planning session.");
  }

  return {
    score: Math.max(35, Math.min(95, confidence)),
    reasons: [...positiveReasons, ...limitingReasons].slice(0, 4),
  };
}

function getRuleQuantity(
  rule: ScopeItemRule,
  input: NormalizedCostInput,
) {
  if (rule.quantityBasis === "room-size") {
    return input.roomSizeM2;
  }

  if (rule.quantityBasis === "room-template") {
    return (
      input.roomTemplate.quantityOverrides?.[rule.id] ?? rule.defaultQuantity
    );
  }

  return rule.defaultQuantity;
}

function getLineItemSubtotal(rule: ScopeItemRule, input: NormalizedCostInput) {
  const quantity = getRuleQuantity(rule, input);
  const scopeModifier = pricingCatalog.scopeModifiers[input.renovationScope];
  const marketFactor =
    pricingCatalog.marketFactors[pricingCatalog.defaultMarketFactorId];
  const materialUnitCost = rule.materialUnitCostByQuality[input.qualityLevel];

  const laborLow =
    quantity *
    rule.laborUnitCost.low *
    scopeModifier.laborMultiplier *
    marketFactor.laborMultiplier;
  const laborMid =
    quantity *
    rule.laborUnitCost.mid *
    scopeModifier.laborMultiplier *
    marketFactor.laborMultiplier;
  const laborHigh =
    quantity *
    rule.laborUnitCost.high *
    scopeModifier.laborMultiplier *
    marketFactor.laborMultiplier;

  const materialLow =
    quantity *
    materialUnitCost.low *
    scopeModifier.materialMultiplier *
    marketFactor.materialMultiplier;
  const materialMid =
    quantity *
    materialUnitCost.mid *
    scopeModifier.materialMultiplier *
    marketFactor.materialMultiplier;
  const materialHigh =
    quantity *
    materialUnitCost.high *
    scopeModifier.materialMultiplier *
    marketFactor.materialMultiplier;

  return {
    low: laborLow + materialLow,
    mid: laborMid + materialMid,
    high: laborHigh + materialHigh,
  };
}

function createLineItems(
  input: NormalizedCostInput,
  complexityFactor: number,
) {
  const scopeItems =
    input.roomTemplate.scopeItemsByRenovationScope[input.renovationScope];
  const lineItems = scopeItems
    .map((itemId) => pricingCatalog.scopeItemRules[itemId])
    .filter((rule) => rule.roomTypes.includes(input.roomType))
    .map<EstimateLineItem>((rule) => {
      const subtotal = getLineItemSubtotal(rule, input);

      return {
        label: rule.label,
        low: Math.round(subtotal.low),
        mid: Math.round(subtotal.mid * complexityFactor),
        high: Math.round(subtotal.high * complexityFactor),
        explanation: rule.explanation,
      };
    });

  const scopeModifier = pricingCatalog.scopeModifiers[input.renovationScope];
  const subtotal = lineItems.reduce(
    (totals, item) => ({
      low: totals.low + item.low,
      mid: totals.mid + item.mid,
      high: totals.high + item.high,
    }),
    { low: 0, mid: 0, high: 0 },
  );

  lineItems.push({
    label: "Planning contingency",
    low: Math.round(subtotal.low * scopeModifier.contingencyRate),
    mid: Math.round(subtotal.mid * scopeModifier.contingencyRate),
    high: Math.round(subtotal.high * scopeModifier.contingencyRate),
    explanation:
      "Buffer for unknowns, small scope changes, and pricing variance.",
  });

  return lineItems;
}

function createAssumptions(input: NormalizedCostInput, complexityFactor: number) {
  const marketFactor =
    pricingCatalog.marketFactors[pricingCatalog.defaultMarketFactorId];

  return [
    "Estimate is an early Czech-market planning range, not a contractor quote.",
    "The catalog is static MVP planning data for Czech renovation structure and does not use live supplier or contractor price feeds.",
    "Costs are built from category line items with separate labor and material allowances.",
    "Room templates determine which scope items are included for the selected room and scope.",
    "Quality level mainly affects visible materials, fixtures, cabinets, countertops, lighting, flooring, and tiling.",
    "Preparation, demolition, waterproofing, and basic trade materials are treated as lower-variance planning allowances.",
    "City, supplier, contractor availability, VAT treatment, and final material selection can move the real quote.",
    "Prague, Brno, and regional differences are not fully modeled yet.",
    "Hidden substrate, moisture, panelak, older masonry, plumbing, and electrical conditions can significantly affect full renovations.",
    `Market factor applied: ${marketFactor.label}.`,
    `Pricing catalog version: ${pricingCatalog.catalogVersion}.`,
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
  const confidence = getConfidence(normalizedInput);
  const lineItems = createLineItems(normalizedInput, complexityFactor);

  return {
    engineVersion: "v1",
    lowTotal: lineItems.reduce((sum, item) => sum + item.low, 0),
    midTotal: lineItems.reduce((sum, item) => sum + item.mid, 0),
    highTotal: lineItems.reduce((sum, item) => sum + item.high, 0),
    lineItems,
    assumptions: createAssumptions(normalizedInput, complexityFactor),
    exclusions: pricingCatalog.exclusions,
    confidenceScore: confidence.score,
    confidenceReasons: confidence.reasons,
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
  const roomType = answers.roomType;
  const roomTemplate = getRoomTemplate(roomType);

  return {
    roomType: roomType.replace("-", " "),
    roomSize: `${answers.roomSizeM2 ?? roomTemplate.defaultRoomSizeM2} m2`,
    renovationScope: answers.renovationScope ?? pricingCatalog.defaultRenovationScope,
    qualityLevel: answers.qualityLevel ?? pricingCatalog.defaultQualityLevel,
  };
}
