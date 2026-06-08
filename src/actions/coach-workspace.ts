"use server";

import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-auth";

export async function getCoachWorkspaceAction() {
  const session = await requireActiveUser("COACH");

  const coachUser = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      role: "COACH",
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      username: true,
      coachProfile: {
        where: {
          isDeleted: false,
        },
        select: {
          id: true,
          fullName: true,
          photoUrl: true,
          licenseUrl: true,
          assignments: {
            orderBy: {
              group: {
                name: "asc",
              },
            },
            select: {
              group: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  homebase: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  _count: {
                    select: {
                      player: true,
                    },
                  },
                  player: {
                    where: {
                      isDeleted: false,
                    },
                    orderBy: {
                      name: "asc",
                    },
                    select: {
                      id: true,
                      name: true,
                      gender: true,
                      schoolOrigin: true,
                      dateOfBirth: true,
                      parentName: true,
                      photoUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!coachUser) {
    throw new Error("Akun coach tidak ditemukan atau sudah tidak aktif.");
  }

  const assignedGroups = Array.from(
    new Map(
      (coachUser.coachProfile?.assignments ?? []).map((assignment) => [
        assignment.group.id,
        assignment.group,
      ]),
    ).values(),
  );
  const assignedGroupIds = assignedGroups.map((group) => group.id);

  const upcomingEvents = assignedGroupIds.length
    ? await prisma.event.findMany({
        where: {
          date: {
            gte: new Date(),
          },
          eventGroups: {
            some: {
              groupId: {
                in: assignedGroupIds,
              },
            },
          },
        },
        orderBy: {
          date: "asc",
        },
        take: 5,
        select: {
          id: true,
          title: true,
          type: true,
          date: true,
          location: true,
          eventGroups: {
            select: {
              group: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })
    : [];

  const recentPublishedStatsCount = assignedGroupIds.length
    ? await prisma.statistic.count({
        where: {
          status: "Published",
          player: {
            isDeleted: false,
            groupId: {
              in: assignedGroupIds,
            },
          },
        },
      })
    : 0;

  const players = Array.from(
    new Map(
      assignedGroups.flatMap((group) =>
        group.player.map((player) => [
          player.id,
          {
            ...player,
            group: {
              id: group.id,
              name: group.name,
            },
            homebase: group.homebase,
          },
        ]),
      ),
    ).values(),
  );

  return {
    coach: {
      id: coachUser.id,
      name: coachUser.coachProfile?.fullName ?? coachUser.name ?? "Coach",
      username: coachUser.username ?? "-",
      photoUrl: coachUser.coachProfile?.photoUrl ?? null,
      licenseUrl: coachUser.coachProfile?.licenseUrl ?? null,
    },
    summary: {
      totalGroups: assignedGroups.length,
      totalPlayers: players.length,
      recentPublishedStatsCount,
      upcomingEventsCount: upcomingEvents.length,
    },
    groups: assignedGroups,
    players,
    upcomingEvents: upcomingEvents.map((event) => ({
      ...event,
      groups: event.eventGroups.map((eventGroup) => eventGroup.group),
    })),
  };
}
