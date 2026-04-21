import type {
  EstimateLineItem,
  ProjectSession,
  RenovationEstimate,
  WizardAnswers,
} from "@/features/projects/types";

const roomSizeMultiplier: Record<WizardAnswers["roomSize"], number> = {
  small: 0.8,
  medium: 1,
  large: 1.3,
};

const roomTypeMultiplier: Record<WizardAnswers["roomType"], number> = {
  kitchen: 1.35,
  bathroom: 1.25,
  "living-room": 1,
  bedroom: 0.9,
};

const scopeCosts: Record<string, { label: string; low: number; high: number }> = {
  paint: { label: "Paint and wall prep", low: 700, high: 1800 },
  flooring: { label: "Flooring refresh", low: 1800, high: 5200 },
  lighting: { label: "Lighting updates", low: 500, high: 1800 },
  fixtures: { label: "Fixtures and hardware", low: 600, high: 2400 },
  storage: { label: "Storage or cabinetry", low: 1600, high: 7000 },
};

const goalMultiplier: Record<WizardAnswers["renovationGoal"], number> = {
  "cosmetic-refresh": 0.9,
  "functional-upgrade": 1.1,
  "resale-prep": 1,
};

export const scopeOptions = [
  { id: "paint", label: "Paint and wall prep" },
  { id: "flooring", label: "Flooring" },
  { id: "lighting", label: "Lighting" },
  { id: "fixtures", label: "Fixtures and hardware" },
  { id: "storage", label: "Storage or cabinetry" },
];

export function calculateEstimate(project: ProjectSession): RenovationEstimate {
  const answers = project.wizardAnswers;

  if (!answers) {
    return {
      lowTotal: 0,
      highTotal: 0,
      lineItems: [],
      assumptions: ["Complete the planning wizard to generate an estimate."],
    };
  }

  const multiplier =
    roomSizeMultiplier[answers.roomSize] *
    roomTypeMultiplier[answers.roomType] *
    goalMultiplier[answers.renovationGoal];

  const selectedScope =
    answers.scopeItems.length > 0 ? answers.scopeItems : ["paint"];

  const lineItems: EstimateLineItem[] = selectedScope.map((scopeId) => {
    const cost = scopeCosts[scopeId] ?? scopeCosts.paint;

    return {
      label: cost.label,
      low: Math.round(cost.low * multiplier),
      high: Math.round(cost.high * multiplier),
      explanation: `Adjusted for a ${answers.roomSize.replace("-", " ")} ${answers.roomType.replace("-", " ")} and ${answers.renovationGoal.replace("-", " ")} goal.`,
    };
  });

  const subtotalLow = lineItems.reduce((sum, item) => sum + item.low, 0);
  const subtotalHigh = lineItems.reduce((sum, item) => sum + item.high, 0);
  const contingencyLow = Math.round(subtotalLow * 0.12);
  const contingencyHigh = Math.round(subtotalHigh * 0.18);

  lineItems.push({
    label: "Planning contingency",
    low: contingencyLow,
    high: contingencyHigh,
    explanation: "A simple buffer for unknowns, material variance, and small scope changes.",
  });

  return {
    lowTotal: subtotalLow + contingencyLow,
    highTotal: subtotalHigh + contingencyHigh,
    lineItems,
    assumptions: [
      "Estimate is a planning range, not a contractor quote.",
      "Pricing is deterministic and based only on the selected inputs.",
      "Labor, material quality, and local market conditions can change actual costs.",
    ],
  };
}

