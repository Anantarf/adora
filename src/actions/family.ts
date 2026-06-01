"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSessionRole } from "@/lib/server-auth";
import { ensureOwnedPlayer } from "@/lib/domain-guards";

export async function getFamilyPlayersAction() {
  const session = await requireSessionRole("PARENT");
  const userId = session.user.id;
  if (!userId) throw new Error("ID pengguna tidak ditemukan di sesi.");

  return await prisma.player.findMany({
    where: {
      parentId: userId,
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      dateOfBirth: true,
      schoolOrigin: true,
      group: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
export async function getPlayerAttendanceAction(playerId: string) {
  const session = await requireSessionRole("PARENT");
  const userId = session.user.id;
  if (!userId) throw new Error("ID pengguna tidak ditemukan di sesi.");

  await prisma.$transaction(async (tx) => {
    await ensureOwnedPlayer(tx, playerId, userId);
  });

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
  await requireSessionRole("ADMIN");
  return await prisma.user.findMany({
    where: { role: "PARENT", isDeleted: false },
    select: { id: true, name: true, username: true },
    orderBy: { name: "asc" },
  });
}
