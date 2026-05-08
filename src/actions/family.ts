"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/server-auth";

export async function getFamilyPlayersAction() {
  const session = await requireAuth();
  const userId = session.user.id;
  if (!userId) throw new Error("ID pengguna tidak ditemukan di sesi.");

  return await prisma.player.findMany({
    where: {
      parentId: userId,
      isDeleted: false,
    },
    include: {
      group: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
export async function getPlayerAttendanceAction(playerId: string) {
  const session = await requireAuth();
  const userId = session.user.id;
  if (!userId) throw new Error("ID pengguna tidak ditemukan di sesi.");

  // Verifikasi pemain ini memang milik orang tua yang login
  const player = await prisma.player.findFirst({
    where: { id: playerId, parentId: userId, isDeleted: false },
    select: { id: true },
  });
  if (!player) throw new Error("Pemain tidak ditemukan atau bukan milik akun ini.");

  return await prisma.attendance.findMany({
    where: { playerId },
    include: {
      event: { select: { title: true, type: true } },
    },
    orderBy: { date: "desc" },
    take: 50,
  });
}

export async function getParentsAction() {
  await requireAdmin();
  return await prisma.user.findMany({
    where: { role: "PARENT", isDeleted: false },
    select: { id: true, name: true, username: true },
    orderBy: { name: "asc" },
  });
}
