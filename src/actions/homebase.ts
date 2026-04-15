"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  getHomebases,
  getHomebaseById,
  getGroupsByHomebase,
  updateGroupHomebase,
  createHomebaseEvent,
} from "@/lib/homebase.service";

export async function getPublicHomebases() {
  try {
    return await getHomebases();
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

export async function updateGroupToHomebase(
  groupId: string,
  homebaseId: string
) {
  try {
    const result = await updateGroupHomebase(groupId, homebaseId);
    revalidatePath("/dashboard/groups");
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update group homebase:", error);
    return { success: false, error: "Failed to update group homebase" };
  }
}

export async function createEventWithHomebase(
  title: string,
  date: Date,
  homebaseId: string,
  groupId?: string,
  type?: string,
  description?: string
) {
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
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create event:", error);
    return { success: false, error: "Failed to create event" };
  }
}
