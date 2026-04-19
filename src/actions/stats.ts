"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireAuth } from "@/lib/server-auth";
import { toJakartaDate } from "@/lib/date-utils";
import type { AttendanceStatus, MetricsJson } from "@/types/dashboard";
import { createAuditLog } from "./audit";

// ─── Helper ──────────────────────────────────────────
const safeParseMetrics = (json: string): MetricsJson => {
  try {
    return JSON.parse(json) as MetricsJson;
  } catch {
    return { dribble: { inAndOut: 0, crossover: 0, vLeft: 0, vRight: 0, betweenLegsLeft: 0, betweenLegsRight: 0 }, passing: { chestPass: 0, bouncePass: 0, overheadPass: 0 }, layUp: 0, shooting: 0 };
  }
};

// 1. Submit Attendance
export async function submitAttendanceAction(data: { date: string; playerStatuses: { playerId: string; status: AttendanceStatus }[]; note?: string; eventId: string }) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  if (!data.playerStatuses || data.playerStatuses.length === 0) {
    throw new Error("Minimal ada 1 pemain untuk didaftarkan kehadirannya.");
  }

  const dedupedStatuses = Array.from(new Map(data.playerStatuses.filter((ps) => ps.playerId).map((ps) => [ps.playerId, ps.status] as const)).entries()).map(([playerId, status]) => ({ playerId, status }));

  if (dedupedStatuses.length === 0) {
    throw new Error("Data pemain untuk presensi tidak valid.");
  }

  if (!data.eventId.trim()) {
    throw new Error("Agenda tidak valid untuk submit presensi.");
  }

  const dateObj = toJakartaDate(data.date);

  await prisma.$transaction(async (tx) => {
    const playerIds = dedupedStatuses.map((ps) => ps.playerId);
    const existingPlayers = await tx.player.findMany({
      where: { id: { in: playerIds }, isDeleted: false },
      select: { id: true },
    });

    const existingPlayerIds = new Set(existingPlayers.map((p) => p.id));
    const invalidPlayers = playerIds.filter((id) => !existingPlayerIds.has(id));

    if (invalidPlayers.length > 0) {
      throw new Error(`Pemain tidak ditemukan atau sudah dihapus: ${invalidPlayers.join(", ")}`);
    }

    const sameDayAttendances = await tx.attendance.findMany({
      where: {
        playerId: { in: playerIds },
        date: dateObj,
      },
      select: { playerId: true, eventId: true },
    });

    // eventId === null = presensi legacy standalone; jangan diam-diam overwrite
    const conflicts = sameDayAttendances.filter((attendance) => attendance.eventId == null || attendance.eventId !== data.eventId);
    if (conflicts.length > 0) {
      throw new Error("Sebagian pemain sudah punya absensi dari agenda lain pada tanggal yang sama.");
    }

    for (const ps of dedupedStatuses) {
      await tx.attendance.upsert({
        where: { playerId_date: { playerId: ps.playerId, date: dateObj } },
        update: { status: ps.status, note: data.note, eventId: data.eventId },
        create: { id: crypto.randomUUID(), playerId: ps.playerId, date: dateObj, status: ps.status, note: data.note, eventId: data.eventId },
      });
    }

    await createAuditLog(tx, "SUBMIT_ATTENDANCE", "attendance_batch", `Date: ${data.date}, Count: ${dedupedStatuses.length}`, userId);
  });

  revalidatePath("/dashboard/attendances");
  return { success: true as const, savedCount: dedupedStatuses.length };
}

// 2. Submit Statistics (period-based, dengan history revisi)
export async function submitStatisticAction(data: { playerId: string; periodId: string; metrics: MetricsJson; status: "Draft" | "Published" }) {
  const session = await requireAdmin();
  const userId = session.user.id as string | undefined;

  const stat = await prisma.$transaction(async (tx) => {
    const period = await tx.evaluationPeriod.findUnique({ where: { id: data.periodId } });
    if (!period) throw new Error("Periode evaluasi tidak ditemukan.");
    if (!period.isActive) throw new Error("Akses Ditolak: Periode evaluasi ini sudah dikunci/ditutup. Perubahan nilai tidak lagi diizinkan.");

    const existing = await tx.statistic.findUnique({
      where: { playerId_periodId: { playerId: data.playerId, periodId: data.periodId } },
    });

    if (existing) {
      const updated = await tx.statistic.update({
        where: { id: existing.id },
        data: {
          metricsJson: JSON.stringify(data.metrics),
          status: data.status,
        },
      });

      await createAuditLog(tx, "UPDATE_STATS", "statistic", updated.id, userId);
      return updated;
    }

    const created = await tx.statistic.create({
      data: {
        playerId: data.playerId,
        periodId: data.periodId,
        date: period.startDate,
        metricsJson: JSON.stringify(data.metrics),
        status: data.status,
      },
    });

    await createAuditLog(tx, "CREATE_STATS", "statistic", created.id, userId);
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
          id: true,
          name: true,
          groupId: true,
          group: { select: { id: true, name: true } },
        },
      },
      period: { select: { id: true, name: true } },
    },
    orderBy: [{ player: { group: { name: "asc" } } }, { player: { name: "asc" } }],
  });

  return stats.map((s) => ({ ...s, metricsJson: safeParseMetrics(s.metricsJson as string) }));
}

// 4. Get history revisi untuk satu statistic
export async function getStatHistoryAction(statisticId: string) {
  await requireAdmin();

  const history = await prisma.statisticHistory.findMany({
    where: { statisticId },
    include: { user: { select: { name: true, username: true } } },
    orderBy: { editedAt: "desc" },
  });

  return history.map((h) => ({ ...h, metricsJson: safeParseMetrics(h.metricsJson as string) }));
}

// 5. Get Player Stats (Parent-safe — untuk portal pemain)
export async function getPlayerStatsAction(playerId: string) {
  const session = await requireAuth();
  const { role: userRole, id: userId } = session.user;

  if (userRole === "PARENT") {
    const parentOwnsChild = await prisma.player.findFirst({
      where: { id: playerId, parentId: userId, isDeleted: false },
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

  return stats.map((s) => ({ ...s, metricsJson: safeParseMetrics(s.metricsJson as string) }));
}
