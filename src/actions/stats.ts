"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createAuditLog } from "@/actions/audit";
import { acquireAdvisoryLock, withSerializableTransaction } from "@/lib/db-concurrency";
import { toJakartaDate } from "@/lib/date-utils";
import {
  buildDynamicMetricsJson,
  calculateAttendanceScore,
  FIXED_ASPECT_MAX_SCORE,
  buildMetricFieldKey,
  normalizeEvaluationConfig,
  type MetricsJsonV2,
} from "@/lib/evaluation-rules";
import { prisma } from "@/lib/prisma";
import { buildReportArchiveSnapshot, freezeHistoricalSnapshot } from "@/lib/report-signer";
import {
  getReportSignerResolverContext,
  resolveReportSignerSnapshotForGroup,
} from "@/lib/report-signer-resolver";
import { requireAdmin, requireSessionRole, requireActiveUser } from "@/lib/server-auth";
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
  revalidatePath("/coach/statistics");
}

function normalizeDynamicMetricInput(config: ReturnType<typeof normalizeEvaluationConfig>, rawMetrics: unknown) {
  const source =
    rawMetrics && typeof rawMetrics === "object" && !Array.isArray(rawMetrics)
      ? (rawMetrics as Record<string, unknown>)
      : {};
  const values: Record<string, number> = {};

  for (const category of config.categories) {
    for (const item of category.items) {
      const fieldKey = buildMetricFieldKey(category.id, item.id);
      const rawValue = source[fieldKey];

      if (rawValue == null || rawValue === "") {
        values[fieldKey] = 0;
        continue;
      }

      const numericValue =
        typeof rawValue === "number"
          ? rawValue
          : typeof rawValue === "string"
            ? Number(rawValue)
            : Number.NaN;

      if (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > FIXED_ASPECT_MAX_SCORE) {
        throw new Error(`Nilai aspek "${item.label}" harus berada dalam rentang 0-10.`);
      }

      values[fieldKey] = Math.round(numericValue);
    }
  }

  return values;
}

