"use server";

import { revalidatePath } from "next/cache";

import { createAuditLog } from "@/actions/audit";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-auth";

type CoachProfileInput = {
  userId: string;
  fullName: string;
  placeOfBirth?: string;
  dateOfBirth?: string;
  gender?: string;
  photoUrl?: string;
  licenseUrl?: string;
  assignedGroupIds: string[];
};

export async function getCoachProfileByUserAction(userId: string) {
  await requireAdmin();

  const user = await prisma.user.findFirst({
    where: { id: userId, role: "COACH", isDeleted: false },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      coachProfile: {
        select: {
          id: true,
          fullName: true,
          placeOfBirth: true,
          dateOfBirth: true,
          gender: true,
          photoUrl: true,
          licenseUrl: true,
          isDeleted: true,
          assignments: {
            select: {
              group: {
                select: { id: true, name: true },
              },
            },
            orderBy: { group: { name: "asc" } },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error("Akun coach tidak ditemukan atau sudah tidak aktif.");
  }

  if (user.coachProfile?.isDeleted) {
    return {
      ...user,
      coachProfile: null,
    };
  }

  return user;
}

export async function upsertCoachProfileAction(input: CoachProfileInput) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;
  const uniqueGroupIds = Array.from(
    new Set(input.assignedGroupIds.map((groupId) => groupId.trim()).filter(Boolean)),
  );

  const result = await prisma.$transaction(async (tx) => {
    const coachUser = await tx.user.findFirst({
      where: { id: input.userId, role: "COACH", isDeleted: false },
      select: { id: true, username: true },
    });

    if (!coachUser) {
      throw new Error("Akun coach tidak ditemukan atau sudah tidak aktif.");
    }

    if (!input.fullName.trim()) {
      throw new Error("Nama lengkap coach wajib diisi.");
    }

    if (uniqueGroupIds.length > 0) {
      const groups = await tx.group.findMany({
        where: { id: { in: uniqueGroupIds } },
        select: { id: true },
      });

      if (groups.length !== uniqueGroupIds.length) {
        throw new Error("Sebagian kelompok latihan tidak ditemukan.");
      }
    }

    const coachProfile = await tx.coachProfile.upsert({
      where: { userId: input.userId },
      create: {
        userId: input.userId,
        fullName: input.fullName.trim(),
        placeOfBirth: input.placeOfBirth?.trim() || null,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        gender: input.gender?.trim() || null,
        photoUrl: input.photoUrl?.trim() || null,
        licenseUrl: input.licenseUrl?.trim() || null,
        isDeleted: false,
      },
      update: {
        fullName: input.fullName.trim(),
        placeOfBirth: input.placeOfBirth?.trim() || null,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        gender: input.gender?.trim() || null,
        photoUrl: input.photoUrl?.trim() || null,
        licenseUrl: input.licenseUrl?.trim() || null,
        isDeleted: false,
      },
      select: {
        id: true,
        fullName: true,
      },
    });

    await tx.coachAssignment.deleteMany({
      where: {
        coachProfileId: coachProfile.id,
        groupId: { notIn: uniqueGroupIds },
      },
    });

    for (const groupId of uniqueGroupIds) {
      await tx.coachAssignment.upsert({
        where: { groupId },
        create: {
          coachProfileId: coachProfile.id,
          groupId,
        },
        update: {
          coachProfileId: coachProfile.id,
        },
      });
    }

    await createAuditLog(tx, "UPSERT", "coachProfile", coachProfile.id, userId, {
      coachUsername: coachUser.username,
      assignedGroupIds: uniqueGroupIds,
    });

    return coachProfile;
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/settings");
  revalidatePath("/parent");

  return result;
}
