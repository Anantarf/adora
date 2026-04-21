"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";

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
  const { requireAdmin } = await import("@/lib/server-auth");
  await requireAdmin();
  return await prisma.user.findMany({
    where: { role: "PARENT" },
    select: { id: true, name: true, username: true },
    orderBy: { name: "asc" },
  });
}
