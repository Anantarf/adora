"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function getFamilyPlayersAction() {
  const session = await getServerSession(authOptions);
  
  const userId = (session?.user as any)?.id;
  
  if (!userId) {
    throw new Error("Sesi tidak valid");
  }

  return await prisma.player.findMany({
    where: {
      parentId: userId,
      isDeleted: false,
    },
    include: {
      group: {
        select: { id: true, name: true }
      }
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
    orderBy: { name: "asc" }
  });
}
