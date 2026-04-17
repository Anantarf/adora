"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireAuth } from "@/lib/server-auth";
import { toJakartaDate } from "@/lib/date-utils";
import type { AttendanceStatus, MetricsJson } from "@/types/dashboard";
import { createAuditLog } from "./audit";

// ─── Helper ──────────────────────────────────────────
const safeParseMetrics = (json: string): MetricsJson => {
  try { return JSON.parse(json) as MetricsJson; }
  catch { return { dribble: { inAndOut: 0, crossover: 0, vLeft: 0, vRight: 0, betweenLegsLeft: 0, betweenLegsRight: 0 }, passing: { chestPass: 0, bouncePass: 0, overheadPass: 0 }, layUp: 0, shooting: 0 }; }
};

// 1. Submit Attendance
export async function submitAttendanceAction(data: {
  date: string;
  playerStatuses: { playerId: string; status: AttendanceStatus }[];
  note?: string;
  eventId?: string;
}) {
  await requireAdmin();

  if (!data.playerStatuses || data.playerStatuses.length === 0) {
    return { success: false, error: "Minimal ada 1 pemain untuk didaftarkan kehadirannya." };
  }

  const dateObj = toJakartaDate(data.date);

  await prisma.$transaction(async (tx) => {
    const playerIds = data.playerStatuses.map(ps => ps.playerId);
    const existingPlayers = await tx.player.findMany({
      where: { id: { in: playerIds }, isDeleted: false },
      select: { id: true }
    });

    const existingPlayerIds = new Set(existingPlayers.map(p => p.id));
    const invalidPlayers = playerIds.filter(id => !existingPlayerIds.has(id));

    if (invalidPlayers.length > 0) {
      return { success: false, error: `Pemain tidak ditemukan atau sudah dihapus: ${invalidPlayers.join(", ")}` };
    }

    const upsertResults = await Promise.allSettled(
      data.playerStatuses.map(ps =>
        tx.attendance.upsert({
          where: { playerId_date: { playerId: ps.playerId, date: dateObj } },
          update: { status: ps.status, note: data.note, eventId: data.eventId ?? null },
          create: { id: crypto.randomUUID(), playerId: ps.playerId, date: dateObj, status: ps.status, note: data.note, eventId: data.eventId ?? null },
        })
      )
    );

    const failed = upsertResults.filter(r => r.status === "rejected");
    if (failed.length > 0) return { success: false, error: `Gagal mencatat kehadiran untuk ${failed.length} pemain` };

    await createAuditLog(tx, "SUBMIT_ATTENDANCE", "attendance_batch", `Date: ${data.date}, Count: ${data.playerStatuses.length}`);
  });

  revalidatePath("/dashboard/attendances");
}

// 2. Submit Statistics (period-based, dengan history revisi)
export async function submitStatisticAction(data: {
  playerId: string;
  periodId: string;
  metrics: MetricsJson;
  status: "Draft" | "Published";
}) {
  const session = await requireAdmin();
  const userId = session.user.id as string | undefined;

  const stat = await prisma.$transaction(async (tx) => {
    const period = await tx.evaluationPeriod.findUnique({ where: { id: data.periodId } });
    if (!period) return { success: false, error: "Periode evaluasi tidak ditemukan." };

    const existing = await tx.statistic.findUnique({
      where: { playerId_periodId: { playerId: data.playerId, periodId: data.periodId } },
    });

    if (existing) {
      // Simpan snapshot lama ke history sebelum update
      await tx.statisticHistory.create({
        data: {
          statisticId: existing.id,
          metricsJson: existing.metricsJson as string,
          status: existing.status,
          editedBy: userId ?? null,
        },
      });

      const updated = await tx.statistic.update({
        where: { id: existing.id },
        data: {
          metricsJson: JSON.stringify(data.metrics),
          status: data.status,
          updatedAt: new Date(),
        },
      });

      await createAuditLog(tx, "UPDATE_STATS", "statistic", updated.id);
      return updated;
    }

    const created = await tx.statistic.create({
      data: {
        playerId: data.playerId,
        periodId: data.periodId,
        date: period.startDate,
        metricsJson: JSON.stringify(data.metrics),
        status: data.status,
        updatedAt: new Date(),
      },
    });

    await createAuditLog(tx, "CREATE_STATS", "statistic", created.id);
    return created;
  });

  revalidatePath("/dashboard/statistics");
  return stat;
}

// 3. Get all stats in a period (Admin — tabel per group)
export async function getStatsByPeriodAction(periodId: string) {
  await requireAdmin();

  const stats = await prisma.statistic.findMany({
    where: { periodId, player: { isDeleted: false } },
    include: {
      player: {
        select: {
          id: true, name: true, groupId: true,
          group: { select: { id: true, name: true } },
        },
      },
      period: { select: { id: true, name: true } },
    },
    orderBy: [{ player: { group: { name: "asc" } } }, { player: { name: "asc" } }],
  });

  return stats.map(s => ({ ...s, metricsJson: safeParseMetrics(s.metricsJson as string) }));
}

// 4. Get history revisi untuk satu statistic
export async function getStatHistoryAction(statisticId: string) {
  await requireAdmin();

  const history = await prisma.statisticHistory.findMany({
    where: { statisticId },
    include: { user: { select: { name: true, username: true } } },
    orderBy: { editedAt: "desc" },
  });

  return history.map(h => ({ ...h, metricsJson: safeParseMetrics(h.metricsJson as string) }));
}

// 5. Get Player Stats (Parent-safe — untuk portal pemain)
export async function getPlayerStatsAction(playerId: string) {
  const session = await requireAuth();
  const { role: userRole, id: userId } = session.user;

  if (userRole === "PARENT") {
    const parentOwnsChild = await prisma.player.findFirst({
      where: { id: playerId, parentId: userId, isDeleted: false }
    });
    if (!parentOwnsChild) {
      throw new Error("Akses Terlarang: Anda tidak diizinkan melihat evaluasi anak dari keluarga lain.");
    }
  }

  const stats = await prisma.statistic.findMany({
    where: { playerId, player: { isDeleted: false }, status: "Published" },
    include: { period: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });

  return stats.map(s => ({ ...s, metricsJson: safeParseMetrics(s.metricsJson as string) }));
}
