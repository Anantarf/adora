import { describe, expect, it } from "vitest";
import {
  DEFAULT_EVALUATION_CONFIG_V2,
  buildDynamicMetricsJson,
  calculateAttendanceScore,
  getEvaluationSummary,
  getGradeFromBands,
  normalizeEvaluationConfig,
} from "@/lib/evaluation-rules";
import type { AttendanceStats } from "@/types/dashboard";

describe("normalizeEvaluationConfig", () => {
  it("distributes category weights to sum 100 with default attendance weight (<=4 categories)", () => {
    const config = normalizeEvaluationConfig(DEFAULT_EVALUATION_CONFIG_V2);
    const total = config.categories.reduce((sum, c) => sum + c.weight, 0) + config.attendance.weight;
    expect(total).toBe(100);
    expect(config.attendance.weight).toBe(10);
  });

  it("switches to reduced attendance weight when more than 4 categories", () => {
    const raw = {
      ...DEFAULT_EVALUATION_CONFIG_V2,
      categories: Array.from({ length: 5 }, (_, i) => ({
        id: `cat-${i}`,
        label: `Cat ${i}`,
        weight: 0,
        items: [{ id: "a", label: "A", maxScore: 10 }],
      })),
    };
    const config = normalizeEvaluationConfig(raw);
    expect(config.attendance.weight).toBe(5);
    const total = config.categories.reduce((sum, c) => sum + c.weight, 0) + config.attendance.weight;
    expect(total).toBe(100);
  });

  it("falls back to default config for invalid input", () => {
    expect(normalizeEvaluationConfig(null)).toEqual(DEFAULT_EVALUATION_CONFIG_V2);
    expect(normalizeEvaluationConfig(undefined)).toEqual(DEFAULT_EVALUATION_CONFIG_V2);
  });

  it("drops categories with no items", () => {
    const raw = { categories: [{ id: "empty", label: "Empty", items: [] }] };
    const config = normalizeEvaluationConfig(raw);
    expect(config.categories).toHaveLength(0);
  });

  it("clamps attendance status scores to [0, 100]", () => {
    const raw = { attendance: { statusScores: { HADIR: 500, IZIN: -20, SAKIT: 50, ALPA: 0 } } };
    const config = normalizeEvaluationConfig(raw);
    expect(config.attendance.statusScores.HADIR).toBe(100);
    expect(config.attendance.statusScores.IZIN).toBe(0);
  });
});

describe("calculateAttendanceScore", () => {
  const config = DEFAULT_EVALUATION_CONFIG_V2.attendance;

  it("computes weighted average score across statuses", () => {
    const counts: AttendanceStats = { HADIR: 3, IZIN: 1, SAKIT: 0, ALPA: 0 };
    const result = calculateAttendanceScore(counts, config);
    // (3*100 + 1*75) / 4 = 93.75 -> rounds to 94
    expect(result.score).toBe(94);
    expect(result.totalSessions).toBe(4);
  });

  it("returns score 0 when there are no sessions", () => {
    const counts: AttendanceStats = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };
    const result = calculateAttendanceScore(counts, config);
    expect(result.score).toBe(0);
    expect(result.totalSessions).toBe(0);
  });

  it("scores all-ALPA as 0", () => {
    const counts: AttendanceStats = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 5 };
    const result = calculateAttendanceScore(counts, config);
    expect(result.score).toBe(0);
  });
});

describe("getGradeFromBands", () => {
  const grading = DEFAULT_EVALUATION_CONFIG_V2.grading;

  it("picks the correct band at each boundary", () => {
    expect(getGradeFromBands(80, grading).letter).toBe("A");
    expect(getGradeFromBands(79, grading).letter).toBe("B");
    expect(getGradeFromBands(70, grading).letter).toBe("B");
    expect(getGradeFromBands(69, grading).letter).toBe("C");
    expect(getGradeFromBands(60, grading).letter).toBe("C");
    expect(getGradeFromBands(59, grading).letter).toBe("D");
    expect(getGradeFromBands(0, grading).letter).toBe("D");
  });

  it("falls back to lowest band for out-of-range low scores", () => {
    expect(getGradeFromBands(-10, grading).letter).toBe("D");
  });
});

describe("buildDynamicMetricsJson", () => {
  it("clamps scores to each item's maxScore and floors at 0", () => {
    const config = normalizeEvaluationConfig(DEFAULT_EVALUATION_CONFIG_V2);
    const firstItem = config.categories[0].items[0];
    const key = `${config.categories[0].id}::${firstItem.id}`;
    const metrics = buildDynamicMetricsJson({
      config,
      values: { [key]: 999 },
    });
    expect(metrics.categories[0].items[0].score).toBe(firstItem.maxScore);
  });

  it("defaults missing values to 0", () => {
    const config = normalizeEvaluationConfig(DEFAULT_EVALUATION_CONFIG_V2);
    const metrics = buildDynamicMetricsJson({ config, values: {} });
    for (const category of metrics.categories) {
      for (const item of category.items) {
        expect(item.score).toBe(0);
      }
    }
  });
});

describe("getEvaluationSummary (v2)", () => {
  it("computes a weighted total score across categories and attendance", () => {
    const config = normalizeEvaluationConfig(DEFAULT_EVALUATION_CONFIG_V2);
    const values: Record<string, number> = {};
    for (const category of config.categories) {
      for (const item of category.items) {
        values[`${category.id}::${item.id}`] = item.maxScore; // perfect score everywhere
      }
    }
    const attendance = calculateAttendanceScore({ HADIR: 4, IZIN: 0, SAKIT: 0, ALPA: 0 }, config.attendance);
    const metrics = buildDynamicMetricsJson({ config, values, attendance });

    const summary = getEvaluationSummary(metrics);
    expect(summary.totalScore).toBe(100);
    expect(summary.grade.letter).toBe("A");
  });

  it("ignores zero-weight categories in the weighted average", () => {
    const config = normalizeEvaluationConfig(DEFAULT_EVALUATION_CONFIG_V2);
    config.categories[0].weight = 0;
    const values: Record<string, number> = {};
    for (const category of config.categories) {
      for (const item of category.items) {
        values[`${category.id}::${item.id}`] = 0;
      }
    }
    const metrics = buildDynamicMetricsJson({ config, values, attendance: null });
    const summary = getEvaluationSummary(metrics);
    expect(summary.totalScore).toBe(0);
  });
});
