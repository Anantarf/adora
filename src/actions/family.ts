"use server";

import { ensureOwnedPlayer } from "@/lib/domain-guards";
import { prisma } from "@/lib/prisma";
import { requireActiveUser, requireAdmin } from "@/lib/server-auth";
import { getReportSignerResolverContext, resolveReportSignerSnapshotForGroup } from "@/lib/report-signer-resolver";

async function requireSessionUserId(role: "PARENT" | "ADMIN") {
  const session = await requireActiveUser(role);
  const userId = session.user.id;

  if (!userId) {
    throw new Error("ID pengguna tidak ditemukan di sesi.");
  }

  return userId;
}

export async function getFamilyPlayersAction() {
  const userId = await requireSessionUserId("PARENT");

  const players = await prisma.player.findMany({
    where: {
      parentId: userId,
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      dateOfBirth: true,
      placeOfBirth: true,
      gender: true,
      photoUrl: true,
      schoolOrigin: true,
      group: {
        select: {
          id: true,
          name: true,
          homebase: {
            select: { id: true, name: true }
          },
          coachAssignment: {
            select: {
              coachProfile: {
                select: {
                  id: true,
                  fullName: true,
                  photoUrl: true,
                  licenseUrl: true,
                  signatureUrl: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const signerContext = await getReportSignerResolverContext(prisma);

  return players.map(player => {
    const resolvedSigner = resolveReportSignerSnapshotForGroup(player.group, signerContext);
    
    // If it's a homebase fallback, we can get the basic profile info from mappedCoachProfiles
    let fallbackCoachProfile = null;
    if (resolvedSigner.resolutionSource === "HOMEBASE" && resolvedSigner.coachProfileIdSnapshot) {
      const coach = signerContext.mappedCoachProfiles.get(resolvedSigner.coachProfileIdSnapshot);
      if (coach) {
        fallbackCoachProfile = {
          id: coach.id,
          fullName: coach.fullName,
          photoUrl: coach.photoUrl,
          licenseUrl: coach.licenseUrl,
        };
      }
    }

    return {
      ...player,
      resolvedSigner,
      fallbackCoachProfile,
    };
  });
}

export async function getPlayerAttendanceAction(playerId: string) {
  const userId = await requireSessionUserId("PARENT");

  await prisma.$transaction(async (tx) => {
    await ensureOwnedPlayer(tx, playerId, userId);
  });

  return prisma.attendance.findMany({
    where: { playerId },
    include: {
      event: { select: { title: true, type: true } },
    },
    orderBy: { date: "desc" },
  });
}

export async function getParentsAction() {
  await requireAdmin();

  return prisma.user.findMany({
    where: { role: "PARENT", isDeleted: false },
    select: { id: true, name: true, username: true },
    orderBy: { name: "asc" },
  });
}
