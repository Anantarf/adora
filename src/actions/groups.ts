"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server-auth";
import crypto from "crypto";

export async function getGroupsAction() {
  await requireAdmin();
  try {
    return await prisma.group.findMany({
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
    throw new Error("Gagal mengambil daftar grup");
  }
}

export async function addGroupAction(data: { name: string; description?: string }) {
  await requireAdmin();
  try {
    const group = await prisma.group.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        description: data.description || null,
      },
    });

    revalidatePath("/dashboard/groups");
    return { success: true, data: group };
  } catch (error) {
    console.error("Error adding group:", error);
    throw new Error("Gagal menambahkan grup baru");
  }
}
