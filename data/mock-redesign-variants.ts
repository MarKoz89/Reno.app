import type { RedesignVariant } from "@/features/projects/types";

const variantsByStyleId: Record<string, RedesignVariant[]> = {
  "warm-modern": [
    {
      id: "warm-modern-soft-wood",
      title: "Soft Wood Refresh",
      styleLabel: "Warm Modern",
      imageUrl: "https://placehold.co/900x675/f4eee6/3f342b?text=Soft+Wood+Refresh",
      description: "Keeps the room calm with warm wood tones, soft neutrals, and simple lighting updates.",
    },
    {
      id: "warm-modern-clean-contrast",
      title: "Clean Contrast",
      styleLabel: "Warm Modern",
      imageUrl: "https://placehold.co/900x675/e8e3db/2f2a24?text=Clean+Contrast",
      description: "Adds subtle contrast through darker accents while keeping the layout practical and open.",
    },
    {
      id: "warm-modern-easy-upgrade",
      title: "Easy Finish Upgrade",
      styleLabel: "Warm Modern",
      imageUrl: "https://placehold.co/900x675/f6f1ea/4d4035?text=Easy+Finish+Upgrade",
      description: "Focuses on lower-disruption finish changes, warmer surfaces, and cleaner fixture choices.",
    },
  ],
  "classic-bright": [
    {
      id: "classic-bright-fresh-white",
      title: "Fresh White Update",
      styleLabel: "Classic Bright",
      imageUrl: "https://placehold.co/900x675/f7f7f2/333333?text=Fresh+White+Update",
      description: "Brightens the room with light finishes, crisp trim, and timeless fixture updates.",
    },
    {
      id: "classic-bright-soft-blue",
      title: "Soft Color Accent",
      styleLabel: "Classic Bright",
      imageUrl: "https://placehold.co/900x675/eaf1f7/25394a?text=Soft+Color+Accent",
      description: "Uses a clean base palette with a gentle accent color for a more finished look.",
    },
    {
      id: "classic-bright-polished-refresh",
      title: "Polished Refresh",
      styleLabel: "Classic Bright",
      imageUrl: "https://placehold.co/900x675/f3f1ea/2f2f2f?text=Polished+Refresh",
      description: "Pairs durable finishes with simple lighting and hardware updates for a move-in-ready feel.",
    },
  ],
  "minimal-calm": [
    {
      id: "minimal-calm-quiet-neutrals",
      title: "Quiet Neutrals",
      styleLabel: "Minimal Calm",
      imageUrl: "https://placehold.co/900x675/ebe8df/2d2d2a?text=Quiet+Neutrals",
      description: "Simplifies the room with neutral surfaces, clean lines, and fewer visual distractions.",
    },
    {
      id: "minimal-calm-soft-light",
      title: "Soft Light",
      styleLabel: "Minimal Calm",
      imageUrl: "https://placehold.co/900x675/f2efe8/35332f?text=Soft+Light",
      description: "Emphasizes gentle lighting, uncluttered finishes, and a more restful room direction.",
    },
    {
      id: "minimal-calm-simple-surfaces",
      title: "Simple Surfaces",
      styleLabel: "Minimal Calm",
      imageUrl: "https://placehold.co/900x675/e7e5dc/31312d?text=Simple+Surfaces",
      description: "Focuses on simple materials, fewer transitions, and a practical low-clutter update.",
    },
  ],
};

const fallbackVariants: RedesignVariant[] = [
  {
    id: "generic-practical-refresh",
    title: "Practical Refresh",
    styleLabel: "Selected Style",
    imageUrl: "https://placehold.co/900x675/f1eee8/333333?text=Practical+Refresh",
    description: "Uses simple finish, lighting, and surface updates to make the room feel more intentional.",
  },
  {
    id: "generic-brighter-room",
    title: "Brighter Room",
    styleLabel: "Selected Style",
    imageUrl: "https://placehold.co/900x675/f7f6f1/333333?text=Brighter+Room",
    description: "Prioritizes lighter finishes and cleaner visual lines while keeping the plan approachable.",
  },
];

export function getMockRedesignVariants(styleId?: string) {
  if (!styleId) {
    return fallbackVariants;
  }

  return variantsByStyleId[styleId] ?? fallbackVariants;
}
