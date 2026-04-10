"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server-auth";
import { createAuditLog } from "./audit";
import crypto from "crypto";

// ─── Helper: Build group update data ────────────────────────────────────────
const buildGroupUpdateData = (data: { name?: string; description?: string | undefined }) =>
  Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );

export async function getGroupsAction() {
  await requireAdmin();
  try {
    return await prisma.group.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            player: { where: { isDeleted: false } }
          }
        }
      }
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
    throw new Error("Gagal mengambil daftar grup");
  }
}

export async function addGroupAction(data: { name: string; description?: string }) {
  await requireAdmin();
  try {
    const group = await prisma.$transaction(async (tx) => {
      const g = await tx.group.create({
        data: {
          id: crypto.randomUUID(),
          name: data.name,
          description: data.description || null,
        },
      });

      await createAuditLog(tx, "CREATE", "group", g.id);
      return g;
    });

    revalidatePath("/dashboard/players");
    return { success: true, data: group };
  } catch (error) {
    console.error("Error adding group:", error);
    throw new Error("Gagal menambahkan grup baru");
  }
}

export async function updateGroupAction(id: string, data: { name?: string; description?: string }) {
  await requireAdmin();
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const g = await tx.group.update({
        where: { id },
        data: buildGroupUpdateData(data),
      });

      await createAuditLog(tx, "UPDATE", "group", g.id);
      return g;
    });

    revalidatePath("/dashboard/players");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating group:", error);
    throw new Error("Gagal mengubah grup");
  }
}

export async function deleteGroupAction(id: string) {
  await requireAdmin();
  try {
    await prisma.$transaction(async (tx) => {
      await tx.group.delete({ where: { id } });
      await createAuditLog(tx, "DELETE", "group", id);
    });

    revalidatePath("/dashboard/players");
    return { success: true };
  } catch (error) {
    console.error("Error deleting group:", error);
    throw new Error("Gagal menghapus grup (mungkin masih ada atlet di dalamnya)");
  }
}
