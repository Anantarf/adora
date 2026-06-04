"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createAuditLog } from "@/actions/audit";
import { acquireAdvisoryLock, withSerializableTransaction } from "@/lib/db-concurrency";
import { toJakartaDate } from "@/lib/date-utils";
import {
  buildDynamicMetricsJson,
  calculateAttendanceScore,
  normalizeEvaluationConfig,
  type MetricsJsonV2,
} from "@/lib/evaluation-rules";
import { prisma } from "@/lib/prisma";
import { buildReportArchiveSnapshot, freezeHistoricalSnapshot } from "@/lib/report-signer";
import { requireAdmin, requireSessionRole } from "@/lib/server-auth";
import type { AttendanceStatus, MetricsJson } from "@/types/dashboard";

const EMPTY_METRICS: MetricsJson = {
  dribble: {
    inAndOut: 0,
    crossover: 0,
    vLeft: 0,
    vRight: 0,
    betweenLegsLeft: 0,
    betweenLegsRight: 0,
  },
  passing: {
    chestPass: 0,
    bouncePass: 0,
    overheadPass: 0,
  },
  layUp: 0,
  shooting: 0,
};

const metricsSchema = z.object({
  dribble: z
    .object({
      inAndOut: z.number().catch(0),
      crossover: z.number().catch(0),
      vLeft: z.number().catch(0),
      vRight: z.number().catch(0),
      betweenLegsLeft: z.number().catch(0),
      betweenLegsRight: z.number().catch(0),
    })
    .catch(EMPTY_METRICS.dribble),
  passing: z
    .object({
      chestPass: z.number().catch(0),
      bouncePass: z.number().catch(0),
      overheadPass: z.number().catch(0),
    })
    .catch(EMPTY_METRICS.passing),
  layUp: z.number().catch(0),
  shooting: z.number().catch(0),
  notes: z.string().optional(),
});

const attendanceSubmitSchema = z.object({
  date: z.string().trim().min(1),
  note: z.string().max(500).optional(),
  eventId: z.string().trim().min(1),
  playerStatuses: z
    .array(
      z.object({
        playerId: z.string().trim().min(1),
        status: z.enum(["HADIR", "IZIN", "SAKIT", "ALPA"]),
      }),
    )
    .min(1),
});

const statisticSubmitSchema = z.object({
  playerId: z.string().trim().min(1),
  periodId: z.string().trim().min(1),
  metrics: z.unknown(),
  status: z.enum(["Draft", "Published"]),
  notes: z.string().max(1000).optional(),
});

function parseMetrics(metricsJson: unknown): MetricsJson | MetricsJsonV2 {
  if (
    metricsJson &&
    typeof metricsJson === "object" &&
    (metricsJson as { version?: string }).version === "v2"
  ) {
    return metricsJson as MetricsJsonV2;
  }

  const parsed = metricsSchema.safeParse(metricsJson);
  return parsed.success ? parsed.data : EMPTY_METRICS;
}

function revalidateStatisticsPages() {
  revalidatePath("/dashboard/statistics");
}

export async function submitAttendanceAction(data: {
  date: string;
  playerStatuses: { playerId: string; status: AttendanceStatus }[];
  note?: string;
  eventId: string;
}) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;
  const parsed = attendanceSubmitSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error(
      "Payload presensi tidak valid. Periksa tanggal, agenda, dan data pemain.",
    );
  }

  const payload = parsed.data;
  const dedupedStatuses = Array.from(
    new Map(
      payload.playerStatuses.map((playerStatus) => [
        playerStatus.playerId,
        playerStatus.status,
      ]),
    ).entries(),
  ).map(([playerId, status]) => ({ playerId, status }));

  if (dedupedStatuses.length === 0) {
    throw new Error("Data pemain untuk presensi tidak valid.");
  }

  const attendanceDate = toJakartaDate(payload.date);

  await withSerializableTransaction(async (tx) => {
    const playerIds = dedupedStatuses.map((playerStatus) => playerStatus.playerId);
    const lockKeys = [...playerIds]
      .sort()
      .map((playerId) => `attendance:${payload.date}:${playerId}`);

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

    const existingPlayerIds = new Set(existingPlayers.map((player) => player.id));
    const invalidPlayers = playerIds.filter((id) => !existingPlayerIds.has(id));

    if (invalidPlayers.length > 0) {
      throw new Error(
        `Pemain tidak ditemukan atau sudah dihapus: ${invalidPlayers.join(", ")}`,
      );
    }

    const sameDayAttendances = await tx.attendance.findMany({
      where: {
        playerId: { in: playerIds },
        date: attendanceDate,
      },
      select: { playerId: true, eventId: true },
    });

    const conflicts = sameDayAttendances.filter(
      (attendance) =>
        attendance.eventId == null || attendance.eventId !== payload.eventId,
    );

    if (conflicts.length > 0) {
      throw new Error(
        "Sebagian pemain sudah punya absensi dari agenda lain pada tanggal yang sama.",
      );
    }

    for (const playerStatus of dedupedStatuses) {
      await tx.attendance.upsert({
        where: {
          playerId_date: {
            playerId: playerStatus.playerId,
            date: attendanceDate,
          },
        },
        update: {
          status: playerStatus.status,
          note: payload.note,
          eventId: payload.eventId,
        },
        create: {
          playerId: playerStatus.playerId,
          date: attendanceDate,
          status: playerStatus.status,
          note: payload.note,
          eventId: payload.eventId,
        },
      });
    }

    await createAuditLog(
      tx,
      "SUBMIT_ATTENDANCE",
      "attendance_batch",
      `Date: ${payload.date}, Count: ${dedupedStatuses.length}`,
      userId,
    );
  });

  revalidatePath("/dashboard/attendances");
  return { success: true as const, savedCount: dedupedStatuses.length };
}

