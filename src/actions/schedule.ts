"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { ScheduleEvent } from "@/types/dashboard";
import { getJakartaToday, toJakartaDate } from "@/lib/date-utils";
import { createAuditLog } from "./audit";

export async function getEventsAction(): Promise<ScheduleEvent[]> {
  await requireAdmin();

  try {
    const events = await prisma.event.findMany({
      orderBy: { date: "asc" },
      include: {
        group: { select: { name: true } },
      },
    });
    return events as ScheduleEvent[];
  } catch (error) {
    console.error("Error fetching events:", error);
    throw new Error("Gagal mengambil jadwal kegiatan");
  }
}

export async function getPublicEventsAction(): Promise<Partial<ScheduleEvent>[]> {
  try {
    const todayWib = getJakartaToday();

    const events = await prisma.event.findMany({
      where: {
        date: { gte: todayWib },
      },
      orderBy: { date: "asc" },
      take: 6,
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        type: true,
        location: true,
      },
    });

    return events as Partial<ScheduleEvent>[];
  } catch (error) {
    console.error("Error fetching public events:", error);
    return [];
  }
}

export async function createEventAction(data: { title: string; description?: string; date: string; type: string; location?: string; groupId?: string; homebaseId?: string }) {
  await requireAdmin();

  try {
    await prisma.$transaction(async (tx) => {
      const ev = await tx.event.create({
        data: {
          id: crypto.randomUUID(),
          title: data.title,
          description: data.description || null,
          date: toJakartaDate(data.date),
          type: data.type,
          location: data.location || null,
          groupId: data.groupId || null,
          homebaseId: data.homebaseId || null,
          updatedAt: new Date(),
        },
      });
      await createAuditLog(tx, "CREATE", "event", ev.id);
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/schedule");
    return { success: true };
  } catch (error) {
    console.error("Error creating event:", error);
    throw new Error("Gagal membuat agenda baru");
  }
}

export async function updateEventAction(id: string, data: { title: string; description?: string; date: string; type: string; location?: string; groupId?: string; homebaseId?: string }) {
  await requireAdmin();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description || null,
          date: toJakartaDate(data.date),
          type: data.type,
          location: data.location || null,
          groupId: data.groupId || null,
          homebaseId: data.homebaseId || null,
          updatedAt: new Date(),
        },
      });
      await createAuditLog(tx, "UPDATE", "event", id);
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/schedule");
    return { success: true };
  } catch (error) {
    console.error("Error updating event:", error);
    throw new Error("Gagal mengubah jadwal");
  }
}

export async function deleteEventAction(id: string) {
  await requireAdmin();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.event.delete({ where: { id } });
      await createAuditLog(tx, "DELETE", "event", id);
    });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/schedule");
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    throw new Error("Gagal menghapus jadwal");
  }
}
