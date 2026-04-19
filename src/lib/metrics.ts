import type { MetricsJson } from "@/types/dashboard";

export const dribbleTotal = (d: MetricsJson["dribble"]) =>
  d.inAndOut + d.crossover + d.vLeft + d.vRight + d.betweenLegsLeft + d.betweenLegsRight;

export const passingTotal = (p: MetricsJson["passing"]) =>
  p.chestPass + p.bouncePass + p.overheadPass;

export const overallScore = (m: MetricsJson) =>
  dribbleTotal(m.dribble) + passingTotal(m.passing) + m.layUp + m.shooting;
