"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireSessionRole } from "@/lib/server-auth";
import { toJakartaDate } from "@/lib/date-utils";
import type { AttendanceStatus, MetricsJson } from "@/types/dashboard";
import { createAuditLog } from "./audit";
import { acquireAdvisoryLock, withSerializableTransaction } from "@/lib/db-concurrency";

import { z } from "zod";

const metricsSchema = z.object({
  dribble: z.object({
    inAndOut: z.number().catch(0),
    crossover: z.number().catch(0),
    vLeft: z.number().catch(0),
    vRight: z.number().catch(0),
    betweenLegsLeft: z.number().catch(0),
    betweenLegsRight: z.number().catch(0),
  }).catch({ inAndOut: 0, crossover: 0, vLeft: 0, vRight: 0, betweenLegsLeft: 0, betweenLegsRight: 0 }),
  passing: z.object({
    chestPass: z.number().catch(0),
    bouncePass: z.number().catch(0),
    overheadPass: z.number().catch(0),
  }).catch({ chestPass: 0, bouncePass: 0, overheadPass: 0 }),
  layUp: z.number().catch(0),
  shooting: z.number().catch(0),
  notes: z.string().optional(),
});

const safeParseMetrics = (json: unknown): MetricsJson => {
  const parsed = metricsSchema.safeParse(json);
  if (parsed.success) {
    return parsed.data;
  }
  return { dribble: { inAndOut: 0, crossover: 0, vLeft: 0, vRight: 0, betweenLegsLeft: 0, betweenLegsRight: 0 }, passing: { chestPass: 0, bouncePass: 0, overheadPass: 0 }, layUp: 0, shooting: 0 };
};

const attendanceSubmitSchema = z.object({
  date: z.string().trim().min(1),
  note: z.string().max(500).optional(),
  eventId: z.string().trim().min(1),
  playerStatuses: z.array(z.object({
    playerId: z.string().trim().min(1),
    status: z.enum(["HADIR", "IZIN", "SAKIT", "ALPA"]),
  })).min(1),
});

const statisticSubmitSchema = z.object({
  playerId: z.string().trim().min(1),
  periodId: z.string().trim().min(1),
  metrics: metricsSchema,
  status: z.enum(["Draft", "Published"]),
});

export async function submitAttendanceAction(data: { date: string; playerStatuses: { playerId: string; status: AttendanceStatus }[]; note?: string; eventId: string }) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  const parsedData = attendanceSubmitSchema.safeParse(data);
  if (!parsedData.success) {
    throw new Error("Payload presensi tidak valid. Periksa tanggal, agenda, dan data pemain.");
  }

  const payload = parsedData.data;

  const dedupedStatuses = Array.from(new Map(payload.playerStatuses.map((ps) => [ps.playerId, ps.status] as const)).entries()).map(([playerId, status]) => ({ playerId, status }));

  if (dedupedStatuses.length === 0) {
    throw new Error("Data pemain untuk presensi tidak valid.");
  }

  const dateObj = toJakartaDate(payload.date);

  await withSerializableTransaction(async (tx) => {
    const playerIds = dedupedStatuses.map((ps) => ps.playerId);
    const lockKeys = [...playerIds].sort().map((playerId) => `attendance:${payload.date}:${playerId}`);

    for (const lockKey of lockKeys) {
      await acquireAdvisoryLock(tx, lockKey);
    }

    const event = await tx.event.findUnique({
      where: { id: payload.eventId },
      select: { id: true },
    });

    if (!event) {
      throw new Error("Agenda untuk presensi tidak ditemukan atau sudah dihapus.");
    }

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
        update: { status: ps.status, note: payload.note, eventId: payload.eventId },
        create: { playerId: ps.playerId, date: dateObj, status: ps.status, note: payload.note, eventId: payload.eventId },
      });
    }

    await createAuditLog(tx, "SUBMIT_ATTENDANCE", "attendance_batch", `Date: ${payload.date}, Count: ${dedupedStatuses.length}`, userId);
  });

  revalidatePath("/dashboard/attendances");
  return { success: true as const, savedCount: dedupedStatuses.length };
}

export async function submitStatisticAction(data: { playerId: string; periodId: string; metrics: MetricsJson; status: "Draft" | "Published" }) {
  const session = await requireAdmin();
  const userId = session.user.id as string | undefined;
  const parsedData = statisticSubmitSchema.safeParse(data);

  if (!parsedData.success) {
    throw new Error("Payload nilai tidak valid. Periksa pemain, periode, dan nilai yang dikirim.");
  }

  const payload = parsedData.data;

  const stat = await withSerializableTransaction(async (tx) => {
    await acquireAdvisoryLock(tx, `statistic:${payload.playerId}:${payload.periodId}`);

    const player = await tx.player.findUnique({
      where: { id: payload.playerId },
      select: { id: true, isDeleted: true },
    });
    if (!player || player.isDeleted) throw new Error("Pemain untuk input nilai tidak ditemukan.");

    const period = await tx.evaluationPeriod.findUnique({ where: { id: payload.periodId } });
    if (!period) throw new Error("Periode evaluasi tidak ditemukan.");
    if (!period.isActive) throw new Error("Akses Ditolak: Periode evaluasi ini sudah dikunci/ditutup. Perubahan nilai tidak lagi diizinkan.");

    const existing = await tx.statistic.findUnique({
      where: { playerId_periodId: { playerId: payload.playerId, periodId: payload.periodId } },
    });

    if (existing) {
      const updated = await tx.statistic.update({
        where: { id: existing.id },
        data: {
          metricsJson: payload.metrics,
          status: payload.status,
        },
      });

      await createAuditLog(tx, "UPDATE_STATS", "statistic", updated.id, userId);
      return updated;
    }

    const created = await tx.statistic.create({
      data: {
        playerId: payload.playerId,
        periodId: payload.periodId,
        date: period.startDate,
        metricsJson: payload.metrics,
        status: payload.status,
      },
    });

    await createAuditLog(tx, "CREATE_STATS", "statistic", created.id, userId);
    return created;
  });

  revalidatePath("/dashboard/statistics");
  return stat;
}

export async function getStatsByPeriodAction(periodId: string) {
  await requireSessionRole("ADMIN");

  const stats = await prisma.statistic.findMany({
    where: { periodId, player: { isDeleted: false } },
    select: {
      id: true,
      status: true,
      metricsJson: true,
      player: {
        select: {
          id: true,
          groupId: true,
          group: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ player: { group: { name: "asc" } } }, { player: { name: "asc" } }],
  });

  return stats.map((s) => ({ ...s, metricsJson: safeParseMetrics(s.metricsJson) }));
}

export async function getStatHistoryAction(statisticId: string) {
  await requireSessionRole("ADMIN");

  const history = await prisma.statisticHistory.findMany({
    where: { statisticId },
    include: { user: { select: { name: true, username: true } } },
    orderBy: { editedAt: "desc" },
  });

  return history.map((h) => ({ ...h, metricsJson: safeParseMetrics(h.metricsJson) }));
}

export async function getPlayerStatsAction(playerId: string) {
  const session = await requireSessionRole();
  const { role: userRole, id: userId } = session.user;
  if (userRole !== "PARENT" && userRole !== "ADMIN") {
    throw new Error("Akses ke evaluasi pemain tidak diizinkan untuk role ini.");
  }

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

  return stats.map((s) => ({ ...s, metricsJson: safeParseMetrics(s.metricsJson) }));
}
