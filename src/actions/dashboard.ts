"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-auth";
import { toJakartaDate, getJakartaToday } from "@/lib/date-utils";
import { AttendanceStatus } from "@/types/dashboard";

/**
 * ADORA Basketball - Optimized Dashboard Aggregator
 * Updated to Senior Standards: Dynamic Metrics & Soft-Delete Safe.
 */

// ─── Constants ──────────────────────────────────────────────────────────────
const ATTENDANCE_LOOKBACK_DAYS = 30;
const TREND_STATS_SAMPLE_SIZE = 200;
const ATTENDANCE_STATUSES = ["HADIR", "IZIN", "SAKIT", "ALPA"] as const;

// Initialize default attendance counts
const DEFAULT_ATTENDANCE_COUNTS = Object.fromEntries(
  ATTENDANCE_STATUSES.map(status => [status, 0])
);

export type DashboardMetrics = {
  playerCount: number;
  groupCount: number;
  publishedStatsCount: number;
  attendanceRate: number;
  performanceTrend: { name: string; val: number }[];
};

export async function getDashboardMetricsAction(): Promise<DashboardMetrics> {
  try {
    await requireAdmin();
    
    // Grouping core counts 
    const [playerCount, groupCount, publishedStatsCount] = await Promise.all([
      prisma.player.count({ where: { isDeleted: false } }),
      prisma.group.count(),
      prisma.statistic.count({ 
        where: { 
          status: "Published",
          player: { isDeleted: false }
        } 
      }),
    ]);

    // Optimized Attendance Rate Calculation
    // Calculate 30 days ago in Jakarta time, preserving timezone offset
    const thirtyDaysAgoMs = getJakartaToday().getTime() - ATTENDANCE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = toJakartaDate(new Date(thirtyDaysAgoMs).toISOString().split('T')[0]);

    const attendanceStats = await prisma.attendance.groupBy({
      by: ['status'],
      where: {
        date: { gte: thirtyDaysAgo },
        player: { isDeleted: false }
      },
      _count: true
    });

    const attendanceCounts = attendanceStats.reduce(
      (acc, stat) => ({ ...acc, [stat.status]: stat._count }),
      { ...DEFAULT_ATTENDANCE_COUNTS }
    );

    const totalAttendances = Object.values(attendanceCounts).reduce((sum, count) => sum + count, 0);
    const hadirCount = attendanceCounts["HADIR"] || 0;

    const attendanceRate = totalAttendances > 0
      ? Math.round((hadirCount / totalAttendances) * 100)
      : 0;

    // Optimized Dynamic Trend Calculation
    const stats = await prisma.statistic.findMany({
      where: {
        status: "Published",
        player: { isDeleted: false }
      },
      orderBy: { date: "desc" },
      take: TREND_STATS_SAMPLE_SIZE,
      select: { date: true, metricsJson: true }
    });

    // Format month label with explicit locale
    const formatMonth = (date: Date): string => {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return monthNames[date.getMonth()];
    };

    // Parse metrics safely and extract numeric values
    const parseMetrics = (metricsJson: string): number[] => {
      try {
        const metrics = JSON.parse(metricsJson);
        return Object.values(metrics).filter((v): v is number => typeof v === "number");
      } catch {
        return [];
      }
    };

    // Build trend map using reduce
    const trendMap = stats.reverse().reduce((acc, s) => {
      const month = formatMonth(s.date);
      const values = parseMetrics(s.metricsJson as string);

      if (values.length > 0) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const existing = acc.get(month) || { sum: 0, count: 0 };
        acc.set(month, { sum: existing.sum + avg, count: existing.count + 1 });
      }

      return acc;
    }, new Map<string, { sum: number; count: number }>());

    const performanceTrend = Array.from(trendMap.entries()).map(([name, data]) => ({
      name,
      val: data.count > 0 ? Math.round(data.sum / data.count) : 0
    }));

    return {
      playerCount,
      groupCount,
      publishedStatsCount,
      attendanceRate,
      performanceTrend,
    };
  } catch (error) {
    console.error("[DASHBOARD_METRICS_ERROR]:", error);
    return {
      playerCount: 0,
      groupCount: 0,
      publishedStatsCount: 0,
      attendanceRate: 0,
      performanceTrend: []
    };
  }
}

export async function getAttendancesAction(date: string, groupId?: string) {
  try {
     await requireAdmin();
     const targetDate = toJakartaDate(date);
     
     const where = {
       date: targetDate,
       player: {
         isDeleted: false,
         ...(groupId && groupId !== "all" ? { groupId } : {}),
       },
     };

     return await prisma.attendance.findMany({
       where,
       select: { playerId: true, status: true, note: true }
     }) as { playerId: string; status: AttendanceStatus; note: string | null }[];
  } catch (error) {
     console.error("[GET_ATTENDANCES_ERROR]:", error);
     return [];
  }
}

