"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireActiveUser, requireAdmin } from "@/lib/server-auth";
import { createAuditLog } from "./audit";
import { CLUB_SETTING_KEYS, formatZodErrors, normalizeClubSettingValue, updateClubSettingSchema, type ClubSettingKey } from "@/lib/validation/club-setting";



export async function getClubSettingsAction() {
  await requireAdmin();
  const settings = await prisma.clubSetting.findMany();
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
}

export async function getReportSettingsAction() {
  await requireActiveUser();

  const settings = await prisma.clubSetting.findMany({
    where: {
      key: {
        in: [...CLUB_SETTING_KEYS],
      },
    },
  });

  const settingsMap = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const globalCoachProfileId = settingsMap.report_signer_global_coach_profile_id?.trim();

  if (globalCoachProfileId) {
    const globalCoachProfile = await prisma.coachProfile.findFirst({
      where: {
        id: globalCoachProfileId,
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
      },
    });

    if (globalCoachProfile) {
      settingsMap.rapor_coach_name = globalCoachProfile.fullName;
      if (globalCoachProfile.signatureUrl?.trim()) {
        settingsMap.rapor_coach_sign_url = globalCoachProfile.signatureUrl;
      }
    }
  }

  return settingsMap;
}

export async function updateClubSettingAction(key: string, value: string) {
  const parsed = updateClubSettingSchema.safeParse({ key, value });
  if (!parsed.success) {
    throw new Error(formatZodErrors(parsed.error));
  }

  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  // Re-bind to the validated values for type narrowing below.
  const validatedKey = parsed.data.key as ClubSettingKey;
  const normalizedValue = normalizeClubSettingValue(validatedKey, parsed.data.value);

  if (validatedKey === "report_signer_global_coach_profile_id") {
    if (!normalizedValue) {
      const setting = await prisma.$transaction(async (tx) => {
        const s = await tx.clubSetting.upsert({
          where: { key: validatedKey },
          create: { key: validatedKey, value: "" },
          update: { value: "" },
        });

        await createAuditLog(tx, "UPDATE", "clubSetting", s.id, userId, { key: validatedKey });
        return s;
      });

      revalidatePath("/dashboard/settings");
      return setting;
    }

    const coachProfile = await prisma.coachProfile.findFirst({
      where: {
        id: normalizedValue,
        isDeleted: false,
        user: {
          isDeleted: false,
          role: "COACH",
        },
      },
      select: { id: true },
    });

    if (!coachProfile) {
      throw new Error("Coach umum yang dipilih tidak ditemukan.");
    }
  }

  const setting = await prisma.$transaction(async (tx) => {
    const s = await tx.clubSetting.upsert({
      where: { key: validatedKey },
      create: { key: validatedKey, value: normalizedValue },
      update: { value: normalizedValue },
    });

    await createAuditLog(tx, "UPDATE", "clubSetting", s.id, userId, { key: validatedKey });
    return s;
  });

  revalidatePath("/dashboard/settings");
  return setting;
}

