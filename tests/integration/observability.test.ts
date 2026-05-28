import { beforeEach, describe, expect, test } from "vitest";
import type { PrismaClient } from "@prisma/client";
import type { DeepMockProxy } from "vitest-mock-extended";
import { prisma as originalPrisma } from "@/lib/prisma";
import { getObservabilitySnapshotAction } from "@/actions/observability";

const prisma = originalPrisma as unknown as DeepMockProxy<PrismaClient>;
const operationalGroupBy = prisma.operationalEvent.groupBy as unknown as {
  mockReset: () => void;
  mockResolvedValueOnce: (value: unknown) => void;
};
const operationalFindMany = prisma.operationalEvent.findMany as unknown as {
  mockReset: () => void;
  mockResolvedValueOnce: (value: unknown) => void;
};
const webVitalGroupBy = prisma.webVitalEvent.groupBy as unknown as {
  mockReset: () => void;
  mockResolvedValueOnce: (value: unknown) => void;
};

describe("Phase 4 Observability Snapshot", () => {
  beforeEach(() => {
    operationalGroupBy.mockReset();
    operationalFindMany.mockReset();
    webVitalGroupBy.mockReset();
  });

  test("menggabungkan ringkasan event operasional dan web vitals buruk", async () => {
    operationalGroupBy.mockResolvedValueOnce([
      { source: "upload-api", severity: "ERROR", _count: { _all: 2 } },
      { source: "auth", severity: "WARN", _count: { _all: 3 } },
    ] as never);
    operationalFindMany.mockResolvedValueOnce([
      {
        id: "evt-1",
        severity: "ERROR",
        source: "upload-api",
        message: "Upload request failed",
        statusCode: 500,
        durationMs: null,
        createdAt: new Date("2025-05-27T03:00:00.000Z"),
      },
    ] as never);
    webVitalGroupBy.mockResolvedValueOnce([
      { name: "LCP", rating: "poor", _count: { _all: 4 } },
      { name: "INP", rating: "needs-improvement", _count: { _all: 1 } },
    ] as never);

    const result = await getObservabilitySnapshotAction({ windowHours: 12 });

    expect(prisma.operationalEvent.groupBy).toHaveBeenCalledWith({
      by: ["source", "severity"],
      where: {
        createdAt: { gte: expect.any(Date) },
      },
      _count: { _all: true },
    });
    expect(prisma.webVitalEvent.groupBy).toHaveBeenCalledWith({
      by: ["name", "rating"],
      where: {
        createdAt: { gte: expect.any(Date) },
        rating: { not: "good" },
      },
      _count: { _all: true },
    });
    expect(result.windowHours).toBe(12);
    expect(result.totals).toEqual({
      errorEvents: 2,
      warnEvents: 3,
      badWebVitals: 5,
    });
    expect(result.countsBySource).toEqual([
      { source: "upload-api", severity: "ERROR", count: 2 },
      { source: "auth", severity: "WARN", count: 3 },
    ]);
    expect(result.webVitals).toEqual([
      { name: "LCP", rating: "poor", count: 4 },
      { name: "INP", rating: "needs-improvement", count: 1 },
    ]);
    expect(result.recentEvents).toHaveLength(1);
  });

  test("membatasi jendela snapshot minimal 1 jam dan maksimal 168 jam", async () => {
    operationalGroupBy.mockResolvedValueOnce([] as never);
    operationalFindMany.mockResolvedValueOnce([] as never);
    webVitalGroupBy.mockResolvedValueOnce([] as never);

    const result = await getObservabilitySnapshotAction({ windowHours: 999 });

    expect(result.windowHours).toBe(168);
  });
});
