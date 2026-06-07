"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireActiveUser } from "@/lib/server-auth";
import { toJakartaDate } from "@/lib/date-utils";
import { createAuditLog } from "./audit";
import type { EvaluationPeriod } from "@/types/dashboard";
import { acquireAdvisoryLock, withSerializableTransaction } from "@/lib/db-concurrency";
import { DEFAULT_EVALUATION_CONFIG_V2, normalizeEvaluationConfig } from "@/lib/evaluation-rules";

const EVALUATION_CONFIG_SETTING_KEY = "evaluation_rules_v2";

async function getActiveEvaluationConfig(
  tx: Pick<typeof prisma, "clubSetting">,
) {
  const setting = await tx.clubSetting.findUnique({
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

// 1. List all periods
export async function getPeriodsAction(): Promise<EvaluationPeriod[]> {
  const session = await requireActiveUser();
  if (session.user.role !== "ADMIN" && session.user.role !== "COACH") {
    throw new Error("Akses Ditolak: Hanya Admin atau Pelatih yang diizinkan.");
  }
  return prisma.evaluationPeriod.findMany({ orderBy: { startDate: "desc" } });
}

// 2. Get active period (if any)
export async function getActivePeriodAction(): Promise<EvaluationPeriod | null> {
  const session = await requireActiveUser();
  if (session.user.role !== "ADMIN" && session.user.role !== "COACH") {
    throw new Error("Akses Ditolak: Hanya Admin atau Pelatih yang diizinkan.");
  }
  return prisma.evaluationPeriod.findFirst({ where: { isActive: true } });
}

// 3. Create period
export async function createPeriodAction(data: { name: string; startDate: string; endDate: string; setActive?: boolean }) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  const period = await withSerializableTransaction(async (tx) => {
    const evaluationConfig = await getActiveEvaluationConfig(tx);
    if (data.setActive) {
      await acquireAdvisoryLock(tx, "evaluation-period:active");
      await tx.evaluationPeriod.updateMany({ where: { isActive: true }, data: { isActive: false } });
    }
    const p = await tx.evaluationPeriod.create({
      data: {
        name: data.name,
        startDate: toJakartaDate(data.startDate),
        endDate: toJakartaDate(data.endDate),
        isActive: data.setActive ?? false,
        evaluationConfigJson: evaluationConfig,
      },
    });
    await createAuditLog(tx, "CREATE", "evaluationPeriod", p.id, userId, {
      name: p.name,
      startDate: p.startDate,
      endDate: p.endDate,
      isActive: p.isActive,
      evaluationConfigVersion: evaluationConfig.version,
    });
    return p;
  });

  revalidatePath("/dashboard/statistics");
  return period;
}

// 4. Set active period (deactivates others)
export async function setActivePeriodAction(periodId: string) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  await withSerializableTransaction(async (tx) => {
    await acquireAdvisoryLock(tx, "evaluation-period:active");
    await tx.evaluationPeriod.updateMany({ where: { isActive: true }, data: { isActive: false } });
    await tx.evaluationPeriod.update({ where: { id: periodId }, data: { isActive: true } });
    const period = await tx.evaluationPeriod.findUnique({ where: { id: periodId }, select: { name: true } });
    await createAuditLog(tx, "SET_ACTIVE", "evaluationPeriod", periodId, userId, {
      name: period?.name,
    });
  });

  revalidatePath("/dashboard/statistics");
}

// 5. Delete period (hanya jika belum ada statistic terkait)
export async function deletePeriodAction(periodId: string) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  await withSerializableTransaction(async (tx) => {
    const statCount = await tx.statistic.count({ where: { periodId } });
    if (statCount > 0) {
      throw new Error(`Periode ini sudah memiliki ${statCount} data nilai. Hapus data nilai terlebih dahulu.`);
    }
    const period = await tx.evaluationPeriod.findUnique({ where: { id: periodId }, select: { name: true } });
    await tx.evaluationPeriod.delete({ where: { id: periodId } });
    await createAuditLog(tx, "DELETE", "evaluationPeriod", periodId, userId, {
      name: period?.name,
    });
  });

  revalidatePath("/dashboard/statistics");
}
