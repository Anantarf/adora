import type { AttendanceStats, MetricsJson } from "@/types/dashboard";

export type EvaluationGradeBand = {
  letter: string;
  label: string;
  minScore: number;
};

export type EvaluationCategoryItem = {
  id: string;
  label: string;
  maxScore: number;
};

export type EvaluationCategoryConfig = {
  id: string;
  label: string;
  weight: number;
  items: EvaluationCategoryItem[];
};

export type EvaluationAttendanceConfig = {
  enabled: boolean;
  label: string;
  weight: number;
  statusScores: Record<keyof AttendanceStats, number>;
};

export type EvaluationConfigV2 = {
  version: "v2";
  categories: EvaluationCategoryConfig[];
  attendance: EvaluationAttendanceConfig;
  notesMaxLength: number;
  grading: EvaluationGradeBand[];
};

export type EvaluationMetricItemV2 = EvaluationCategoryItem & {
  score: number;
};

export type EvaluationMetricCategoryV2 = {
  id: string;
  label: string;
  weight: number;
  items: EvaluationMetricItemV2[];
};

export type EvaluationAttendanceSnapshotV2 = {
  label: string;
  weight: number;
  score: number;
  counts: AttendanceStats;
  totalSessions: number;
};

export type MetricsJsonV2 = {
  version: "v2";
  categories: EvaluationMetricCategoryV2[];
  attendance?: EvaluationAttendanceSnapshotV2 | null;
  notes?: string;
  grading: EvaluationGradeBand[];
};

export type FlatMetricRow = {
  key: string;
  label: string;
  shortLabel: string;
  value: number;
  max: number;
  categoryLabel?: string;
};

const DEFAULT_GRADING: EvaluationGradeBand[] = [
  { letter: "A", label: "SANGAT BAIK", minScore: 80 },
  { letter: "B", label: "BAIK", minScore: 70 },
  { letter: "C", label: "CUKUP BAIK", minScore: 60 },
  { letter: "D", label: "KURANG BAIK", minScore: 0 },
];

export const DEFAULT_EVALUATION_CONFIG_V2: EvaluationConfigV2 = {
  version: "v2",
  categories: [
    {
      id: "dribble",
      label: "Dribble",
      weight: 40,
      items: [
        { id: "in-and-out", label: "In & Out Dribble", maxScore: 99 },
        { id: "crossover", label: "Crossover", maxScore: 10 },
        { id: "v-left", label: "V Dribble (Kiri)", maxScore: 10 },
        { id: "v-right", label: "V Dribble (Kanan)", maxScore: 10 },
        { id: "between-legs-left", label: "Between Legs (Kiri)", maxScore: 10 },
        { id: "between-legs-right", label: "Between Legs (Kanan)", maxScore: 10 },
      ],
    },
    {
      id: "passing",
      label: "Passing",
      weight: 25,
      items: [
        { id: "chest-pass", label: "Chest Pass", maxScore: 10 },
        { id: "bounce-pass", label: "Bounce Pass", maxScore: 10 },
        { id: "overhead-pass", label: "Overhead Pass", maxScore: 10 },
      ],
    },
    {
      id: "finishing",
      label: "Finishing",
      weight: 20,
      items: [{ id: "lay-up", label: "Lay Up", maxScore: 10 }],
    },
    {
      id: "shooting",
      label: "Shooting",
      weight: 15,
      items: [{ id: "shooting", label: "Shooting", maxScore: 10 }],
    },
  ],
  attendance: {
    enabled: true,
    label: "Presensi",
    weight: 10,
    statusScores: {
      HADIR: 100,
      IZIN: 75,
      SAKIT: 75,
      ALPA: 0,
    },
  },
  notesMaxLength: 160,
  grading: DEFAULT_GRADING,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

function toNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeGradeBand(raw: unknown, fallback: EvaluationGradeBand[]): EvaluationGradeBand[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return fallback;
  }

  const bands = raw
    .map((entry, index) => {
      const band = entry as Partial<EvaluationGradeBand>;
      return {
        letter: typeof band.letter === "string" && band.letter.trim() ? band.letter.trim().toUpperCase() : fallback[index]?.letter ?? `G${index + 1}`,
        label: typeof band.label === "string" && band.label.trim() ? band.label.trim().toUpperCase() : fallback[index]?.label ?? `GRADE ${index + 1}`,
        minScore: Math.max(0, Math.min(100, toNumber(band.minScore, fallback[index]?.minScore ?? 0))),
      };
    })
    .sort((a, b) => b.minScore - a.minScore);

  return bands;
}

