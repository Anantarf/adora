"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-auth";
import { revalidatePath } from "next/cache";
import { ScheduleEvent } from "@/types/dashboard";
import { getJakartaToday, toJakartaDate } from "@/lib/date-utils";
import { createAuditLog } from "./audit";

function parseEventDate(input: string): Date {
  // Preserve explicit time payloads; fallback to Jakarta midnight for date-only strings.
  return input.includes("T") ? new Date(input) : toJakartaDate(input);
}

export async function getEventsAction() {
  try {
    await requireAdmin();
    const events = await prisma.event.findMany({
      orderBy: { date: "asc" },
      include: {
        eventGroups: {
          include: { group: { select: { id: true, name: true } } },
        },
      },
    });
    return events.map((e) => ({
      ...e,
      groups: e.eventGroups.map((eg) => eg.group),
    })) as ScheduleEvent[];
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

export async function createEventAction(data: { title: string; description?: string; date: string; type: string; location?: string; groupIds?: string[]; homebaseId?: string }) {
  try {
    await requireAdmin();
    await prisma.$transaction(async (tx) => {
      const ev = await tx.event.create({
        data: {
          title: data.title,
          description: data.description || null,
          date: parseEventDate(data.date),
          type: data.type,
          location: data.location || null,
          homebaseId: data.homebaseId || null,
          updatedAt: new Date(),
        },
      });

      if (data.groupIds && data.groupIds.length > 0) {
        await tx.eventGroup.createMany({
          data: data.groupIds.map((groupId) => ({
            eventId: ev.id,
            groupId,
          })),
        });
      }

      await createAuditLog(tx, "CREATE", "event", ev.id);
    });

    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error) {
    console.error("Error creating event:", error);
    throw new Error("Gagal membuat agenda baru");
  }
}

export async function updateEventAction(id: string, data: { title: string; description?: string; date: string; type: string; location?: string; groupIds?: string[]; homebaseId?: string }) {
  try {
    await requireAdmin();
    await prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description || null,
          date: parseEventDate(data.date),
          type: data.type,
          location: data.location || null,
          homebaseId: data.homebaseId || null,
          updatedAt: new Date(),
        },
      });

      if (data.groupIds !== undefined) {
        await tx.eventGroup.deleteMany({ where: { eventId: id } });
        if (data.groupIds.length > 0) {
          await tx.eventGroup.createMany({
            data: data.groupIds.map((groupId) => ({
              eventId: id,
              groupId,
            })),
          });
        }
      }

      await createAuditLog(tx, "UPDATE", "event", id);
    });

    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error) {
    console.error("Error updating event:", error);
    throw new Error("Gagal mengubah jadwal");
  }
}

export async function deleteEventAction(id: string) {
  try {
    await requireAdmin();
    await prisma.$transaction(async (tx) => {
      await tx.event.delete({ where: { id } });
      await createAuditLog(tx, "DELETE", "event", id);
    });
    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    throw new Error("Gagal menghapus jadwal");
  }
}

export async function getEventsWithAttendanceAction() {
  try {
    await requireAdmin();
    const events = await prisma.event.findMany({
      orderBy: { date: "desc" },
      include: {
        eventGroups: {
          include: { group: { select: { id: true, name: true } } },
        },
        attendances: {
          select: { status: true, createdAt: true },
        },
      },
    });

    return events.map((e) => {
      const stats = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };
      e.attendances.forEach((a) => {
        stats[a.status as keyof typeof stats]++;
      });

      const attendanceMarkedAt = e.attendances.length > 0 ? e.attendances.reduce((latest, current) => (current.createdAt > latest ? current.createdAt : latest), e.attendances[0].createdAt) : null;

      return {
        ...e,
        groups: e.eventGroups.map((eg) => eg.group),
        stats,
        isAttendanceSubmitted: e.attendances.length > 0,
        attendanceMarkedAt,
      };
    });
  } catch (error) {
    console.error("Error fetching events with attendance:", error);
    throw new Error("Gagal mengambil data agenda dengan presensi");
  }
}

export async function getEventAttendanceDetailAction(eventId: string) {
  try {
    await requireAdmin();
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eventGroups: {
          include: { group: { select: { id: true, name: true } } },
        },
        attendances: {
          include: {
            player: { select: { id: true, name: true, schoolOrigin: true } },
          },
          orderBy: { player: { name: "asc" } },
        },
      },
    });

    if (!event) throw new Error("Event tidak ditemukan");

    // Jika belum ada attendance, populate dengan daftar pemain dari group event tsb
    let allAttendances = event.attendances;

    if (event.attendances.length === 0 && event.eventGroups.length > 0) {
      // Ambil pemain-pemain di group
      const groupIds = event.eventGroups.map((eg) => eg.groupId);
      const players = await prisma.player.findMany({
        where: { groupId: { in: groupIds }, isDeleted: false },
        select: { id: true, name: true, schoolOrigin: true },
        orderBy: { name: "asc" },
      });

      // Bikin fake attendance object untuk client
      allAttendances = players.map((p) => ({
        id: "draft-" + p.id,
        date: event.date,
        status: "HADIR" as const,
        note: null,
        playerId: p.id,
        eventId: event.id,
        createdAt: new Date(),
        player: { id: p.id, name: p.name, schoolOrigin: p.schoolOrigin },
      }));
    }

    return {
      ...event,
      groups: event.eventGroups.map((eg) => eg.group),
      attendances: allAttendances,
    };
  } catch (error) {
    console.error("Error fetching event attendance detail:", error);
    throw new Error("Gagal mengambil detail presensi agenda");
  }
}
