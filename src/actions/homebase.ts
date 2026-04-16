"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getHomebases, getHomebaseById, updateGroupHomebase, createHomebaseEvent } from "@/lib/homebase.service";

const getCachedPublicHomebases = unstable_cache(async () => getHomebases(), ["public-homebases"], { revalidate: 300, tags: ["public-homebases"] });

export async function getPublicHomebases() {
  try {
    return await getCachedPublicHomebases();
  } catch (error) {
    console.error("Failed to fetch homebases:", error);
    return [];
  }
}

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
    const result = await updateGroupHomebase(groupId, homebaseId);
    revalidatePath("/dashboard/groups");
    revalidateTag("public-homebases", "max");
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update group homebase:", error);
    return { success: false, error: "Failed to update group homebase" };
  }
}

export async function createEventWithHomebase(title: string, date: Date, homebaseId: string, groupId?: string, type?: string, description?: string) {
  try {
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
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create event:", error);
    return { success: false, error: "Failed to create event" };
  }
}
