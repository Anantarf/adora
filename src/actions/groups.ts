"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server-auth";

export async function getGroupsAction() {
  await requireAdmin();
  return await prisma.group.findMany({
    orderBy: { name: "asc" },
  });
}

export async function addGroupAction(data: { name: string; description?: string }) {
  await requireAdmin();
  const group = await prisma.group.create({
    data: {
      name: data.name,
      description: data.description,
    },
  });

  revalidatePath("/dashboard/groups");
  return group;
}
