"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-auth";
import { toJakartaDate, getJakartaToday } from "@/lib/date-utils";
import { AttendanceStatus } from "@/types/dashboard";

/**
 * ADORA Basketball - Optimized Dashboard Aggregator
 * Updated to Senior Standards: Dynamic Metrics & Soft-Delete Safe.
 */

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
    const thirtyDaysAgo = getJakartaToday();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceStats = await prisma.attendance.groupBy({
      by: ['status'],
      where: { 
        date: { gte: thirtyDaysAgo },
        player: { isDeleted: false } 
      },
      _count: true
    });

    let totalAttendances = 0;
    let hadirCount = 0;

    attendanceStats.forEach(stat => {
      totalAttendances += stat._count;
      if (stat.status === "HADIR") hadirCount = stat._count;
    });

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
       take: 200,
       select: { date: true, metricsJson: true }
    });

    stats.reverse();

    const trendMap = new Map<string, { sum: number; count: number }>();
    
    stats.forEach(s => {
       const month = s.date.toLocaleDateString("id-ID", { month: "short" });
       try {
         const metrics = JSON.parse(s.metricsJson as string);
         const values = Object.values(metrics).filter(v => typeof v === "number") as number[];
         
         if (values.length > 0) {
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            if (!trendMap.has(month)) trendMap.set(month, { sum: 0, count: 0 });
            const entry = trendMap.get(month)!;
            entry.sum += avg;
            entry.count += 1;
         }
       } catch (e) {
         // Silently fail on malformed JSON
       }
    });

    const performanceTrend = Array.from(trendMap.entries()).map(([name, data]) => ({
       name,
       val: data.count > 0 ? Math.round(data.sum / data.count) : 0
    }));

    return {
      playerCount,
      groupCount,
      publishedStatsCount,
      attendanceRate,
      performanceTrend: performanceTrend.length > 0 ? performanceTrend : [
          { name: "Siklus 1", val: 0 },
          { name: "Siklus 2", val: 0 }
      ],
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
     
     const where: any = { 
       date: targetDate,
       player: { isDeleted: false }
     };
     
     if (groupId && groupId !== "all") {
       where.player = {
         ...where.player,
         groupId: groupId
       };
     }

     return await prisma.attendance.findMany({
       where,
       select: { playerId: true, status: true, note: true }
     }) as { playerId: string; status: AttendanceStatus; note: string | null }[];
  } catch (error) {
     console.error("[GET_ATTENDANCES_ERROR]:", error);
     return [];
  }
}

