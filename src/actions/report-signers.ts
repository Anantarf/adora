"use server";

import { revalidatePath } from "next/cache";

import { createAuditLog } from "@/actions/audit";
import { normalizeExpectedPrivateUploadUrl } from "@/lib/private-upload";
import { prisma } from "@/lib/prisma";
import {
  REPORT_SIGNER_HOMEBASE_SETTING_KEY,
  serializeReportSignerHomebaseMappings,
  type ReportSignerHomebaseMapping,
} from "@/lib/report-signer";
import { requireAdmin } from "@/lib/server-auth";

export async function getReportSignerHomebaseMappingsAction() {
  await requireAdmin();

  const setting = await prisma.clubSetting.findUnique({
    where: { key: REPORT_SIGNER_HOMEBASE_SETTING_KEY },
    select: { value: true },
  });

  return setting?.value ?? "[]";
}

export async function getReportSignerCoachOptionsAction() {
  await requireAdmin();

  return prisma.coachProfile.findMany({
    where: {
      isDeleted: false,
      user: {
        isDeleted: false,
        role: "COACH",
      },
    },
    select: {
      id: true,
      fullName: true,
      userId: true,
      signatureUrl: true,
      photoUrl: true,
      licenseUrl: true,
      assignments: {
        select: {
          group: {
            select: {
              id: true,
              name: true,
              homebase: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      fullName: "asc",
    },
  });
}

export async function updateReportSignerCoachSignatureAction(
  coachProfileId: string,
  signatureUrl: string,
) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  const coachProfile = await prisma.coachProfile.findFirst({
    where: {
      id: coachProfileId,
      isDeleted: false,
      user: {
        isDeleted: false,
        role: "COACH",
      },
    },
    select: {
      id: true,
      userId: true,
      fullName: true,
    },
  });

  if (!coachProfile) {
    throw new Error("Pelatih tidak ditemukan.");
  }

  const normalizedUrl = normalizeExpectedPrivateUploadUrl(
    signatureUrl,
    {
      allowedPrefixes: [`coach_signature_${coachProfile.userId}_`],
      allowedExtensions: [".png"],
    },
    "Tanda tangan pelatih",
  );
  if (!normalizedUrl) {
    throw new Error("Tanda tangan pelatih wajib diunggah.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.coachProfile.update({
      where: { id: coachProfile.id },
      data: { signatureUrl: normalizedUrl },
    });

    await createAuditLog(tx, "UPDATE", "coachProfile", coachProfile.id, userId, {
      changedFields: ["signatureUrl"],
      fullName: coachProfile.fullName,
      source: "report-signer-settings",
    });
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/statistics");
  revalidatePath("/coach/profile");
  revalidatePath("/parent");

  return { success: true as const };
}

export async function updateReportSignerHomebaseMappingsAction(
  mappings: ReportSignerHomebaseMapping[],
) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  const normalizedMappings = mappings
    .map((mapping) => ({
      homebaseId: mapping.homebaseId.trim(),
      coachProfileId: mapping.coachProfileId.trim(),
    }))
    .filter((mapping) => mapping.homebaseId && mapping.coachProfileId);

  const uniqueHomebaseIds = Array.from(new Set(normalizedMappings.map((mapping) => mapping.homebaseId)));
  const uniqueCoachProfileIds = Array.from(new Set(normalizedMappings.map((mapping) => mapping.coachProfileId)));

  if (uniqueHomebaseIds.length !== normalizedMappings.length) {
    throw new Error("Setiap lokasi hanya boleh memiliki satu tanda tangan pelatih.");
  }

  const [homebases, coachProfiles] = await Promise.all([
    prisma.homebase.findMany({
      where: { id: { in: uniqueHomebaseIds } },
      select: { id: true },
    }),
    prisma.coachProfile.findMany({
      where: {
        id: { in: uniqueCoachProfileIds },
        isDeleted: false,
        user: {
          isDeleted: false,
          role: "COACH",
        },
      },
      select: { id: true },
    }),
  ]);

  if (homebases.length !== uniqueHomebaseIds.length) {
    throw new Error("Sebagian lokasi tidak ditemukan.");
  }

  if (coachProfiles.length !== uniqueCoachProfileIds.length) {
    throw new Error("Sebagian pelatih tidak ditemukan.");
  }

  const value = serializeReportSignerHomebaseMappings(normalizedMappings);

  await prisma.$transaction(async (tx) => {
    const setting = await tx.clubSetting.upsert({
      where: { key: REPORT_SIGNER_HOMEBASE_SETTING_KEY },
      create: {
        key: REPORT_SIGNER_HOMEBASE_SETTING_KEY,
        value,
      },
      update: {
        value,
      },
    });

    await createAuditLog(tx, "UPDATE", "clubSetting", setting.id, userId, {
      key: REPORT_SIGNER_HOMEBASE_SETTING_KEY,
      mappings: normalizedMappings,
    });
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/statistics");
  revalidatePath("/coach/statistics");

  return { success: true as const };
}