export async function submitAttendanceAction(data: {
  date: string;
  playerStatuses: { playerId: string; status: AttendanceStatus }[];
  note?: string;
  eventId: string;
}) {
  const session = await requireActiveUser();
  const { role, id: userId } = session.user;

  if (role !== "ADMIN" && role !== "COACH") {
    throw new Error("Akses Ditolak: Hanya Admin atau Pelatih yang diizinkan.");
  }

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
    let assignedGroupIds: string[] = [];
    if (role === "COACH") {
      const coach = await tx.coachProfile.findUnique({
        where: { userId, isDeleted: false },
        include: { assignments: true },
      });
      if (!coach) {
        throw new Error("Akses Ditolak: Profil pelatih tidak ditemukan.");
      }
      assignedGroupIds = coach.assignments.map((a) => a.groupId);
    }

    const playerIds = dedupedStatuses.map((playerStatus) => playerStatus.playerId);
    const lockKeys = [...playerIds]
      .sort()
      .map((playerId) => `attendance:${payload.date}:${playerId}`);

    for (const lockKey of lockKeys) {
      await acquireAdvisoryLock(tx, lockKey);
    }

    const event = await tx.event.findUnique({
      where: { id: payload.eventId },
      select: {
        id: true,
        eventGroups: {
          select: { groupId: true }
        }
      },
    });

    if (!event) {
      throw new Error("Agenda untuk presensi tidak ditemukan atau sudah dihapus.");
    }

    if (role === "COACH") {
      const eventGroupIds = event.eventGroups.map((eg) => eg.groupId);
      const isAssigned = eventGroupIds.some((gid) => assignedGroupIds.includes(gid));
      if (!isAssigned) {
        throw new Error("Akses Ditolak: Anda tidak ditugaskan untuk agenda ini.");
      }
    }

    const existingPlayers = await tx.player.findMany({
      where: {
        id: { in: playerIds },
        isDeleted: false,
        ...(role === "COACH" ? { groupId: { in: assignedGroupIds } } : {}),
      },
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
  revalidatePath("/coach/attendances");
  return { success: true as const, savedCount: dedupedStatuses.length };
}

export async function submitStatisticAction(data: {
  playerId: string;
  periodId: string;
  metrics: MetricsJson | MetricsJsonV2 | Record<string, number>;
  status: "Draft" | "Published";
  notes?: string;
}) {
  const session = await requireActiveUser();
  const { role, id: userId } = session.user;

  if (role !== "ADMIN" && role !== "COACH") {
    throw new Error("Akses Ditolak: Hanya Admin atau Pelatih yang diizinkan.");
  }

  const parsed = statisticSubmitSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error(
      "Payload nilai tidak valid. Periksa pemain, periode, dan nilai yang dikirim.",
    );
  }

  const payload = parsed.data;

  if (role === "COACH" && payload.status === "Published") {
    throw new Error(
      "Akses Ditolak: Pelatih hanya diperbolehkan menyimpan nilai sebagai Draft. Publikasi hanya dapat dilakukan oleh Admin.",
    );
  }

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
                    signatureUrl: true,
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

    if (role === "COACH") {
      const coach = await tx.coachProfile.findUnique({
        where: { userId, isDeleted: false },
        include: { assignments: true },
      });
      if (!coach) {
        throw new Error("Akses Ditolak: Profil pelatih tidak ditemukan.");
      }
      const assignedGroupIds = coach.assignments.map((a) => a.groupId);
      if (!player.group?.id || !assignedGroupIds.includes(player.group.id)) {
        throw new Error(
          "Akses Ditolak: Anda tidak ditugaskan untuk kelompok pemain ini.",
        );
      }
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
    const dynamicMetricValues = evaluationConfig
      ? normalizeDynamicMetricInput(evaluationConfig, payload.metrics)
      : null;
    const metricsJson =
      evaluationConfig
        ? buildDynamicMetricsJson({
            config: evaluationConfig,
            values: dynamicMetricValues ?? {},
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
        coachSignUrlSnapshot: true,
        status: true,
      },
    });

    const signerContext = await getReportSignerResolverContext(tx);
    const statisticSnapshot = player.group
      ? buildReportArchiveSnapshot({
          group: player.group,
          signer: resolveReportSignerSnapshotForGroup(player.group, signerContext),
        })
      : {
          groupId: null,
          groupNameSnapshot: null,
          homebaseIdSnapshot: null,
          homebaseNameSnapshot: null,
          coachProfileIdSnapshot: null,
          coachNameSnapshot: null,
          coachSignUrlSnapshot: null,
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
            coachSignUrlSnapshot: existingStatistic.coachSignUrlSnapshot,
          }
        : null,
      {
        groupIdSnapshot: statisticSnapshot.groupId,
        groupNameSnapshot: statisticSnapshot.groupNameSnapshot,
        homebaseIdSnapshot: statisticSnapshot.homebaseIdSnapshot,
        homebaseNameSnapshot: statisticSnapshot.homebaseNameSnapshot,
        coachProfileIdSnapshot: statisticSnapshot.coachProfileIdSnapshot,
        coachNameSnapshot: statisticSnapshot.coachNameSnapshot,
        coachSignUrlSnapshot: statisticSnapshot.coachSignUrlSnapshot,
      },
    );

    if (existingStatistic) {
      if (role === "COACH" && existingStatistic.status === "Published") {
        throw new Error(
          "Akses Ditolak: Nilai yang sudah diterbitkan tidak dapat diubah oleh Pelatih."
        );
      }

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
  const session = await requireSessionRole();
  const { role, id: userId } = session.user;
  if (role !== "ADMIN" && role !== "COACH") {
    throw new Error("Akses ditolak");
  }

  let assignedGroupIds: string[] = [];
  if (role === "COACH") {
    const coach = await prisma.coachProfile.findUnique({
      where: { userId, isDeleted: false },
      include: { assignments: true },
    });
    if (!coach) return [];
    assignedGroupIds = coach.assignments.map((a) => a.groupId);
  }

  const statistics = await prisma.statistic.findMany({
    where: {
      periodId,
      player: {
        isDeleted: false,
        ...(role === "COACH" ? { groupId: { in: assignedGroupIds } } : {}),
      },
    },
    select: {
      id: true,
      status: true,
      groupIdSnapshot: true,
      groupNameSnapshot: true,
      homebaseIdSnapshot: true,
      homebaseNameSnapshot: true,
      coachProfileIdSnapshot: true,
      coachNameSnapshot: true,
      coachSignUrlSnapshot: true,
      metricsJson: true,
      player: {
        select: {
          id: true,
          groupId: true,
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
                      signatureUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ player: { group: { name: "asc" } } }, { player: { name: "asc" } }],
  });

  const signerContext = await getReportSignerResolverContext(prisma);

  return statistics.map((statistic) => {
    const resolvedSigner = resolveReportSignerSnapshotForGroup(
      statistic.player.group,
      signerContext,
    );

    return {
      ...statistic,
      coachNameResolved: statistic.coachNameSnapshot ?? resolvedSigner.coachNameSnapshot,
      coachSignUrlResolved:
        statistic.coachSignUrlSnapshot ?? resolvedSigner.coachSignUrlSnapshot,
      resolutionSource: (statistic.coachNameSnapshot ? "SNAPSHOT" : resolvedSigner.resolutionSource) as "GROUP" | "HOMEBASE" | "GLOBAL" | "SNAPSHOT",
      metricsJson: parseMetrics(statistic.metricsJson),
    };
  });
}

export async function getStatHistoryAction(statisticId: string) {
  const session = await requireSessionRole();
  const { role, id: userId } = session.user;
  if (role !== "ADMIN" && role !== "COACH") {
    throw new Error("Akses ditolak");
  }

  const stat = await prisma.statistic.findUnique({
    where: { id: statisticId },
    select: { player: { select: { groupId: true } } },
  });
  if (!stat) throw new Error("Data nilai tidak ditemukan");

  if (role === "COACH") {
    const coach = await prisma.coachProfile.findUnique({
      where: { userId, isDeleted: false },
      include: { assignments: true },
    });
    if (!coach) throw new Error("Profil coach tidak ditemukan.");
    const assignedGroupIds = coach.assignments.map((a) => a.groupId);
    if (!stat.player?.groupId || !assignedGroupIds.includes(stat.player.groupId)) {
      throw new Error("Akses Ditolak: Anda tidak memiliki wewenang untuk melihat riwayat nilai pemain ini.");
    }
  }

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

  if (role !== "PARENT" && role !== "ADMIN" && role !== "COACH") {
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
  } else if (role === "COACH") {
    const coach = await prisma.coachProfile.findUnique({
      where: { userId, isDeleted: false },
      include: { assignments: true },
    });
    if (!coach) throw new Error("Profil pelatih tidak ditemukan.");
    const assignedGroupIds = coach.assignments.map((a) => a.groupId);
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { groupId: true },
    });
    if (!player?.groupId || !assignedGroupIds.includes(player.groupId)) {
      throw new Error("Akses Ditolak: Anda tidak memiliki wewenang untuk melihat nilai pemain ini.");
    }
  }

  const statistics = await prisma.statistic.findMany({
    where: {
      playerId,
      player: { isDeleted: false },
      ...(role === "PARENT" ? { status: "Published" } : {}),
    },
    include: {
      period: { select: { id: true, name: true } },
      player: {
        select: {
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
                      signatureUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  const signerContext = await getReportSignerResolverContext(prisma);

  return statistics.map((statistic) => {
    const resolvedSigner = resolveReportSignerSnapshotForGroup(
      statistic.player.group,
      signerContext,
    );

    return {
      ...statistic,
      coachNameResolved: statistic.coachNameSnapshot ?? resolvedSigner.coachNameSnapshot,
      coachSignUrlResolved:
        statistic.coachSignUrlSnapshot ?? resolvedSigner.coachSignUrlSnapshot,
      resolutionSource: (statistic.coachNameSnapshot ? "SNAPSHOT" : resolvedSigner.resolutionSource) as "GROUP" | "HOMEBASE" | "GLOBAL" | "SNAPSHOT",
      metricsJson: parseMetrics(statistic.metricsJson),
    };
  });
}
