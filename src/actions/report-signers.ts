"use server";

import { revalidatePath } from "next/cache";

import { createAuditLog } from "@/actions/audit";
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
      signatureUrl: true,
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
  const uniqueCoachProfileIds = Array.from(
    new Set(normalizedMappings.map((mapping) => mapping.coachProfileId)),
  );

  if (uniqueHomebaseIds.length !== normalizedMappings.length) {
    throw new Error("Setiap homebase hanya boleh memiliki satu signer fallback.");
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
      },
      select: { id: true },
    }),
  ]);

  if (homebases.length !== uniqueHomebaseIds.length) {
    throw new Error("Sebagian homebase signer tidak ditemukan.");
  }

  if (coachProfiles.length !== uniqueCoachProfileIds.length) {
    throw new Error("Sebagian coach signer tidak ditemukan.");
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
