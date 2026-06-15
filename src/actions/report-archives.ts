"use server";

import { revalidatePath } from "next/cache";

import { createAuditLog } from "@/actions/audit";
import { ensureOwnedPlayer } from "@/lib/domain-guards";
import { prisma } from "@/lib/prisma";
import { buildReportArchiveSnapshot, freezeHistoricalSnapshot } from "@/lib/report-signer";
import {
  getReportSignerResolverContext,
  resolveReportSignerSnapshotForGroup,
} from "@/lib/report-signer-resolver";
import { requireActiveUser, requireAdmin } from "@/lib/server-auth";

export async function getReportArchiveRowsAction(groupId: string, periodId: string) {
  await requireAdmin();

  const [players, archives] = await Promise.all([
    prisma.player.findMany({
      where: {
        groupId,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.reportArchive.findMany({
      where: {
        groupId,
        periodId,
      },
      select: {
        id: true,
        playerId: true,
        fileUrl: true,
        status: true,
        releasedAt: true,
        updatedAt: true,
        player: {
          select: {
            id: true,
            name: true,
            isDeleted: true,
          },
        },
      },
      orderBy: { player: { name: "asc" } },
    }),
  ]);

  const byPlayerId = new Map<
    string,
    {
      archiveId?: string;
      fileUrl?: string;
      playerId: string;
      playerName: string;
      releasedAt?: Date | null;
      status?: "DRAFT" | "RELEASED";
      updatedAt?: Date;
    }
  >();

  for (const player of players) {
    byPlayerId.set(player.id, {
      playerId: player.id,
      playerName: player.name,
    });
  }

  for (const archive of archives) {
    byPlayerId.set(archive.playerId, {
      archiveId: archive.id,
      fileUrl: archive.fileUrl,
      playerId: archive.playerId,
      playerName: archive.player.name,
      releasedAt: archive.releasedAt,
      status: archive.status,
      updatedAt: archive.updatedAt,
    });
  }

  return Array.from(byPlayerId.values()).sort((a, b) =>
    a.playerName.localeCompare(b.playerName, "id-ID"),
  );
}

export async function upsertReportArchiveDraftAction(input: {
  playerId: string;
  periodId: string;
  fileUrl: string;
}) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  const archive = await prisma.$transaction(async (tx) => {
    const player = await tx.player.findFirst({
      where: { id: input.playerId, isDeleted: false },
      select: {
        id: true,
        name: true,
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

    if (!player) {
      throw new Error("Pemain tidak ditemukan atau sudah tidak aktif.");
    }

    if (!player.group) {
      throw new Error("Pemain belum memiliki kelompok latihan aktif.");
    }

    const period = await tx.evaluationPeriod.findUnique({
      where: { id: input.periodId },
      select: { id: true, name: true },
    });

    if (!period) {
      throw new Error("Periode evaluasi tidak ditemukan.");
    }

    const signerContext = await getReportSignerResolverContext(tx);
    const archiveSnapshot = buildReportArchiveSnapshot({
      group: player.group,
      signer: resolveReportSignerSnapshotForGroup(player.group, signerContext),
    });

    const existingArchive = await tx.reportArchive.findUnique({
      where: {
        playerId_periodId: {
          playerId: input.playerId,
          periodId: input.periodId,
        },
      },
      select: {
        id: true,
        groupId: true,
        groupNameSnapshot: true,
        homebaseIdSnapshot: true,
        homebaseNameSnapshot: true,
        coachProfileIdSnapshot: true,
        coachNameSnapshot: true,
        coachSignUrlSnapshot: true,
      },
    });

    const frozenArchiveSnapshot = freezeHistoricalSnapshot(
      existingArchive
        ? {
            groupId: existingArchive.groupId,
            groupNameSnapshot: existingArchive.groupNameSnapshot,
            homebaseIdSnapshot: existingArchive.homebaseIdSnapshot,
            homebaseNameSnapshot: existingArchive.homebaseNameSnapshot,
            coachProfileIdSnapshot: existingArchive.coachProfileIdSnapshot,
            coachNameSnapshot: existingArchive.coachNameSnapshot,
            coachSignUrlSnapshot: existingArchive.coachSignUrlSnapshot,
          }
        : null,
      archiveSnapshot,
    );

    const result = await tx.reportArchive.upsert({
      where: {
        playerId_periodId: {
          playerId: input.playerId,
          periodId: input.periodId,
        },
      },
      create: {
        playerId: input.playerId,
        periodId: input.periodId,
        ...frozenArchiveSnapshot,
        fileUrl: input.fileUrl.trim(),
        status: "DRAFT",
        releasedAt: null,
        uploadedById: userId,
      },
      update: {
        ...frozenArchiveSnapshot,
        fileUrl: input.fileUrl.trim(),
        status: "DRAFT",
        releasedAt: null,
        uploadedById: userId,
      },
      select: {
        id: true,
        playerId: true,
        periodId: true,
        status: true,
      },
    });

    await createAuditLog(tx, "UPSERT", "reportArchive", result.id, userId, {
      playerName: player.name,
      periodName: period.name,
      status: result.status,
    });

    return result;
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/parent");

  return archive;
}

export async function releaseReportArchiveAction(reportArchiveId: string) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  const archive = await prisma.$transaction(async (tx) => {
    const existing = await tx.reportArchive.findUnique({
      where: { id: reportArchiveId },
      select: {
        id: true,
        fileUrl: true,
        player: { select: { name: true } },
        period: { select: { name: true } },
      },
    });

    if (!existing) {
      throw new Error("Arsip rapor tidak ditemukan.");
    }

    if (!existing.fileUrl.trim()) {
      throw new Error("File rapor belum tersedia untuk dirilis.");
    }

    const result = await tx.reportArchive.update({
      where: { id: reportArchiveId },
      data: {
        status: "RELEASED",
        releasedAt: new Date(),
        uploadedById: userId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    await createAuditLog(tx, "RELEASE", "reportArchive", result.id, userId, {
      playerName: existing.player.name,
      periodName: existing.period.name,
    });

    return result;
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/parent");

  return archive;
}

export async function getReleasedReportArchivesForPlayerAction(playerId: string) {
  const session = await requireActiveUser();

  if (session.user.role === "PARENT") {
    await prisma.$transaction(async (tx) => {
      await ensureOwnedPlayer(tx, playerId, session.user.id!);
    });
  } else if (session.user.role !== "ADMIN") {
    throw new Error("Role ini tidak diizinkan mengakses arsip rapor.");
  }

  return prisma.reportArchive.findMany({
    where: {
      playerId,
      status: "RELEASED",
    },
    select: {
      id: true,
      fileUrl: true,
      releasedAt: true,
      coachNameSnapshot: true,
      coachSignUrlSnapshot: true,
      groupNameSnapshot: true,
      homebaseNameSnapshot: true,
      period: {
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
        },
      },
    },
    orderBy: [{ period: { startDate: "desc" } }],
  });
}