export function normalizeEvaluationConfig(raw: unknown): EvaluationConfigV2 {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_EVALUATION_CONFIG_V2;
  }

  const config = raw as Partial<EvaluationConfigV2>;
  const categories = Array.isArray(config.categories) ? config.categories : DEFAULT_EVALUATION_CONFIG_V2.categories;

  return {
    version: "v2",
    categories: categories
      .map((category, categoryIndex) => {
        const safeCategory = category as Partial<EvaluationCategoryConfig>;
        const label =
          typeof safeCategory.label === "string" && safeCategory.label.trim()
            ? safeCategory.label.trim()
            : DEFAULT_EVALUATION_CONFIG_V2.categories[categoryIndex]?.label ?? `Kategori ${categoryIndex + 1}`;
        const categoryId =
          typeof safeCategory.id === "string" && safeCategory.id.trim()
            ? safeCategory.id.trim()
            : slugify(label);
        const items = Array.isArray(safeCategory.items) ? safeCategory.items : [];

        return {
          id: categoryId,
          label,
          weight: Math.max(0, Math.min(100, toNumber(safeCategory.weight, DEFAULT_EVALUATION_CONFIG_V2.categories[categoryIndex]?.weight ?? 0))),
          items: items
            .map((item, itemIndex) => {
              const safeItem = item as Partial<EvaluationCategoryItem>;
              const itemLabel =
                typeof safeItem.label === "string" && safeItem.label.trim()
                  ? safeItem.label.trim()
                  : `Aspek ${itemIndex + 1}`;
              return {
                id:
                  typeof safeItem.id === "string" && safeItem.id.trim()
                    ? safeItem.id.trim()
                    : slugify(`${categoryId}-${itemLabel}`),
                label: itemLabel,
                maxScore: Math.max(1, toNumber(safeItem.maxScore, 10)),
              };
            })
            .filter((item) => item.label),
        };
      })
      .filter((category) => category.items.length > 0),
    attendance: {
      enabled: config.attendance?.enabled ?? DEFAULT_EVALUATION_CONFIG_V2.attendance.enabled,
      label:
        typeof config.attendance?.label === "string" && config.attendance.label.trim()
          ? config.attendance.label.trim()
          : DEFAULT_EVALUATION_CONFIG_V2.attendance.label,
      weight: Math.max(0, Math.min(100, toNumber(config.attendance?.weight, DEFAULT_EVALUATION_CONFIG_V2.attendance.weight))),
      statusScores: {
        HADIR: Math.max(0, Math.min(100, toNumber(config.attendance?.statusScores?.HADIR, DEFAULT_EVALUATION_CONFIG_V2.attendance.statusScores.HADIR))),
        IZIN: Math.max(0, Math.min(100, toNumber(config.attendance?.statusScores?.IZIN, DEFAULT_EVALUATION_CONFIG_V2.attendance.statusScores.IZIN))),
        SAKIT: Math.max(0, Math.min(100, toNumber(config.attendance?.statusScores?.SAKIT, DEFAULT_EVALUATION_CONFIG_V2.attendance.statusScores.SAKIT))),
        ALPA: Math.max(0, Math.min(100, toNumber(config.attendance?.statusScores?.ALPA, DEFAULT_EVALUATION_CONFIG_V2.attendance.statusScores.ALPA))),
      },
    },
    notesMaxLength: Math.max(40, Math.min(1000, toNumber(config.notesMaxLength, DEFAULT_EVALUATION_CONFIG_V2.notesMaxLength))),
    grading: normalizeGradeBand(config.grading, DEFAULT_GRADING),
  };
}

