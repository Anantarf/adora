"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server-auth";
import { createAuditLog } from "./audit";
import { buildUpdateData } from "@/lib/utils";
import { parseGroupMetaDescription, normalizeGroupMeta, type GroupCategory } from "@/lib/group-meta";
export async function getGroupsAction() {
  try {
    await requireAdmin();
    const groups = await prisma.group.findMany({
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

    return groups.map((group) => {
      const legacyMeta = parseGroupMetaDescription(group.description);
      return {
        ...group,
        category: group.category ?? legacyMeta.category ?? "KELOMPOK_UMUR",
        targetKu: group.targetKu ?? legacyMeta.targetKu ?? null,
        schoolLevel: group.schoolLevel ?? legacyMeta.schoolLevel ?? null,
      };
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
    throw new Error("Gagal mengambil daftar grup");
  }
}

export async function addGroupAction(data: {
  name: string;
  category: GroupCategory;
  targetKu?: number | null;
  schoolLevel?: string | null;
  homebaseId?: string | null;
}) {
  try {
    const session = await requireAdmin();
    const normalizedMeta = normalizeGroupMeta({
      category: data.category,
      targetKu: data.targetKu ?? undefined,
      schoolLevel: data.schoolLevel ?? undefined,
    });
    const group = await prisma.$transaction(async (tx) => {
      const g = await tx.group.create({
        data: {
          name: data.name,
          category: normalizedMeta.category,
          targetKu: normalizedMeta.targetKu ?? null,
          schoolLevel: normalizedMeta.schoolLevel ?? null,
          description: null,
          homebaseId: data.homebaseId || null,
        },
      });

      await createAuditLog(tx, "CREATE", "Group", g.id, session.user.id, {
        name: g.name,
        category: g.category,
        homebaseId: g.homebaseId,
      });
      return g;
    });

    revalidatePath("/dashboard/players");
    return group;
  } catch (error: unknown) {
    console.error("Error adding group:", error);
    throw new Error((error instanceof Error ? error.message : null) || "Gagal menambahkan grup baru");
  }
}

export async function updateGroupAction(id: string, data: {
  name?: string;
  category?: GroupCategory;
  targetKu?: number | null;
  schoolLevel?: string | null;
  homebaseId?: string | null;
}) {
  try {
    const session = await requireAdmin();
    const normalizedMeta = normalizeGroupMeta({
      category: data.category,
      targetKu: data.targetKu ?? undefined,
      schoolLevel: data.schoolLevel ?? undefined,
    });
    const updated = await prisma.$transaction(async (tx) => {
      const g = await tx.group.update({
        where: { id },
        data: buildUpdateData({
          name: data.name,
          category: normalizedMeta.category,
          targetKu: normalizedMeta.targetKu ?? null,
          schoolLevel: normalizedMeta.schoolLevel ?? null,
          description: null,
          homebaseId: data.homebaseId,
        }),
      });

      await createAuditLog(tx, "UPDATE", "Group", g.id, session.user.id, {
        name: g.name,
        category: g.category,
        targetKu: g.targetKu,
        schoolLevel: g.schoolLevel,
        homebaseId: g.homebaseId,
      });
      return g;
    });

    revalidatePath("/dashboard/players");
    return updated;
  } catch (error: unknown) {
    console.error("Error updating group:", error);
    throw new Error((error instanceof Error ? error.message : null) || "Gagal mengubah grup");
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
  } catch (error: unknown) {
    console.error("Error deleting group:", error);
    throw new Error((error instanceof Error ? error.message : null) || "Gagal menghapus grup");
  }
}
