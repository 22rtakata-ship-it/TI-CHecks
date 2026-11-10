export interface ValidityRecord {
  id: string;
  date: string;
  store: string;
  expired: number;
  atRisk: number;
  unlinked: number;
  updatedAt: string;
}

export type ValidityMetric = "expired" | "atRisk" | "unlinked";

export interface ValidityTrend {
  initial: number | null;
  latest: number | null;
  change: number | null;
  reductionPercent: number | null;
  direction: "up" | "down" | "stable" | "insufficient";
}
