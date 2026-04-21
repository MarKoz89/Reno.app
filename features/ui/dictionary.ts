import type { Language } from "@/features/ui/use-preferences";

export const dictionary = {
  en: {
    reportTitle: "Renovation planning report",
    planningInsights: "Planning insights",
    estimateSummary: "Estimate summary",
    resultsLabel: "Results",
    resultsTitle: "Your renovation estimate",
    estimatedPlanningRange: "Estimated planning range",
    midEstimate: "Mid estimate",
    costBreakdown: "Cost breakdown",
  },
  cs: {
    reportTitle: "Plán rekonstrukce",
    planningInsights: "Plánovací doporučení",
    estimateSummary: "Souhrn odhadu",
    resultsLabel: "Výsledky",
    resultsTitle: "Váš odhad rekonstrukce",
    estimatedPlanningRange: "Orientační rozpětí",
    midEstimate: "Střední odhad",
    costBreakdown: "Rozpis nákladů",
  },
} as const;

export function getDictionary(language: Language) {
  return dictionary[language];
}
