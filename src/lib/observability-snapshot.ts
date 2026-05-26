import { prisma } from "@/lib/prisma";
import { getObservationWindowStart } from "@/lib/observability";

export type ObservabilitySnapshot = {
  windowHours: number;
  since: Date;
  totals: {
    errorEvents: number;
    warnEvents: number;
    badWebVitals: number;
  };
  countsBySource: Array<{
    source: string;
    severity: string;
    count: number;
  }>;
  recentEvents: Array<{
    id: string;
    severity: string;
    source: string;
    message: string;
    statusCode: number | null;
    durationMs: number | null;
    createdAt: Date;
  }>;
  webVitals: Array<{
    name: string;
    rating: string;
    count: number;
  }>;
};

export async function getObservabilitySnapshot(windowHours = 24): Promise<ObservabilitySnapshot> {
  const since = getObservationWindowStart(windowHours);

  const [eventCounts, recentEvents, webVitalCounts] = await Promise.all([
    prisma.operationalEvent.groupBy({
      by: ["source", "severity"],
      where: {
        createdAt: { gte: since },
      },
      _count: { _all: true },
    }),
    prisma.operationalEvent.findMany({
      where: {
        createdAt: { gte: since },
        severity: { in: ["WARN", "ERROR"] },
      },
      select: {
        id: true,
        severity: true,
        source: true,
        message: true,
        statusCode: true,
        durationMs: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.webVitalEvent.groupBy({
      by: ["name", "rating"],
      where: {
        createdAt: { gte: since },
        rating: { not: "good" },
      },
      _count: { _all: true },
    }),
  ]);

  const errorEvents = eventCounts
    .filter((row) => row.severity === "ERROR")
    .reduce((sum, row) => sum + row._count._all, 0);
  const warnEvents = eventCounts
    .filter((row) => row.severity === "WARN")
    .reduce((sum, row) => sum + row._count._all, 0);
  const badWebVitals = webVitalCounts.reduce((sum, row) => sum + row._count._all, 0);

  return {
    windowHours,
    since,
    totals: {
      errorEvents,
      warnEvents,
      badWebVitals,
    },
    countsBySource: eventCounts.map((row) => ({
      source: row.source,
      severity: row.severity,
      count: row._count._all,
    })),
    recentEvents,
    webVitals: webVitalCounts.map((row) => ({
      name: row.name,
      rating: row.rating,
      count: row._count._all,
    })),
  };
}
