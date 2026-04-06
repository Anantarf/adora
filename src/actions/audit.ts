"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-auth";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

// ─── Types ───────────────────────────────────────────
export type AuditLogRecord = {
  id: string;
  action: string;
  targetTable: string;
  recordId: string | null;
  timestamp: Date;
  userId: string | null;
  user: { id: string; name: string | null; username: string | null } | null;
};

// 1. List audit logs (Admin only) — paginated via cursor
export async function getAuditLogsAction(options?: {
  take?: number;
  cursor?: string;
}): Promise<{ logs: AuditLogRecord[]; nextCursor: string | null }> {
  await requireAdmin();

  const take = options?.take || 50;

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
export async function createAuditLog(
  tx: any, // Prisma Transaction Client
  action: string,
  targetTable: string,
  recordId?: string
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id || null;

    return await tx.auditlog.create({
    data: {
      id: crypto.randomUUID(),
      action,
      targetTable,
      recordId: recordId || null,
      userId,
    },
  });
}

// 3. Log an audit action — Public Server Action
export async function createAuditLogAction(
  action: string,
  targetTable: string,
  recordId?: string
) {
  try {
    await prisma.$transaction(async (tx) => {
      await createAuditLog(tx, action, targetTable, recordId);
    });
  } catch (e) {
    console.error("[AUDIT_LOG_ERROR]:", e);
  }
}
