import type { RenovationStyle } from "@/features/projects/types";

export const renovationStyles: RenovationStyle[] = [
  {
    id: "warm-modern",
    name: "Warm Modern",
    description: "Clean lines, soft neutrals, warm wood, and practical finishes.",
  },
  {
    id: "classic-bright",
    name: "Classic Bright",
    description: "Light colors, timeless fixtures, and a fresh move-in-ready feel.",
  },
  {
    id: "minimal-calm",
    name: "Minimal Calm",
    description: "Simple surfaces, low visual clutter, and a quiet color palette.",
  },
];

export function getStyleById(styleId: string) {
  return renovationStyles.find((style) => style.id === styleId);
}

