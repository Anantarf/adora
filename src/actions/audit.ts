"use server";

import { Prisma } from "@prisma/client";
import { recordOperationalError } from "@/lib/observability";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { DEFAULT_AUDIT_PAGE_SIZE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-auth";

export type AuditLogRecord = {
  id: string;
  action: string;
  targetTable: string;
  recordId: string | null;
  details: Prisma.JsonValue | null;
  timestamp: Date;
  userId: string | null;
  user: { id: string; name: string | null; username: string | null } | null;
};

export async function getAuditLogsAction(options?: { take?: number; cursor?: string }): Promise<{ logs: AuditLogRecord[]; nextCursor: string | null }> {
  await requireAdmin();

  const take = options?.take || DEFAULT_AUDIT_PAGE_SIZE;
  const logs = await prisma.auditlog.findMany({
    take: take + 1,
    ...(options?.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    include: {
      user: { select: { id: true, name: true, username: true } },
    },
    orderBy: [{ timestamp: "desc" }, { id: "desc" }],
  });

  const hasMore = logs.length > take;
  const trimmed = hasMore ? logs.slice(0, take) : logs;

  return {
    logs: trimmed,
    nextCursor: hasMore ? trimmed[trimmed.length - 1].id : null,
  };
}

export async function createAuditLog(
  tx: Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  action: string,
  targetTable: string,
  recordId?: string,
  userId?: string | null,
  details?: Prisma.InputJsonValue,
) {
  let resolvedUserId = userId;
  if (resolvedUserId === undefined) {
    const session = await getServerSession(authOptions);
    resolvedUserId = (session?.user as { id?: string } | undefined)?.id ?? null;
  }

  try {
    return await tx.auditlog.create({
      data: {
        action,
        targetTable,
        recordId: recordId ?? null,
        details: details ?? Prisma.JsonNull,
        userId: resolvedUserId,
      },
    });
  } catch (error) {
    await recordOperationalError({ source: "create-audit-log", message: "Failed to create audit log", error });
    throw new Error("Gagal mencatat audit log.");
  }
}
