"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server-auth";
import { createAuditLog } from "./audit";
import { buildUpdateData } from "@/lib/utils";
export async function getGroupsAction() {
  try {
    await requireAdmin();
    return await prisma.group.findMany({
      orderBy: { name: "asc" },
      include: {
        homebase: { select: { id: true, name: true } },
        _count: {
          select: {
            player: { where: { isDeleted: false } },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
    throw new Error("Gagal mengambil daftar grup");
  }
}

export async function addGroupAction(data: { name: string; description?: string; homebaseId?: string | null }) {
  try {
    await requireAdmin();
    const group = await prisma.$transaction(async (tx) => {
      const g = await tx.group.create({
        data: {
          name: data.name,
          description: data.description || null,
          homebaseId: data.homebaseId || null,
        },
      });

      await createAuditLog(tx, "CREATE", "group", g.id);
      return g;
    });

    revalidatePath("/dashboard/players");
    return group;
  } catch (error) {
    console.error("Error adding group:", error);
    throw new Error("Gagal menambahkan grup baru");
  }
}

export async function updateGroupAction(id: string, data: { name?: string; description?: string; homebaseId?: string | null }) {
  try {
    await requireAdmin();
    const updated = await prisma.$transaction(async (tx) => {
      const g = await tx.group.update({
        where: { id },
        data: buildUpdateData(data),
      });

      await createAuditLog(tx, "UPDATE", "group", g.id);
      return g;
    });

    revalidatePath("/dashboard/players");
    return updated;
  } catch (error) {
    console.error("Error updating group:", error);
    throw new Error("Gagal mengubah grup");
  }
}

export async function deleteGroupAction(id: string) {
  try {
    await requireAdmin();
    await prisma.$transaction(async (tx) => {
      // 1. Lepaskan semua pemain yang terikat ke kelompok ini
      await tx.player.updateMany({
        where: { groupId: id },
        data: { groupId: null },
      });

      // 2. Hapus kelompok
      await tx.group.delete({ where: { id } });
      await createAuditLog(tx, "DELETE", "group", id);
    });

    revalidatePath("/dashboard/players");
    return { success: true as const };
  } catch (error) {
    console.error("Error deleting group:", error);
    throw new Error("Gagal menghapus grup");
  }
}
