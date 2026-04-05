"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server-auth";
import { toJakartaDate } from "@/lib/date-utils";

import { createAuditLog } from "./audit";

// 1. Submit Attendance
export async function submitAttendanceAction(data: {
  date: string;
  playerStatuses: { playerId: string; status: "HADIR" | "IZIN" | "SAKIT" | "ALPA" }[];
  note?: string;
}) {
  await requireAdmin();
  const dateObj = toJakartaDate(data.date);
  
  await prisma.$transaction(async (tx) => {
    // Bulking operation (Create or Update)
    for (const ps of data.playerStatuses) {
      await tx.attendance.upsert({
        where: {
          playerId_date: {
            playerId: ps.playerId,
            date: dateObj,
          },
        },
        update: { status: ps.status, note: data.note },
        create: {
          playerId: ps.playerId,
          date: dateObj,
          status: ps.status,
          note: data.note,
        },
      });
    }

    await createAuditLog(tx, "SUBMIT_ATTENDANCE", "attendance_batch", `Date: ${data.date}, Count: ${data.playerStatuses.length}`);
  });

  revalidatePath("/dashboard/attendances");
}

// 2. Submit Statistics (Raport)
export async function submitStatisticAction(data: {
  playerId: string;
  date: string;
  metrics: any;
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
        playerId: data.playerId,
        date: targetDate,
        metricsJson: JSON.stringify(data.metrics),
        status: data.status,
      },
    });

    await createAuditLog(tx, "SUBMIT_STATS", "statistic", res.id);
    return res;
  });

  revalidatePath("/dashboard/statistics");
  return stat;
}


import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// 3. Get Player Stats
export async function getPlayerStatsAction(playerId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  
  const userRole = (session.user as any).role;
  const userId = (session.user as any).id;

  // Jika parent, pastikan dia hanya bisa menarik data anaknya sendiri (Mencegah IDOR / Horizontal Escalation)
  if (userRole === "PARENT") {
    const parentOwnsChild = await prisma.player.findFirst({
      where: { id: playerId, parentId: userId }
    });
    if (!parentOwnsChild) {
      throw new Error("Akses Terlarang: Anda tidak diizinkan melihat evaluasi anak dari keluarga lain.");
    }
  }

  return await prisma.statistic.findMany({
    where: { playerId },
    orderBy: { date: "desc" },
  });
}
