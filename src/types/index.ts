export const BIASES = [
  "LEFT",
  "CENTER_LEFT",
  "CENTER",
  "CENTER_RIGHT",
  "RIGHT",
] as const;
export type Bias = (typeof BIASES)[number];

export const FACTUALITIES = ["HIGH", "MIXED", "LOW"] as const;
export type Factuality = (typeof FACTUALITIES)[number];

export const CATEGORIES = [
  "POLITICS",
  "ECONOMY",
  "TECH",
  "WORLD",
  "SCIENCE",
  "CULTURE",
  "SPORTS",
  "HEALTH",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const REGIONS = ["FR", "EU", "WORLD"] as const;
export type Region = (typeof REGIONS)[number];

export type BiasCounts = Record<Bias, number>;

export const EMPTY_BIAS_COUNTS: BiasCounts = {
  LEFT: 0,
  CENTER_LEFT: 0,
  CENTER: 0,
  CENTER_RIGHT: 0,
  RIGHT: 0,
};
