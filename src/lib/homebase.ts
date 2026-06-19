import { prisma } from "@/lib/prisma";
import { DEFAULT_EVENT_TYPE } from "@/lib/config/events";
import type { event_type } from "@prisma/client";

export async function getHomebases() {
  return prisma.homebase.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getHomebaseById(id: string) {
  return prisma.homebase.findUnique({
    where: { id },
    include: {
      groups: {
        include: {
          player: {
            where: { isDeleted: false },
          },
        },
      },
      events: {
        orderBy: { date: "desc" },
      },
    },
  });
}

export async function getGroupsByHomebase(homebaseId: string) {
  return prisma.group.findMany({
    where: { homebaseId },
    include: {
      player: {
        where: { isDeleted: false },
      },
      eventGroups: {
        include: { event: true },
        orderBy: { event: { date: "desc" } },
      },
    },
  });
}

export async function getEventsByHomebase(homebaseId: string) {
  return prisma.event.findMany({
    where: { homebaseId },
    orderBy: { date: "desc" },
    include: {
      eventGroups: { include: { group: true } },
    },
  });
}

export async function updateGroupHomebase(
  groupId: string,
  homebaseId: string
) {
  return prisma.group.update({
    where: { id: groupId },
    data: { homebaseId },
  });
}

export async function createHomebaseEvent(data: {
  title: string;
  date: Date;
  type?: event_type;
  homebaseId: string;
  groupId?: string;
  description?: string;
}) {
  return prisma.event.create({
    data: {
      ...data,
      type: data.type ?? DEFAULT_EVENT_TYPE,
    },
  });
}
