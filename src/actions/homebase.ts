"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getHomebaseById, updateGroupHomebase, createHomebaseEvent } from "@/lib/homebase.service";
import { prisma } from "@/lib/prisma";
import { HOMEBASE_CACHE_TTL } from "@/lib/constants";
import { requireAdmin } from "@/lib/server-auth";
import type { event_type } from "@prisma/client";

export const getPublicHomebases = unstable_cache(
  () => prisma.homebase.findMany({ orderBy: { name: "asc" } }).catch((err) => {
    console.error("Failed to fetch homebases:", err);
    return [];
  }),
  ["public-homebases"],
  { revalidate: HOMEBASE_CACHE_TTL, tags: ["public-homebases"] },
);

export async function getPublicHomebaseById(id: string) {
  try {
    return await getHomebaseById(id);
  } catch (error) {
    console.error("Failed to fetch homebase:", error);
    return null;
  }
}

export async function updateGroupToHomebase(groupId: string, homebaseId: string) {
  try {
    await requireAdmin();
    const result = await updateGroupHomebase(groupId, homebaseId);
    revalidatePath("/dashboard/groups");
    revalidateTag("public-homebases", "max");
    return result;
  } catch (error) {
    console.error("Failed to update group homebase:", error);
    throw new Error("Gagal memperbarui homebase kelompok.");
  }
}

export async function createEventWithHomebase(title: string, date: Date, homebaseId: string, groupId?: string, type?: event_type, description?: string) {
  try {
    await requireAdmin();
    const result = await createHomebaseEvent({
      title,
      date,
      homebaseId,
      groupId,
      type,
      description,
    });
    revalidatePath("/dashboard/schedule");
    revalidateTag("public-homebases", "max");
    return result;
  } catch (error) {
    console.error("Failed to create event:", error);
    throw new Error("Gagal membuat agenda dari homebase.");
  }
}
