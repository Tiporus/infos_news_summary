// Visual theme par catégorie + région : gradient, icône SVG/emoji, couleur
// d'accent. Sert à donner une identité visuelle à chaque story.

import type { Category, Region } from "@/types";

export type CategoryTheme = {
  emoji: string;
  label: string;
  gradient: string; // tailwind classes "from-… via-… to-…"
  accent: string; // tailwind text color for the accent badge
  ring: string; // tailwind ring color for borders
};

export const CATEGORY_THEME: Record<Category, CategoryTheme> = {
  POLITICS: {
    emoji: "🏛️",
    label: "Politique",
    gradient: "from-indigo-600 via-blue-600 to-sky-700",
    accent: "text-sky-100",
    ring: "ring-sky-500/30",
  },
  ECONOMY: {
    emoji: "📈",
    label: "Économie",
    gradient: "from-emerald-600 via-teal-600 to-cyan-700",
    accent: "text-emerald-100",
    ring: "ring-emerald-500/30",
  },
  TECH: {
    emoji: "💻",
    label: "Tech",
    gradient: "from-violet-600 via-fuchsia-600 to-pink-600",
    accent: "text-violet-100",
    ring: "ring-violet-500/30",
  },
  WORLD: {
    emoji: "🌍",
    label: "International",
    gradient: "from-amber-600 via-orange-600 to-red-600",
    accent: "text-amber-100",
    ring: "ring-amber-500/30",
  },
  SCIENCE: {
    emoji: "🔬",
    label: "Sciences",
    gradient: "from-cyan-600 via-blue-600 to-indigo-700",
    accent: "text-cyan-100",
    ring: "ring-cyan-500/30",
  },
  CULTURE: {
    emoji: "🎭",
    label: "Culture",
    gradient: "from-rose-600 via-pink-600 to-fuchsia-700",
    accent: "text-rose-100",
    ring: "ring-rose-500/30",
  },
  SPORTS: {
    emoji: "⚽",
    label: "Sports",
    gradient: "from-lime-600 via-green-600 to-emerald-700",
    accent: "text-lime-100",
    ring: "ring-lime-500/30",
  },
  HEALTH: {
    emoji: "🏥",
    label: "Santé",
    gradient: "from-teal-600 via-emerald-600 to-green-700",
    accent: "text-teal-100",
    ring: "ring-teal-500/30",
  },
};

export const REGION_LABEL: Record<Region, string> = {
  FR: "France",
  EU: "Europe",
  WORLD: "Monde",
};