export async function submitStatisticAction(data: {
  playerId: string;
  periodId: string;
  metrics: MetricsJson | MetricsJsonV2 | Record<string, number>;
  status: "Draft" | "Published";
  notes?: string;
}) {
  const session = await requireAdmin();
  const userId = session.user.id as string | undefined;
  const parsed = statisticSubmitSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error(
      "Payload nilai tidak valid. Periksa pemain, periode, dan nilai yang dikirim.",
    );
  }

  const payload = parsed.data;

  const statistic = await withSerializableTransaction(async (tx) => {
    await acquireAdvisoryLock(tx, `statistic:${payload.playerId}:${payload.periodId}`);

    const player = await tx.player.findUnique({
      where: { id: payload.playerId },
      select: {
        id: true,
        isDeleted: true,
        group: {
          select: {
            id: true,
            name: true,
            homebase: {
              select: {
                id: true,
                name: true,
              },
            },
            coachAssignment: {
              select: {
                coachProfile: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!player || player.isDeleted) {
      throw new Error("Pemain untuk input nilai tidak ditemukan.");
    }

    const period = await tx.evaluationPeriod.findUnique({
      where: { id: payload.periodId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        startDate: true,
        endDate: true,
        isActive: true,
        evaluationConfigJson: true,
      },
    });

    if (!period) {
      throw new Error("Periode evaluasi tidak ditemukan.");
    }

    if (!period.isActive) {
      throw new Error(
        "Akses Ditolak: Periode evaluasi ini sudah dikunci/ditutup. Perubahan nilai tidak lagi diizinkan.",
      );
    }

    const evaluationConfig = period.evaluationConfigJson
      ? normalizeEvaluationConfig(period.evaluationConfigJson)
      : null;

    const attendanceRows = await tx.attendance.findMany({
      where: {
        playerId: payload.playerId,
        date: {
          gte: period.startDate,
          lte: period.endDate,
        },
      },
      select: {
        status: true,
      },
    });

    const attendanceCounts = attendanceRows.reduce(
      (summary, attendance) => {
        summary[attendance.status] += 1;
        return summary;
      },
      { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 } as Record<AttendanceStatus, number>,
    );

    const attendanceSnapshot = evaluationConfig?.attendance.enabled
      ? calculateAttendanceScore(attendanceCounts, evaluationConfig.attendance)
      : null;

    const legacyMetrics = metricsSchema.safeParse(payload.metrics);
    const metricsJson =
      evaluationConfig
        ? buildDynamicMetricsJson({
            config: evaluationConfig,
            values: (payload.metrics as Record<string, number>) ?? {},
            notes: payload.notes,
            attendance: attendanceSnapshot,
          })
        : legacyMetrics.success
          ? legacyMetrics.data
          : EMPTY_METRICS;
    const serializedMetricsJson = JSON.parse(JSON.stringify(metricsJson));

    const existingStatistic = await tx.statistic.findUnique({
      where: {
        playerId_periodId: {
          playerId: payload.playerId,
          periodId: payload.periodId,
        },
      },
      select: {
        id: true,
        groupIdSnapshot: true,
        groupNameSnapshot: true,
        homebaseIdSnapshot: true,
        homebaseNameSnapshot: true,
        coachProfileIdSnapshot: true,
        coachNameSnapshot: true,
      },
    });

    const statisticSnapshot = player.group
      ? buildReportArchiveSnapshot({ group: player.group })
      : {
          groupId: null,
          groupNameSnapshot: null,
          homebaseIdSnapshot: null,
          homebaseNameSnapshot: null,
          coachProfileIdSnapshot: null,
          coachNameSnapshot: null,
        };

    const frozenStatisticSnapshot = freezeHistoricalSnapshot(
      existingStatistic
        ? {
            groupIdSnapshot: existingStatistic.groupIdSnapshot,
            groupNameSnapshot: existingStatistic.groupNameSnapshot,
            homebaseIdSnapshot: existingStatistic.homebaseIdSnapshot,
            homebaseNameSnapshot: existingStatistic.homebaseNameSnapshot,
            coachProfileIdSnapshot: existingStatistic.coachProfileIdSnapshot,
            coachNameSnapshot: existingStatistic.coachNameSnapshot,
          }
        : null,
      {
        groupIdSnapshot: statisticSnapshot.groupId,
        groupNameSnapshot: statisticSnapshot.groupNameSnapshot,
        homebaseIdSnapshot: statisticSnapshot.homebaseIdSnapshot,
        homebaseNameSnapshot: statisticSnapshot.homebaseNameSnapshot,
        coachProfileIdSnapshot: statisticSnapshot.coachProfileIdSnapshot,
        coachNameSnapshot: statisticSnapshot.coachNameSnapshot,
      },
    );

    if (existingStatistic) {
      const updatedStatistic = await tx.statistic.update({
        where: { id: existingStatistic.id },
        data: {
          metricsJson: serializedMetricsJson,
          status: payload.status,
          ...frozenStatisticSnapshot,
        },
      });

      await createAuditLog(tx, "UPDATE_STATS", "statistic", updatedStatistic.id, userId);
      return updatedStatistic;
    }

    const createdStatistic = await tx.statistic.create({
      data: {
        playerId: payload.playerId,
        periodId: payload.periodId,
        date: period.startDate,
        metricsJson: serializedMetricsJson,
        status: payload.status,
        ...frozenStatisticSnapshot,
      },
    });

    await createAuditLog(tx, "CREATE_STATS", "statistic", createdStatistic.id, userId);
    return createdStatistic;
  });

  revalidateStatisticsPages();
  return statistic;
}

export async function getStatsByPeriodAction(periodId: string) {
  await requireSessionRole("ADMIN");

  const statistics = await prisma.statistic.findMany({
    where: { periodId, player: { isDeleted: false } },
    select: {
      id: true,
      status: true,
      groupIdSnapshot: true,
      groupNameSnapshot: true,
      homebaseIdSnapshot: true,
      homebaseNameSnapshot: true,
      coachProfileIdSnapshot: true,
      coachNameSnapshot: true,
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

  return statistics.map((statistic) => ({
    ...statistic,
    metricsJson: parseMetrics(statistic.metricsJson),
  }));
}

export async function getStatHistoryAction(statisticId: string) {
  await requireSessionRole("ADMIN");

  const history = await prisma.statisticHistory.findMany({
    where: { statisticId },
    include: { user: { select: { name: true, username: true } } },
    orderBy: { editedAt: "desc" },
  });

  return history.map((entry) => ({
    ...entry,
    metricsJson: parseMetrics(entry.metricsJson),
  }));
}

export async function getPlayerStatsAction(playerId: string) {
  const session = await requireSessionRole();
  const { role, id: userId } = session.user;

  if (role !== "PARENT" && role !== "ADMIN") {
    throw new Error("Akses ke evaluasi pemain tidak diizinkan untuk role ini.");
  }

  if (role === "PARENT") {
    const parentOwnsChild = await prisma.player.findFirst({
      where: { id: playerId, parentId: userId, isDeleted: false },
    });

    if (!parentOwnsChild) {
      throw new Error(
        "Akses Terlarang: Anda tidak diizinkan melihat evaluasi anak dari keluarga lain.",
      );
    }
  }

  const statistics = await prisma.statistic.findMany({
    where: { playerId, player: { isDeleted: false }, status: "Published" },
    include: { period: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });

  return statistics.map((statistic) => ({
    ...statistic,
    metricsJson: parseMetrics(statistic.metricsJson),
  }));
}
