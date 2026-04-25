import type { MetricsJson } from "@/types/dashboard";

// ─── Flat metric definitions (display order) ──────────
export type FlatMetricDef = {
  key: string;
  label: string;
  /** Short label for compact table headers */
  shortLabel: string;
  /** Dot-path into MetricsJson for react-hook-form register() */
  path: string;
  max: number;
  /** Accessor function to read value from MetricsJson */
  getValue: (m: MetricsJson) => number;
};

export const FLAT_METRIC_DEFS: FlatMetricDef[] = [
  { key: "inAndOut",        label: "In & Out Dribble",     shortLabel: "I&O",     path: "dribble.inAndOut",        max: 99, getValue: (m) => m.dribble.inAndOut },
  { key: "crossover",       label: "Crossover",            shortLabel: "Cross",   path: "dribble.crossover",       max: 10, getValue: (m) => m.dribble.crossover },
  { key: "vLeft",           label: "V Dribble (Kiri)",     shortLabel: "V-L",     path: "dribble.vLeft",           max: 10, getValue: (m) => m.dribble.vLeft },
  { key: "vRight",          label: "V Dribble (Kanan)",    shortLabel: "V-R",     path: "dribble.vRight",          max: 10, getValue: (m) => m.dribble.vRight },
  { key: "betweenLegsLeft", label: "Between Legs (Kiri)",  shortLabel: "BTL-L",   path: "dribble.betweenLegsLeft", max: 10, getValue: (m) => m.dribble.betweenLegsLeft },
  { key: "betweenLegsRight",label: "Between Legs (Kanan)", shortLabel: "BTL-R",   path: "dribble.betweenLegsRight",max: 10, getValue: (m) => m.dribble.betweenLegsRight },
  { key: "chestPass",       label: "Chest Pass",           shortLabel: "Chest",   path: "passing.chestPass",       max: 10, getValue: (m) => m.passing.chestPass },
  { key: "bouncePass",      label: "Bounce Pass",          shortLabel: "Bounce",  path: "passing.bouncePass",      max: 10, getValue: (m) => m.passing.bouncePass },
  { key: "overheadPass",    label: "Overhead Pass",        shortLabel: "Over",    path: "passing.overheadPass",    max: 10, getValue: (m) => m.passing.overheadPass },
  { key: "layUp",           label: "Lay Up",               shortLabel: "Lay Up",  path: "layUp",                   max: 10, getValue: (m) => m.layUp },
  { key: "shooting",        label: "Shooting",             shortLabel: "Shoot",   path: "shooting",                max: 10, getValue: (m) => m.shooting },
];

/** Flatten MetricsJson into an ordered list of { label, value, max } */
export const flattenMetrics = (m: MetricsJson) =>
  FLAT_METRIC_DEFS.map((d) => ({ key: d.key, label: d.label, value: d.getValue(m), max: d.max }));

export const dribbleTotal = (d: MetricsJson["dribble"]) =>
  d.inAndOut + d.crossover + d.vLeft + d.vRight + d.betweenLegsLeft + d.betweenLegsRight;

export const passingTotal = (p: MetricsJson["passing"]) =>
  p.chestPass + p.bouncePass + p.overheadPass;

export const overallScore = (m: MetricsJson) =>
  dribbleTotal(m.dribble) + passingTotal(m.passing) + m.layUp + m.shooting;

// Normalize all 11 metrics to 0–100 scale, then average.
// inAndOut max = 99; all others max = 10.
export const averageScore = (m: MetricsJson): number => {
  const vals = [
    m.dribble.inAndOut / 99,
    m.dribble.crossover / 10,
    m.dribble.vLeft / 10,
    m.dribble.vRight / 10,
    m.dribble.betweenLegsLeft / 10,
    m.dribble.betweenLegsRight / 10,
    m.passing.chestPass / 10,
    m.passing.bouncePass / 10,
    m.passing.overheadPass / 10,
    m.layUp / 10,
    m.shooting / 10,
  ];
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100);
};

export const SCORE_MAX = 100;

export const parseMetricsJson = (metricsJson: unknown): number[] => {
  try {
    let m = metricsJson;
    if (typeof m === "string") {
      m = JSON.parse(m);
    }
    const obj = m as Record<string, any>;
    return [
      ...Object.values((obj.dribble as Record<string, any>) ?? {}),
      ...Object.values((obj.passing as Record<string, any>) ?? {}),
      obj.layUp,
      obj.shooting,
    ].filter((v): v is number => typeof v === "number");
  } catch {
    return [];
  }
};

export type Grade = { letter: "A" | "B" | "C" | "D"; label: string };

export const letterGrade = (score: number): Grade => {
  if (score >= 80) return { letter: "A", label: "SANGAT BAIK" };
  if (score >= 70) return { letter: "B", label: "BAIK" };
  if (score >= 60) return { letter: "C", label: "CUKUP BAIK" };
  return { letter: "D", label: "KURANG BAIK" };
};
