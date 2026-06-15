"use server";

import { revalidatePath } from "next/cache";
import type { Prisma, event_type } from "@prisma/client";
import { createAuditLog } from "./audit";
import { getJakartaToday, toJakartaDate } from "@/lib/date-utils";
import { ensureActiveGroup, ensureActiveHomebase } from "@/lib/domain-guards";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireActiveUser } from "@/lib/server-auth";
import { ScheduleEvent } from "@/types/dashboard";

function parseEventDate(input: string): Date {
  return input.includes("T") ? new Date(input) : toJakartaDate(input);
}

async function validateEventRelations(
  tx: Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  groupIds?: string[],
  homebaseId?: string,
) {
  if (homebaseId) {
    await ensureActiveHomebase(tx, homebaseId);
  }

  const uniqueGroupIds = Array.from(new Set((groupIds ?? []).filter(Boolean)));
  for (const groupId of uniqueGroupIds) {
    await ensureActiveGroup(tx, groupId);
  }
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

    return events.map((event) => ({
      ...event,
      groups: event.eventGroups.map((eventGroup) => eventGroup.group),
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

export async function createEventAction(data: { title: string; description?: string; date: string; type: event_type; location?: string; groupIds?: string[]; homebaseId?: string }) {
  try {
    const session = await requireAdmin();
    const userId = session.user.id ?? null;

    await prisma.$transaction(async (tx) => {
      await validateEventRelations(tx, data.groupIds, data.homebaseId);

      const event = await tx.event.create({
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
            eventId: event.id,
            groupId,
          })),
        });
      }

      await createAuditLog(tx, "CREATE", "event", event.id, userId);
    });

    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error) {
    console.error("Error creating event:", error);
    throw new Error("Gagal membuat agenda baru");
  }
}

export async function updateEventAction(id: string, data: { title: string; description?: string; date: string; type: event_type; location?: string; groupIds?: string[]; homebaseId?: string }) {
  try {
    const session = await requireAdmin();
    const userId = session.user.id ?? null;

    await prisma.$transaction(async (tx) => {
      await validateEventRelations(tx, data.groupIds, data.homebaseId);

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

      await createAuditLog(tx, "UPDATE", "event", id, userId);
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
    const session = await requireAdmin();
    const userId = session.user.id ?? null;

    await prisma.$transaction(async (tx) => {
      await tx.event.delete({ where: { id } });
      await createAuditLog(tx, "DELETE", "event", id, userId);
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
    const session = await requireActiveUser();
    const { role, id: userId } = session.user;

    if (role !== "ADMIN" && role !== "COACH") {
      throw new Error("Akses Ditolak: Hanya Admin atau Pelatih yang diizinkan.");
    }

    let assignedGroupIds: string[] = [];
    let whereClause: Prisma.eventWhereInput = {};

    if (role === "COACH") {
      const coach = await prisma.coachProfile.findUnique({
        where: { userId, isDeleted: false },
        include: { assignments: true },
      });
      if (!coach) {
        throw new Error("Akses Ditolak: Profil pelatih tidak ditemukan.");
      }
      assignedGroupIds = coach.assignments.map((a) => a.groupId);
      whereClause = {
        eventGroups: {
          some: {
            groupId: { in: assignedGroupIds },
          },
        },
      };
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      include: {
        eventGroups: {
          include: { group: { select: { id: true, name: true } } },
        },
        attendances: {
          where: role === "COACH" ? { player: { groupId: { in: assignedGroupIds } } } : undefined,
          select: { status: true, createdAt: true },
        },
      },
    });

    return events.map((event) => {
      const stats = event.attendances.reduce(
        (acc, { status }) => ({ ...acc, [status]: (acc[status as keyof typeof acc] ?? 0) + 1 }),
        { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 } as Record<string, number>,
      );

      const attendanceMarkedAt = event.attendances.length > 0
        ? event.attendances.reduce(
            (latest, current) => (current.createdAt > latest ? current.createdAt : latest),
            event.attendances[0].createdAt,
          )
        : null;

      return {
        ...event,
        groups: event.eventGroups.map((eventGroup) => eventGroup.group),
        stats,
        isAttendanceSubmitted: event.attendances.length > 0,
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
    const session = await requireActiveUser();
    const { role, id: userId } = session.user;

    if (role !== "ADMIN" && role !== "COACH") {
      throw new Error("Akses Ditolak: Hanya Admin atau Pelatih yang diizinkan.");
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eventGroups: {
          include: { group: { select: { id: true, name: true } } },
        },
        attendances: {
          include: {
            player: { select: { id: true, name: true, schoolOrigin: true, groupId: true, group: { select: { name: true } } } },
          },
          orderBy: { player: { name: "asc" } },
        },
      },
    });

    if (!event) {
      throw new Error("Event tidak ditemukan");
    }

    let assignedGroupIds: string[] = [];
    if (role === "COACH") {
      const coach = await prisma.coachProfile.findUnique({
        where: { userId, isDeleted: false },
        include: { assignments: true },
      });
      if (!coach) {
        throw new Error("Akses Ditolak: Profil pelatih tidak ditemukan.");
      }
      assignedGroupIds = coach.assignments.map((a) => a.groupId);

      const eventGroupIds = event.eventGroups.map((eg) => eg.groupId);
      const hasAccess = eventGroupIds.some((gid) => assignedGroupIds.includes(gid));
      if (!hasAccess) {
        throw new Error("Akses Ditolak: Anda tidak ditugaskan ke kelompok untuk agenda ini.");
      }
    }

    let allAttendances = event.attendances;

    if (event.attendances.length === 0 && event.eventGroups.length > 0) {
      const groupIds = event.eventGroups.map((eventGroup) => eventGroup.groupId);
      const fetchGroupIds = role === "COACH"
        ? groupIds.filter((gid) => assignedGroupIds.includes(gid))
        : groupIds;

      const players = await prisma.player.findMany({
        where: { groupId: { in: fetchGroupIds }, isDeleted: false },
        select: { id: true, name: true, schoolOrigin: true, groupId: true, group: { select: { name: true } } },
        orderBy: { name: "asc" },
      });

      allAttendances = players.map((player) => ({
        id: `draft-${player.id}`,
        date: event.date,
        status: "HADIR" as const,
        note: null,
        playerId: player.id,
        eventId: event.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        player: {
          id: player.id,
          name: player.name,
          schoolOrigin: player.schoolOrigin,
          groupId: player.groupId,
          group: player.group,
        },
      }));
    } else if (role === "COACH") {
      allAttendances = allAttendances.filter((att) => att.player && att.player.groupId && assignedGroupIds.includes(att.player.groupId));
    }

    return {
      ...event,
      groups: event.eventGroups.map((eventGroup) => eventGroup.group),
      attendances: allAttendances,
      isDraftAttendance: event.attendances.length === 0,
    };
  } catch (error) {
    console.error("Error fetching event attendance detail:", error);
    throw new Error("Gagal mengambil detail presensi agenda");
  }
}

