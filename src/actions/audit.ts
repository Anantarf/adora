"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/server-auth";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { DEFAULT_AUDIT_PAGE_SIZE } from "@/lib/constants";
// ─── Types ───────────────────────────────────────────
export type AuditLogRecord = {
  id: string;
  action: string;
  targetTable: string;
  recordId: string | null;
  details: any | null; // Added details field for audit view
  timestamp: Date;
  userId: string | null;
  user: { id: string; name: string | null; username: string | null } | null;
};

// 1. List audit logs (Admin only) — paginated via cursor
export async function getAuditLogsAction(options?: { take?: number; cursor?: string }): Promise<{ logs: AuditLogRecord[]; nextCursor: string | null }> {
  await requireAdmin();

  const take = options?.take || DEFAULT_AUDIT_PAGE_SIZE;

  const logs = await prisma.auditlog.findMany({
    take: take + 1, // Take one extra to check for next page
    ...(options?.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    include: {
      user: { select: { id: true, name: true, username: true } },
    },
    orderBy: { timestamp: "desc" },
  });

  const hasMore = logs.length > take;
  const trimmed = hasMore ? logs.slice(0, take) : logs;

  return {
    logs: trimmed,
    nextCursor: hasMore ? trimmed[trimmed.length - 1].id : null,
  };
}

// 2. Log an audit action — Internal function for transactions
// userId harus diambil SEBELUM memulai transaksi agar tidak memperlama TX
export async function createAuditLog(
  tx: Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  action: string,
  targetTable: string,
  recordId?: string,
  userId?: string | null,
  details?: any,
) {
  // Fallback ke session hanya jika userId tidak diberikan (backward compat sementara migrasi)
  const resolvedUserId =
    userId !== undefined
      ? userId
      : (((await getServerSession(authOptions))?.user as { id?: string } | undefined)?.id ?? null);

  return await tx.auditlog.create({
    data: {
      id: crypto.randomUUID(),
      action,
      targetTable,
      recordId: recordId ?? null,
      details: details ?? null,
      userId: resolvedUserId,
    },
  });
}

// 3. Log an audit action — Public Server Action
export async function createAuditLogAction(action: string, targetTable: string, recordId?: string, details?: any) {
  try {
    const session = await requireAdmin();
    const userId = session.user.id ?? null;
    await prisma.$transaction(async (tx) => {
      await createAuditLog(tx, action, targetTable, recordId, userId, details);
    });
  } catch (e) {
    console.error("[AUDIT_LOG_ERROR]:", e);
  }
}
