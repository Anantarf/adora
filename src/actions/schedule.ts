"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-auth";
import { revalidatePath } from "next/cache";

export async function getEventsAction() {
  await requireAdmin();
  
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: "asc" },
      include: {
        group: { select: { name: true } }
      }
    });
    return events;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw new Error("Gagal mengambil jadwal kegiatan");
  }
}

export async function createEventAction(data: {
  title: string;
  description?: string;
  date: string;
  type: string;
  groupId?: string;
}) {
  await requireAdmin();
  
  try {
    await prisma.event.create({
      data: {
        title: data.title,
        description: data.description || null,
        date: new Date(data.date),
        type: data.type,
        groupId: data.groupId || null,
      }
    });
    
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/schedule");
    return { success: true };
  } catch (error) {
    console.error("Error creating event:", error);
    throw new Error("Gagal membuat agenda baru");
  }
}

export async function deleteEventAction(id: string) {
  await requireAdmin();
  
  try {
    await prisma.event.delete({ where: { id } });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/schedule");
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    throw new Error("Gagal menghapus jadwal");
  }
}
