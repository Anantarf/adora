"use server";

import { revalidatePath } from "next/cache";

import { createAuditLog } from "@/actions/audit";
import { normalizeExpectedPrivateUploadUrl } from "@/lib/private-upload";
import { prisma } from "@/lib/prisma";
import { requireActiveUser, requireAdmin } from "@/lib/server-auth";

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

type CoachSelfProfileInput = Omit<CoachProfileInput, "userId" | "assignedGroupIds">;

const coachProfileSelect = {
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
} as const;

const COACH_GENDER_OPTIONS = new Set(["Laki-laki", "Perempuan"]);

function normalizeDateInput(value?: string) {
  if (!value?.trim()) {
    return null;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Tanggal lahir coach tidak valid.");
  }

  return parsedDate;
}

function normalizeCoachProfilePayload(input: {
  userId: string;
  fullName: string;
  placeOfBirth?: string;
  dateOfBirth?: string;
  gender?: string;
  photoUrl?: string;
  licenseUrl?: string;
}) {
  if (!input.fullName.trim()) {
    throw new Error("Nama lengkap coach wajib diisi.");
  }

  const normalizedGender = input.gender?.trim() || null;
  if (normalizedGender && !COACH_GENDER_OPTIONS.has(normalizedGender)) {
    throw new Error("Jenis kelamin coach tidak valid.");
  }

  return {
    fullName: input.fullName.trim(),
    placeOfBirth: input.placeOfBirth?.trim() || null,
    dateOfBirth: normalizeDateInput(input.dateOfBirth),
    gender: normalizedGender,
    photoUrl: normalizeExpectedPrivateUploadUrl(
      input.photoUrl,
      {
        allowedPrefixes: [`coach_photo_${input.userId}_`],
        allowedExtensions: [".png", ".jpg", ".jpeg"],
      },
      "Foto profil coach",
    ),
    licenseUrl: normalizeExpectedPrivateUploadUrl(
      input.licenseUrl,
      {
        allowedPrefixes: [`coach_license_${input.userId}_`],
        allowedExtensions: [".png", ".jpg", ".jpeg"],
      },
      "Lisensi coach",
    ),
    isDeleted: false,
  };
}

export async function getCoachProfileByUserAction(userId: string) {
  await requireAdmin();

  const user = await prisma.user.findFirst({
    where: { id: userId, role: "COACH", isDeleted: false },
    select: coachProfileSelect,
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

export async function getOwnCoachProfileAction() {
  const session = await requireActiveUser("COACH");

  const user = await prisma.user.findFirst({
    where: { id: session.user.id, role: "COACH", isDeleted: false },
    select: coachProfileSelect,
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
        ...normalizeCoachProfilePayload({ ...input, userId: input.userId }),
      },
      update: {
        ...normalizeCoachProfilePayload({ ...input, userId: input.userId }),
      },
      select: {
        id: true,
        fullName: true,
      },
    });

    await tx.user.update({
      where: { id: input.userId },
      data: {
        name: coachProfile.fullName,
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

export async function upsertOwnCoachProfileAction(input: CoachSelfProfileInput) {
  const session = await requireActiveUser("COACH");
  const auditUserId = session.user.id ?? null;

  const result = await prisma.$transaction(async (tx) => {
    const coachUser = await tx.user.findFirst({
      where: { id: session.user.id, role: "COACH", isDeleted: false },
      select: { id: true, username: true },
    });

    if (!coachUser) {
      throw new Error("Akun coach tidak ditemukan atau sudah tidak aktif.");
    }

    const coachProfile = await tx.coachProfile.upsert({
      where: { userId: coachUser.id },
      create: {
        userId: coachUser.id,
        ...normalizeCoachProfilePayload({ ...input, userId: coachUser.id }),
      },
      update: {
        ...normalizeCoachProfilePayload({ ...input, userId: coachUser.id }),
      },
      select: {
        id: true,
        fullName: true,
      },
    });

    await tx.user.update({
      where: { id: coachUser.id },
      data: {
        name: coachProfile.fullName,
      },
    });

    await createAuditLog(tx, "UPSERT", "coachProfile", coachProfile.id, auditUserId, {
      coachUsername: coachUser.username,
      selfService: true,
    });

    return coachProfile;
  });

  revalidatePath("/coach");
  revalidatePath("/coach/profile");
  revalidatePath("/dashboard/users");
  revalidatePath("/parent");

  return result;
}
