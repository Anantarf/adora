import { prisma } from "@/lib/prisma";

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
      event: {
        orderBy: { date: "desc" },
      },
    },
  });
}

export async function getEventsByHomebase(homebaseId: string) {
  return prisma.event.findMany({
    where: { homebaseId },
    orderBy: { date: "desc" },
    include: {
      group: true,
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
  type?: string;
  homebaseId: string;
  groupId?: string;
  description?: string;
}) {
  return prisma.event.create({
    data: {
      ...data,
      type: data.type || "LATIHAN",
    },
  });
}
