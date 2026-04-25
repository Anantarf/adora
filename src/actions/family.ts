"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/server-auth";

export async function getFamilyPlayersAction() {
  const session = await requireAuth();
  const userId = session.user.id!

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
export async function getParentsAction() {
  await requireAdmin();
  return await prisma.user.findMany({
    where: { role: "PARENT", isDeleted: false },
    select: { id: true, name: true, username: true },
    orderBy: { name: "asc" },
  });
}
