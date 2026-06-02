"use server";

import { ensureOwnedPlayer } from "@/lib/domain-guards";
import { prisma } from "@/lib/prisma";
import { requireSessionRole } from "@/lib/server-auth";

async function requireSessionUserId(role: "PARENT" | "ADMIN") {
  const session = await requireSessionRole(role);
  const userId = session.user.id;

  if (!userId) {
    throw new Error("ID pengguna tidak ditemukan di sesi.");
  }

  return userId;
}

export async function getFamilyPlayersAction() {
  const userId = await requireSessionUserId("PARENT");

  return prisma.player.findMany({
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
  const userId = await requireSessionUserId("PARENT");

  await prisma.$transaction(async (tx) => {
    await ensureOwnedPlayer(tx, playerId, userId);
  });

  return prisma.attendance.findMany({
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

  return prisma.user.findMany({
    where: { role: "PARENT", isDeleted: false },
    select: { id: true, name: true, username: true },
    orderBy: { name: "asc" },
  });
}
