"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireSessionRole } from "@/lib/server-auth";
import { createAuditLog } from "./audit";

const REPORT_SETTING_KEYS = [
  "rapor_header_url",
  "rapor_ceo_sign_url",
  "rapor_coach_sign_url",
  "rapor_stamp_url",
  "rapor_coach_name",
  "rapor_ceo_name",
] as const;

export async function getClubSettingsAction() {
  await requireSessionRole("ADMIN");
  const settings = await prisma.clubSetting.findMany();
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
}

export async function getReportSettingsAction() {
  await requireSessionRole();

  const settings = await prisma.clubSetting.findMany({
    where: {
      key: {
        in: [...REPORT_SETTING_KEYS],
      },
    },
  });

  return Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
}

export async function updateClubSettingAction(key: string, value: string) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  const setting = await prisma.$transaction(async (tx) => {
    const s = await tx.clubSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });

    await createAuditLog(tx, "UPDATE", "clubSetting", s.id, userId, { key });
    return s;
  });

  revalidatePath("/dashboard/settings");
  return setting;
}
