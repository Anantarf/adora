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

export const FIXED_ASPECT_MAX_SCORE = 10;
export const AUTO_ATTENDANCE_DEFAULT_WEIGHT = 10;
export const AUTO_ATTENDANCE_REDUCED_WEIGHT = 5;
export const AUTO_ATTENDANCE_REDUCED_THRESHOLD = 4;
const AUTO_WEIGHT_PRECISION = 2;

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
      weight: 30,
      items: [
        { id: "in-and-out", label: "In & Out Dribble", maxScore: FIXED_ASPECT_MAX_SCORE },
        { id: "crossover", label: "Crossover", maxScore: FIXED_ASPECT_MAX_SCORE },
        { id: "v-left", label: "V Dribble (Kiri)", maxScore: FIXED_ASPECT_MAX_SCORE },
        { id: "v-right", label: "V Dribble (Kanan)", maxScore: FIXED_ASPECT_MAX_SCORE },
        { id: "between-legs-left", label: "Between Legs (Kiri)", maxScore: FIXED_ASPECT_MAX_SCORE },
        { id: "between-legs-right", label: "Between Legs (Kanan)", maxScore: FIXED_ASPECT_MAX_SCORE },
      ],
    },
    {
      id: "passing",
      label: "Passing",
      weight: 30,
      items: [
        { id: "chest-pass", label: "Chest Pass", maxScore: FIXED_ASPECT_MAX_SCORE },
        { id: "bounce-pass", label: "Bounce Pass", maxScore: FIXED_ASPECT_MAX_SCORE },
        { id: "overhead-pass", label: "Overhead Pass", maxScore: FIXED_ASPECT_MAX_SCORE },
      ],
    },
    {
      id: "finishing",
      label: "Finishing",
      weight: 30,
      items: [
        { id: "lay-up", label: "Lay Up", maxScore: FIXED_ASPECT_MAX_SCORE },
        { id: "shooting", label: "Shooting", maxScore: FIXED_ASPECT_MAX_SCORE },
      ],
    },
  ],
  attendance: {
    enabled: true,
    label: "Presensi",
    weight: AUTO_ATTENDANCE_DEFAULT_WEIGHT,
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

function roundAutoWeight(value: number) {
  return Number(value.toFixed(AUTO_WEIGHT_PRECISION));
}

function getAutoAttendanceWeight(categoryCount: number) {
  return categoryCount > AUTO_ATTENDANCE_REDUCED_THRESHOLD
    ? AUTO_ATTENDANCE_REDUCED_WEIGHT
    : AUTO_ATTENDANCE_DEFAULT_WEIGHT;
}

function distributeAutoCategoryWeights(categoryCount: number) {
  if (categoryCount <= 0) {
    return [];
  }

  const attendanceWeight = getAutoAttendanceWeight(categoryCount);
  const technicalPool = 100 - attendanceWeight;

  if (categoryCount === 1) {
    return [technicalPool];
  }

  const baseWeight = roundAutoWeight(technicalPool / categoryCount);
  return Array.from({ length: categoryCount }, (_, index) =>
    index === categoryCount - 1
      ? roundAutoWeight(technicalPool - baseWeight * (categoryCount - 1))
      : baseWeight,
  );
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
  const normalizedCategories = categories
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
        weight: 0,
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
              maxScore: FIXED_ASPECT_MAX_SCORE,
            };
          })
          .filter((item) => item.label),
      };
    })
    .filter((category) => category.items.length > 0);
  const categoryWeights = distributeAutoCategoryWeights(normalizedCategories.length);

  return {
    version: "v2",
    categories: normalizedCategories.map((category, index) => ({
      ...category,
      weight: categoryWeights[index] ?? 0,
    })),
    attendance: {
      enabled: true,
      label:
        typeof config.attendance?.label === "string" && config.attendance.label.trim()
          ? config.attendance.label.trim()
          : DEFAULT_EVALUATION_CONFIG_V2.attendance.label,
      weight: getAutoAttendanceWeight(normalizedCategories.length),
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
  values[buildMetricFieldKey("finishing", "shooting")] = metrics.shooting;

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
    const legacyDribbleItems = [
      { key: "inAndOut", label: "In & Out Dribble", shortLabel: "I&O", value: metrics.dribble.inAndOut, max: 10 },
      { key: "crossover", label: "Crossover", shortLabel: "Cross", value: metrics.dribble.crossover, max: 10 },
      { key: "vLeft", label: "V Dribble (Kiri)", shortLabel: "V-L", value: metrics.dribble.vLeft, max: 10 },
      { key: "vRight", label: "V Dribble (Kanan)", shortLabel: "V-R", value: metrics.dribble.vRight, max: 10 },
      { key: "betweenLegsLeft", label: "Between Legs (Kiri)", shortLabel: "BTL-L", value: metrics.dribble.betweenLegsLeft, max: 10 },
      { key: "betweenLegsRight", label: "Between Legs (Kanan)", shortLabel: "BTL-R", value: metrics.dribble.betweenLegsRight, max: 10 },
    ];
    const legacyPassingItems = [
      { key: "chestPass", label: "Chest Pass", shortLabel: "Chest", value: metrics.passing.chestPass, max: 10 },
      { key: "bouncePass", label: "Bounce Pass", shortLabel: "Bounce", value: metrics.passing.bouncePass, max: 10 },
      { key: "overheadPass", label: "Overhead Pass", shortLabel: "Over", value: metrics.passing.overheadPass, max: 10 },
    ];
    const legacyFinishingItems = [
      { key: "layUp", label: "Lay Up", shortLabel: "Lay Up", value: metrics.layUp, max: 10 },
      { key: "shooting", label: "Shooting", shortLabel: "Shoot", value: metrics.shooting, max: 10 },
    ];

    const legacyRows: FlatMetricRow[] = [
      ...legacyDribbleItems.map((item) => ({ ...item, categoryLabel: "Dribble" })),
      ...legacyPassingItems.map((item) => ({ ...item, categoryLabel: "Passing" })),
      ...legacyFinishingItems.map((item) => ({ ...item, categoryLabel: "Finishing" })),
    ];

    const computeCategoryAvg = (items: Array<{ value: number; max: number }>) => {
      if (items.length === 0) return 0;
      return Math.round(items.reduce((sum, item) => sum + (item.value / item.max) * 100, 0) / items.length);
    };

    const legacyCategorySummaries = [
      {
        id: "dribble",
        label: "Dribble",
        weight: 30,
        averageScore: computeCategoryAvg(legacyDribbleItems),
        totalRawScore: legacyDribbleItems.reduce((sum, item) => sum + item.value, 0),
        totalMaxScore: legacyDribbleItems.reduce((sum, item) => sum + item.max, 0),
      },
      {
        id: "passing",
        label: "Passing",
        weight: 30,
        averageScore: computeCategoryAvg(legacyPassingItems),
        totalRawScore: legacyPassingItems.reduce((sum, item) => sum + item.value, 0),
        totalMaxScore: legacyPassingItems.reduce((sum, item) => sum + item.max, 0),
      },
      {
        id: "finishing",
        label: "Finishing",
        weight: 30,
        averageScore: computeCategoryAvg(legacyFinishingItems),
        totalRawScore: legacyFinishingItems.reduce((sum, item) => sum + item.value, 0),
        totalMaxScore: legacyFinishingItems.reduce((sum, item) => sum + item.max, 0),
      },
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
      categorySummaries: legacyCategorySummaries,
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
