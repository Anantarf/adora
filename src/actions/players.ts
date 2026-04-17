"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server-auth";
import { toJakartaDate } from "@/lib/date-utils";
import { createAuditLog } from "./audit";
// 1. Ambil semua pemain (Read)
export async function getPlayersAction(groupId?: string, searchQuery?: string) {
  await requireAdmin();
  return await prisma.player.findMany({
    where: {
      isDeleted: false,
      ...(groupId && groupId !== "all" ? { groupId } : {}),
      ...(searchQuery
        ? {
            OR: [{ name: { contains: searchQuery } }, { schoolOrigin: { contains: searchQuery } }],
          }
        : {}),
    },
    include: {
      group: {
        select: { id: true, name: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

// 2. Tambah pemain baru (Create)
export async function addPlayerAction(data: { name: string; dateOfBirth: string; schoolOrigin?: string; groupId: string; parentId?: string }) {
  await requireAdmin();
  const player = await prisma.$transaction(async (tx) => {
    const p = await tx.player.create({
      data: {
        name: data.name,
        dateOfBirth: toJakartaDate(data.dateOfBirth),
        schoolOrigin: data.schoolOrigin || undefined,
        groupId: data.groupId,
        parentId: data.parentId || undefined,
        updatedAt: new Date(),
      },
    });

    await createAuditLog(tx, "CREATE", "player", p.id);
    return p;
  });

  revalidatePath("/dashboard/players");
  return player;
}

// 2.5 Tambah massal pemain (Batch Create)
export async function addBatchPlayersAction(
  playersData: Array<{
    name: string;
    dateOfBirth: string;
    schoolOrigin?: string;
    groupId: string;
    parentId?: string;
  }>,
) {
  await requireAdmin();

  const formattedData = playersData.map((data) => ({
    name: data.name,
    dateOfBirth: toJakartaDate(data.dateOfBirth),
    schoolOrigin: data.schoolOrigin || undefined,
    groupId: data.groupId,
    parentId: data.parentId || undefined,
    updatedAt: new Date(),
  }));

  const result = await prisma.$transaction(async (tx) => {
    const res = await tx.player.createMany({
      data: formattedData,
      skipDuplicates: true,
    });

    // Create audit logs for all players atomically
    await createAuditLog(tx, "CREATE", "player_batch", String(res.count));
    return res;
  });

  revalidatePath("/dashboard/players");
  return result;
}

// 3. Update pemain (Update)
export async function updatePlayerAction(
  id: string,
  data: {
    name?: string;
    dateOfBirth?: string;
    schoolOrigin?: string;
    groupId?: string;
  },
) {
  await requireAdmin();

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.player.update({
      where: { id },
      data: {
        name: data.name,
        dateOfBirth: data.dateOfBirth ? toJakartaDate(data.dateOfBirth) : undefined,
        schoolOrigin: data.schoolOrigin,
        groupId: data.groupId,
        updatedAt: new Date(),
      },
    });

    await createAuditLog(tx, "UPDATE", "player", res.id);
    return res;
  });

  revalidatePath("/dashboard/players");
  return updated;
}

// 4. Hapus pemain (Soft Delete)
export async function deletePlayerAction(id: string) {
  await requireAdmin();
  await prisma.$transaction(async (tx) => {
    await tx.player.update({
      where: { id },
      data: { isDeleted: true },
    });

    await createAuditLog(tx, "DELETE", "player", id);
  });

  revalidatePath("/dashboard/players");
}