export function isMetricsJsonV2(metrics: unknown): metrics is MetricsJsonV2 {
  return !!metrics && typeof metrics === "object" && (metrics as { version?: string }).version === "v2";
}

export function buildMetricFieldKey(categoryId: string, itemId: string) {
  return `${categoryId}::${itemId}`;
}

export function buildMetricValuesFromConfig(config: EvaluationConfigV2, metrics?: MetricsJson | MetricsJsonV2 | null) {
  const values: Record<string, number> = {};

  for (const category of config.categories) {
    for (const item of category.items) {
      const fieldKey = buildMetricFieldKey(category.id, item.id);
      values[fieldKey] = 0;
    }
  }

  if (!metrics) {
    return values;
  }

  if (isMetricsJsonV2(metrics)) {
    for (const category of metrics.categories) {
      for (const item of category.items) {
        values[buildMetricFieldKey(category.id, item.id)] = item.score;
      }
    }
    return values;
  }

  values[buildMetricFieldKey("dribble", "in-and-out")] = metrics.dribble.inAndOut;
  values[buildMetricFieldKey("dribble", "crossover")] = metrics.dribble.crossover;
  values[buildMetricFieldKey("dribble", "v-left")] = metrics.dribble.vLeft;
  values[buildMetricFieldKey("dribble", "v-right")] = metrics.dribble.vRight;
  values[buildMetricFieldKey("dribble", "between-legs-left")] = metrics.dribble.betweenLegsLeft;
  values[buildMetricFieldKey("dribble", "between-legs-right")] = metrics.dribble.betweenLegsRight;
  values[buildMetricFieldKey("passing", "chest-pass")] = metrics.passing.chestPass;
  values[buildMetricFieldKey("passing", "bounce-pass")] = metrics.passing.bouncePass;
  values[buildMetricFieldKey("passing", "overhead-pass")] = metrics.passing.overheadPass;
  values[buildMetricFieldKey("finishing", "lay-up")] = metrics.layUp;
  values[buildMetricFieldKey("shooting", "shooting")] = metrics.shooting;

  return values;
}

export function buildDynamicMetricsJson(params: {
  config: EvaluationConfigV2;
  values: Record<string, number>;
  notes?: string;
  attendance?: EvaluationAttendanceSnapshotV2 | null;
}): MetricsJsonV2 {
  const { config, values, notes, attendance } = params;

  return {
    version: "v2",
    categories: config.categories.map((category) => ({
      id: category.id,
      label: category.label,
      weight: category.weight,
      items: category.items.map((item) => ({
        ...item,
        score: Math.max(0, Math.min(item.maxScore, toNumber(values[buildMetricFieldKey(category.id, item.id)], 0))),
      })),
    })),
    attendance: attendance ?? null,
    notes: notes?.trim() || "",
    grading: config.grading,
  };
}

export function calculateAttendanceScore(
  counts: AttendanceStats,
  config: EvaluationAttendanceConfig,
): EvaluationAttendanceSnapshotV2 {
  const totalSessions = counts.HADIR + counts.IZIN + counts.SAKIT + counts.ALPA;
  const weightedScore =
    counts.HADIR * config.statusScores.HADIR +
    counts.IZIN * config.statusScores.IZIN +
    counts.SAKIT * config.statusScores.SAKIT +
    counts.ALPA * config.statusScores.ALPA;

  return {
    label: config.label,
    weight: config.weight,
    score: totalSessions > 0 ? Math.round(weightedScore / totalSessions) : 0,
    counts,
    totalSessions,
  };
}

export function getGradeFromBands(score: number, grading: EvaluationGradeBand[]) {
  const sortedBands = [...grading].sort((a, b) => b.minScore - a.minScore);
  return sortedBands.find((band) => score >= band.minScore) ?? sortedBands[sortedBands.length - 1] ?? DEFAULT_GRADING[DEFAULT_GRADING.length - 1];
}

