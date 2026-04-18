"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server-auth";
import { toJakartaDate } from "@/lib/date-utils";
import { createAuditLog } from "./audit";
import type { EvaluationPeriod } from "@/types/dashboard";

// 1. List all periods
export async function getPeriodsAction(): Promise<EvaluationPeriod[]> {
  await requireAdmin();
  return prisma.evaluationPeriod.findMany({ orderBy: { startDate: "desc" } });
}

// 2. Get active period (if any)
export async function getActivePeriodAction(): Promise<EvaluationPeriod | null> {
  await requireAdmin();
  return prisma.evaluationPeriod.findFirst({ where: { isActive: true } });
}

// 3. Create period
export async function createPeriodAction(data: { name: string; startDate: string; endDate: string; setActive?: boolean }) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  const period = await prisma.$transaction(async (tx) => {
    if (data.setActive) {
      await tx.evaluationPeriod.updateMany({ where: { isActive: true }, data: { isActive: false } });
    }
    const p = await tx.evaluationPeriod.create({
      data: {
        name: data.name,
        startDate: toJakartaDate(data.startDate),
        endDate: toJakartaDate(data.endDate),
        isActive: data.setActive ?? false,
      },
    });
    await createAuditLog(tx, "CREATE", "evaluationPeriod", p.id, userId);
    return p;
  });

  revalidatePath("/dashboard/statistics");
  return period;
}

// 4. Set active period (deactivates others)
export async function setActivePeriodAction(periodId: string) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  await prisma.$transaction(async (tx) => {
    await tx.evaluationPeriod.updateMany({ where: { isActive: true }, data: { isActive: false } });
    await tx.evaluationPeriod.update({ where: { id: periodId }, data: { isActive: true } });
    await createAuditLog(tx, "SET_ACTIVE", "evaluationPeriod", periodId, userId);
  });

  revalidatePath("/dashboard/statistics");
}

// 5. Delete period (hanya jika belum ada statistic terkait)
export async function deletePeriodAction(periodId: string) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  await prisma.$transaction(async (tx) => {
    const statCount = await tx.statistic.count({ where: { periodId } });
    if (statCount > 0) {
      throw new Error(`Periode ini sudah memiliki ${statCount} data nilai. Hapus data nilai terlebih dahulu.`);
    }
    await tx.evaluationPeriod.delete({ where: { id: periodId } });
    await createAuditLog(tx, "DELETE", "evaluationPeriod", periodId, userId);
  });

  revalidatePath("/dashboard/statistics");
}
