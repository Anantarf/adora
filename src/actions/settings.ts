"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server-auth";
import { createAuditLog } from "./audit";

export async function getClubSettingsAction() {
  await requireAdmin();
  const settings = await prisma.clubSetting.findMany();
  return Object.fromEntries(settings.map(s => [s.key, s.value]));
}

export async function updateClubSettingAction(key: string, value: string) {
  await requireAdmin();
  
  const setting = await prisma.$transaction(async (tx) => {
    const s = await tx.clubSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    
    await createAuditLog(tx, "UPDATE", "clubSetting", s.id, { key, value: "Updated value" });
    return s;
  });

  revalidatePath("/dashboard/settings");
  return setting;
}
