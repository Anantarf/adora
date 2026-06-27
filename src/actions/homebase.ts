"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { recordOperationalError } from "@/lib/observability";
import { getHomebaseById, updateGroupHomebase, createHomebaseEvent } from "@/lib/homebase";
import { prisma } from "@/lib/prisma";
import { HOMEBASE_CACHE_TTL } from "@/lib/constants";
import { requireAdmin } from "@/lib/server-auth";
import type { event_type } from "@prisma/client";

export const getPublicHomebases = unstable_cache(
  () => prisma.homebase.findMany({ orderBy: { name: "asc" } }).catch(async (err) => {
    recordOperationalError({ source: "get-public-homebases", message: "Failed to fetch homebases", error: err }).catch(() => {
      console.error("[getPublicHomebases] Failed to record operational error");
    });
    return [];
  }),
  ["public-homebases"],
  { revalidate: HOMEBASE_CACHE_TTL, tags: ["public-homebases"] },
);

export async function getPublicHomebaseById(id: string) {
  try {
    return await getHomebaseById(id);
  } catch (error) {
    await recordOperationalError({ source: "get-public-homebase-by-id", message: "Failed to fetch homebase", error });
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
    await recordOperationalError({ source: "update-group-homebase", message: "Failed to update group homebase", error });
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
    await recordOperationalError({ source: "create-event-with-homebase", message: "Failed to create homebase event", error });
    throw new Error("Gagal membuat agenda dari homebase.");
  }
}
