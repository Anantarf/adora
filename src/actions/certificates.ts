"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server-auth";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// ─── Types ───────────────────────────────────────────
export type CertificateRecord = {
  id: string;
  title: string;
  fileUrl: string;
  uploadedAt: Date;
  playerId: string | null;
  groupId: string | null;
  player: { id: string; name: string } | null;
  group: { id: string; name: string } | null;
};

// 1. List all certificates (Admin)
export async function getCertificatesAction(): Promise<CertificateRecord[]> {
  await requireAdmin();

  return await prisma.certificate.findMany({
    include: {
      player: { select: { id: true, name: true } },
      group: { select: { id: true, name: true } },
    },
    orderBy: { uploadedAt: "desc" },
  });
}

// 2. Create certificate (Admin)
export async function addCertificateAction(data: {
  title: string;
  fileUrl: string;
  playerId?: string;
  groupId?: string;
}) {
  await requireAdmin();

  const cert = await prisma.certificate.create({
    data: {
      title: data.title,
      fileUrl: data.fileUrl,
      playerId: data.playerId || null,
      groupId: data.groupId || null,
    },
  });

  // Log the action
  await logAuditAction("CREATE", "certificate", cert.id);

  revalidatePath("/dashboard/certificates");
  return cert;
}

// 3. Delete certificate (Admin)
export async function deleteCertificateAction(id: string) {
  await requireAdmin();

  await prisma.certificate.delete({ where: { id } });

  await logAuditAction("DELETE", "certificate", id);

  revalidatePath("/dashboard/certificates");
  return { success: true };
}

// 4. Get certificates for a specific player (Parent-safe)
export async function getPlayerCertificatesAction(playerId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const userRole = (session.user as { role?: string })?.role;
  const userId = (session.user as { id?: string })?.id;

  const player = await prisma.player.findUnique({
    where: { id: playerId },
  });

  if (!player) return [];

  // IDOR Protection: Parent can only view their own child's certificates
  if (userRole === "PARENT" && player.parentId !== userId) {
    throw new Error("Akses Terlarang: Anda tidak diizinkan melihat sertifikat anak dari keluarga lain.");
  }

  return await prisma.certificate.findMany({
    where: {
      OR: [
        { playerId },
        ...(player.groupId ? [{ groupId: player.groupId }] : []),
      ],
    },
    orderBy: { uploadedAt: "desc" },
  });
}

// ─── Audit Helper ────────────────────────────────────
async function logAuditAction(action: string, targetTable: string, recordId?: string) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id || null;

    await prisma.auditLog.create({
      data: {
        action,
        targetTable,
        recordId: recordId || null,
        userId,
      },
    });
  } catch (e) {
    // Silent fail — audit should never block main operations
    console.error("[AUDIT_LOG_ERROR]:", e);
  }
}