export function getEvaluationSummary(metrics: MetricsJson | MetricsJsonV2) {
  if (!isMetricsJsonV2(metrics)) {
    const legacyRows: FlatMetricRow[] = [
      { key: "inAndOut", label: "In & Out Dribble", shortLabel: "I&O", value: metrics.dribble.inAndOut, max: 99, categoryLabel: "Dribble" },
      { key: "crossover", label: "Crossover", shortLabel: "Cross", value: metrics.dribble.crossover, max: 10, categoryLabel: "Dribble" },
      { key: "vLeft", label: "V Dribble (Kiri)", shortLabel: "V-L", value: metrics.dribble.vLeft, max: 10, categoryLabel: "Dribble" },
      { key: "vRight", label: "V Dribble (Kanan)", shortLabel: "V-R", value: metrics.dribble.vRight, max: 10, categoryLabel: "Dribble" },
      { key: "betweenLegsLeft", label: "Between Legs (Kiri)", shortLabel: "BTL-L", value: metrics.dribble.betweenLegsLeft, max: 10, categoryLabel: "Dribble" },
      { key: "betweenLegsRight", label: "Between Legs (Kanan)", shortLabel: "BTL-R", value: metrics.dribble.betweenLegsRight, max: 10, categoryLabel: "Dribble" },
      { key: "chestPass", label: "Chest Pass", shortLabel: "Chest", value: metrics.passing.chestPass, max: 10, categoryLabel: "Passing" },
      { key: "bouncePass", label: "Bounce Pass", shortLabel: "Bounce", value: metrics.passing.bouncePass, max: 10, categoryLabel: "Passing" },
      { key: "overheadPass", label: "Overhead Pass", shortLabel: "Over", value: metrics.passing.overheadPass, max: 10, categoryLabel: "Passing" },
      { key: "layUp", label: "Lay Up", shortLabel: "Lay Up", value: metrics.layUp, max: 10, categoryLabel: "Finishing" },
      { key: "shooting", label: "Shooting", shortLabel: "Shoot", value: metrics.shooting, max: 10, categoryLabel: "Shooting" },
    ];

    const normalized = legacyRows.map((row) => (row.value / row.max) * 100);
    const totalScore = normalized.length > 0
      ? Math.round(normalized.reduce((sum, value) => sum + value, 0) / normalized.length)
      : 0;

    return {
      totalScore,
      overallScore: legacyRows.reduce((sum, row) => sum + row.value, 0),
      notes: metrics.notes?.trim() || "",
      grade: getGradeFromBands(totalScore, DEFAULT_GRADING),
      flatRows: legacyRows,
      categorySummaries: [],
      attendance: null,
    };
  }

  const flatRows: FlatMetricRow[] = [];
  let weightedScoreTotal = 0;
  let activeWeightTotal = 0;

  const categorySummaries = metrics.categories.map((category) => {
    const items = category.items.map((item) => {
      flatRows.push({
        key: `${category.id}-${item.id}`,
        label: item.label,
        shortLabel: item.label,
        value: item.score,
        max: item.maxScore,
        categoryLabel: category.label,
      });
      return item;
    });

    const average = items.length > 0
      ? items.reduce((sum, item) => sum + (item.score / item.maxScore) * 100, 0) / items.length
      : 0;

    if (category.weight > 0) {
      weightedScoreTotal += average * category.weight;
      activeWeightTotal += category.weight;
    }

    return {
      id: category.id,
      label: category.label,
      weight: category.weight,
      averageScore: Math.round(average),
      totalRawScore: items.reduce((sum, item) => sum + item.score, 0),
      totalMaxScore: items.reduce((sum, item) => sum + item.maxScore, 0),
    };
  });

  if (metrics.attendance && metrics.attendance.weight > 0) {
    weightedScoreTotal += metrics.attendance.score * metrics.attendance.weight;
    activeWeightTotal += metrics.attendance.weight;
  }

  const totalScore = activeWeightTotal > 0 ? Math.round(weightedScoreTotal / activeWeightTotal) : 0;

  return {
    totalScore,
    overallScore: totalScore,
    notes: metrics.notes?.trim() || "",
    grade: getGradeFromBands(totalScore, metrics.grading),
    flatRows,
    categorySummaries,
    attendance: metrics.attendance ?? null,
  };
}

