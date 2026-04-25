"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-auth";
import { toJakartaDate, getJakartaToday } from "@/lib/date-utils";
import { AttendanceStatus } from "@/types/dashboard";
import { MS_PER_DAY, ATTENDANCE_LOOKBACK_DAYS } from "@/lib/constants";

const DEFAULT_ATTENDANCE_COUNTS = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };

export type DashboardMetrics = {
  playerCount: number;
  groupCount: number;
  publishedStatsCount: number;
  draftStatsCount: number;
  attendanceRate: number;
  recentRegistrations: { id: string; playerName: string; ageGroup: string; createdAt: Date; status: string }[];
  atRiskPlayers: { id: string; name: string; groupName: string; alpaCount: number }[];
};

export async function getDashboardMetricsAction(): Promise<DashboardMetrics> {
  try {
    await requireAdmin();
    
    // Grouping core counts 
    const [playerCount, groupCount, publishedStatsCount, draftStatsCount] = await Promise.all([
      prisma.player.count({ where: { isDeleted: false } }),
      prisma.group.count(),
      prisma.statistic.count({ 
        where: { 
          status: "Published",
          player: { isDeleted: false }
        } 
      }),
      prisma.statistic.count({ 
        where: { 
          status: "Draft",
          player: { isDeleted: false }
        } 
      }),
    ]);

    const thirtyDaysAgo = new Date(getJakartaToday().getTime() - ATTENDANCE_LOOKBACK_DAYS * MS_PER_DAY);

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

    const recentRegistrations = await prisma.registration.findMany({
      where: {
        status: "PENDING"
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        playerName: true,
        ageGroup: true,
        createdAt: true,
        status: true,
      }
    });

    // Find At-Risk Players (>= 3 ALPA in the last 30 days) — filter done at DB level via groupBy+having
    const alpaGroups = await prisma.attendance.groupBy({
      by: ["playerId"],
      where: {
        status: "ALPA",
        date: { gte: thirtyDaysAgo },
        player: { isDeleted: false },
      },
      _count: { playerId: true },
      having: { playerId: { _count: { gte: 3 } } },
    });

    const atRiskPlayerIds = alpaGroups.map((g) => g.playerId);

    const atRiskPlayerDetails = await prisma.player.findMany({
      where: { id: { in: atRiskPlayerIds } },
      select: { id: true, name: true, group: { select: { name: true } } },
    });

    const playerDetailMap = Object.fromEntries(atRiskPlayerDetails.map((p) => [p.id, p]));

    const atRiskPlayers = alpaGroups
      .map((g) => {
        const p = playerDetailMap[g.playerId];
        return { id: g.playerId, name: p?.name ?? "-", groupName: p?.group?.name ?? "-", alpaCount: g._count.playerId };
      })
      .sort((a, b) => b.alpaCount - a.alpaCount);

    return {
      playerCount,
      groupCount,
      publishedStatsCount,
      draftStatsCount,
      attendanceRate,
      recentRegistrations,
      atRiskPlayers,
    };
  } catch (error) {
    console.error("[DASHBOARD_METRICS_ERROR]:", error);
    throw new Error("Gagal mengambil metrik dashboard. Silakan coba lagi.");
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

