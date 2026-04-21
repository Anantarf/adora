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
    const session = await requireAdmin();
    const group = await prisma.$transaction(async (tx) => {
      const g = await tx.group.create({
        data: {
          name: data.name,
          description: data.description || null,
          homebaseId: data.homebaseId || null,
        },
      });

      await createAuditLog(tx, "CREATE", "Group", g.id, session.user.id, {
        name: g.name,
        homebaseId: g.homebaseId,
      });
      return g;
    });

    revalidatePath("/dashboard/players");
    return group;
  } catch (error: any) {
    console.error("Error adding group:", error);
    throw new Error(error.message || "Gagal menambahkan grup baru");
  }
}

export async function updateGroupAction(id: string, data: { name?: string; description?: string; homebaseId?: string | null }) {
  try {
    const session = await requireAdmin();
    const updated = await prisma.$transaction(async (tx) => {
      const g = await tx.group.update({
        where: { id },
        data: buildUpdateData(data),
      });

      await createAuditLog(tx, "UPDATE", "Group", g.id, session.user.id, {
        name: g.name,
        description: g.description,
        homebaseId: g.homebaseId,
      });
      return g;
    });

    revalidatePath("/dashboard/players");
    return updated;
  } catch (error: any) {
    console.error("Error updating group:", error);
    throw new Error(error.message || "Gagal mengubah grup");
  }
}

export async function deleteGroupAction(id: string) {
  try {
    const session = await requireAdmin();
    await prisma.$transaction(async (tx) => {
      // 1. Lepaskan semua pemain yang terikat ke kelompok ini
      await tx.player.updateMany({
        where: { groupId: id },
        data: { groupId: null },
      });

      const target = await tx.group.findUnique({ where: { id }, select: { name: true } }).catch(() => null);
      // 2. Hapus kelompok
      await tx.group.delete({ where: { id } });
      await createAuditLog(tx, "DELETE", "Group", id, session.user.id, {
        name: target?.name,
      });
    });

    revalidatePath("/dashboard/players");
    return { success: true as const };
  } catch (error: any) {
    console.error("Error deleting group:", error);
    throw new Error(error.message || "Gagal menghapus grup");
  }
}
