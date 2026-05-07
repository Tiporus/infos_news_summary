import type { Bias, BiasCounts } from "@/types";
import { BIASES, EMPTY_BIAS_COUNTS } from "@/types";

export const BIAS_LABEL: Record<Bias, string> = {
  LEFT: "Gauche",
  CENTER_LEFT: "Centre-gauche",
  CENTER: "Centre",
  CENTER_RIGHT: "Centre-droit",
  RIGHT: "Droite",
};

export const BIAS_SHORT: Record<Bias, string> = {
  LEFT: "G",
  CENTER_LEFT: "CG",
  CENTER: "C",
  CENTER_RIGHT: "CD",
  RIGHT: "D",
};

// Tailwind background classes for the BiasBar segments
export const BIAS_BG: Record<Bias, string> = {
  LEFT: "bg-blue-600",
  CENTER_LEFT: "bg-blue-400",
  CENTER: "bg-zinc-400",
  CENTER_RIGHT: "bg-red-400",
  RIGHT: "bg-red-600",
};

export const BIAS_TEXT: Record<Bias, string> = {
  LEFT: "text-blue-700 dark:text-blue-400",
  CENTER_LEFT: "text-blue-500 dark:text-blue-300",
  CENTER: "text-zinc-600 dark:text-zinc-300",
  CENTER_RIGHT: "text-red-500 dark:text-red-300",
  RIGHT: "text-red-700 dark:text-red-400",
};

export function countByBias(biases: string[]): BiasCounts {
  const counts: BiasCounts = { ...EMPTY_BIAS_COUNTS };
  for (const b of biases) {
    if (b in counts) counts[b as Bias]++;
  }
  return counts;
}

export function totalSources(counts: BiasCounts): number {
  return BIASES.reduce((acc, b) => acc + counts[b], 0);
}

/**
 * A "blindspot" is a story where >= 75 % of coverage sits on a single side.
 * Returns the dominant side ("LEFT" | "RIGHT") or null if the coverage is balanced.
 */
export function detectBlindspot(counts: BiasCounts): "LEFT" | "RIGHT" | null {
  const total = totalSources(counts);
  if (total < 3) return null;
  const left = counts.LEFT + counts.CENTER_LEFT;
  const right = counts.CENTER_RIGHT + counts.RIGHT;
  if (left / total >= 0.75 && right === 0) return "LEFT";
  if (right / total >= 0.75 && left === 0) return "RIGHT";
  return null;
}
