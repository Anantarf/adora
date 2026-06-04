"use server";

import { revalidatePath } from "next/cache";

import { createAuditLog } from "@/actions/audit";
import { DEFAULT_EVALUATION_CONFIG_V2, normalizeEvaluationConfig, type EvaluationConfigV2 } from "@/lib/evaluation-rules";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-auth";

const EVALUATION_CONFIG_SETTING_KEY = "evaluation_rules_v2";

export async function getEvaluationConfigAction(): Promise<EvaluationConfigV2> {
  await requireAdmin();

  const setting = await prisma.clubSetting.findUnique({
    where: { key: EVALUATION_CONFIG_SETTING_KEY },
    select: { value: true },
  });

  if (!setting?.value) {
    return DEFAULT_EVALUATION_CONFIG_V2;
  }

  try {
    return normalizeEvaluationConfig(JSON.parse(setting.value));
  } catch {
    return DEFAULT_EVALUATION_CONFIG_V2;
  }
}

export async function updateEvaluationConfigAction(config: EvaluationConfigV2) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;
  const normalized = normalizeEvaluationConfig(config);

  if (normalized.categories.length === 0) {
    throw new Error("Minimal harus ada satu kategori penilaian.");
  }

  const hasEmptyItems = normalized.categories.some((category) => category.items.length === 0);
  if (hasEmptyItems) {
    throw new Error("Setiap kategori harus memiliki minimal satu aspek penilaian.");
  }

  const totalWeight =
    normalized.categories.reduce((sum, category) => sum + category.weight, 0) +
    (normalized.attendance.enabled ? normalized.attendance.weight : 0);

  if (totalWeight <= 0) {
    throw new Error("Total bobot penilaian harus lebih besar dari 0.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.clubSetting.upsert({
      where: { key: EVALUATION_CONFIG_SETTING_KEY },
      create: {
        key: EVALUATION_CONFIG_SETTING_KEY,
        value: JSON.stringify(normalized),
      },
      update: {
        value: JSON.stringify(normalized),
      },
    });

    await createAuditLog(tx, "UPDATE", "clubSetting", EVALUATION_CONFIG_SETTING_KEY, userId, {
      key: EVALUATION_CONFIG_SETTING_KEY,
      categoryCount: normalized.categories.length,
      attendanceEnabled: normalized.attendance.enabled,
    });
  });

  revalidatePath("/dashboard/statistics");
  return normalized;
}
