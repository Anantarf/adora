"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireAuth } from "@/lib/server-auth";
import { toJakartaDate } from "@/lib/date-utils";
import crypto from "crypto";
import { AttendanceStatus } from "@/types/dashboard";
import { createAuditLog } from "./audit";

// 1. Submit Attendance
export async function submitAttendanceAction(data: {
  date: string;
  playerStatuses: { playerId: string; status: AttendanceStatus }[];
  note?: string;
}) {
  await requireAdmin();

  // Validate input
  if (!data.playerStatuses || data.playerStatuses.length === 0) {
    throw new Error("Minimal ada 1 pemain untuk didaftarkan kehadirannya.");
  }

  const dateObj = toJakartaDate(data.date);

  await prisma.$transaction(async (tx) => {
    // Validate all players exist and are not deleted
    const playerIds = data.playerStatuses.map(ps => ps.playerId);
    const existingPlayers = await tx.player.findMany({
      where: { id: { in: playerIds }, isDeleted: false },
      select: { id: true }
    });

    const existingPlayerIds = new Set(existingPlayers.map(p => p.id));
    const invalidPlayers = playerIds.filter(id => !existingPlayerIds.has(id));

    if (invalidPlayers.length > 0) {
      throw new Error(`Pemain tidak ditemukan atau sudah dihapus: ${invalidPlayers.join(", ")}`);
    }

    // Bulking operation (Create or Update) — fail fast on any error
    const upsertResults = await Promise.allSettled(
      data.playerStatuses.map(ps =>
        tx.attendance.upsert({
          where: {
            playerId_date: {
              playerId: ps.playerId,
              date: dateObj,
            },
          },
          update: { status: ps.status, note: data.note },
          create: {
            id: crypto.randomUUID(),
            playerId: ps.playerId,
            date: dateObj,
            status: ps.status,
            note: data.note,
          },
        })
      )
    );

    const failed = upsertResults.filter(r => r.status === "rejected");
    if (failed.length > 0) {
      throw new Error(`Gagal mencatat kehadiran untuk ${failed.length} pemain`);
    }

    await createAuditLog(tx, "SUBMIT_ATTENDANCE", "attendance_batch", `Date: ${data.date}, Count: ${data.playerStatuses.length}`);
  });

  revalidatePath("/dashboard/attendances");
}

// 2. Submit Statistics (Raport)
export async function submitStatisticAction(data: {
  playerId: string;
  date: string;
  metrics: Record<string, number | string>;
  status: "Draft" | "Published";
}) {
  await requireAdmin();
  const targetDate = toJakartaDate(data.date);

  const stat = await prisma.$transaction(async (tx) => {
    const res = await tx.statistic.upsert({
      where: {
        playerId_date: {
          playerId: data.playerId,
          date: targetDate,
        },
      },
      update: {
        metricsJson: JSON.stringify(data.metrics),
        status: data.status,
      },
      create: {
        id: crypto.randomUUID(),
        playerId: data.playerId,
        date: targetDate,
        metricsJson: JSON.stringify(data.metrics),
        status: data.status,
        updatedAt: new Date(),
      },
    });

    await createAuditLog(tx, "SUBMIT_STATS", "statistic", res.id);
    return res;
  });

  revalidatePath("/dashboard/statistics");
  return stat;
}

// 3. Get Player Stats
export async function getPlayerStatsAction(playerId: string) {
  const session = await requireAuth();
  const { role: userRole, id: userId } = session.user;

  // Jika parent, pastikan dia hanya bisa menarik data anaknya sendiri
  if (userRole === "PARENT") {
    const parentOwnsChild = await prisma.player.findFirst({
      where: { id: playerId, parentId: userId, isDeleted: false }
    });
    if (!parentOwnsChild) {
      throw new Error("Akses Terlarang: Anda tidak diizinkan melihat evaluasi anak dari keluarga lain.");
    }
  }

  const stats = await prisma.statistic.findMany({
    where: { playerId, player: { isDeleted: false } },
    orderBy: { date: "desc" },
  });

  // Type-safe transform: Parse metricsJson with fallback
  return stats.map(s => {
    try {
      return { ...s, metricsJson: JSON.parse(s.metricsJson as string) };
    } catch {
      return { ...s, metricsJson: {} };
    }
  });
}
