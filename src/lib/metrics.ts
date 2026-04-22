import type { MetricsJson } from "@/types/dashboard";

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

export const parseMetricsJson = (metricsJson: string): number[] => {
  try {
    const m = JSON.parse(metricsJson);
    return [
      ...Object.values(m.dribble ?? {}),
      ...Object.values(m.passing ?? {}),
      m.layUp,
      m.shooting,
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
