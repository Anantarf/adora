"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireAuth } from "@/lib/server-auth";
import { createAuditLog } from "./audit";
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
export async function addCertificateAction(data: { title: string; fileUrl: string; playerId?: string; groupId?: string }) {
  await requireAdmin();

  const hasPlayerTarget = Boolean(data.playerId);
  const hasGroupTarget = Boolean(data.groupId);

  // Valid combinations:
  // - Umum (tanpa target)
  // - Khusus pemain (playerId)
  // - Khusus kelompok (groupId)
  if (hasPlayerTarget && hasGroupTarget) {
    throw new Error("Sertifikat hanya boleh ditujukan ke satu target: pemain atau kelompok.");
  }

  const cert = await prisma.$transaction(async (tx) => {
    const newCert = await tx.certificate.create({
      data: {
        title: data.title,
        fileUrl: data.fileUrl,
        playerId: data.playerId || null,
        groupId: data.groupId || null,
      },
    });

    // Log atomically with create
    await createAuditLog(tx, "CREATE", "certificate", newCert.id);
    return newCert;
  });

  revalidatePath("/dashboard/certificates");
  return cert;
}

// 3. Delete certificate (Admin)
export async function deleteCertificateAction(id: string) {
  await requireAdmin();

  await prisma.$transaction(async (tx) => {
    await tx.certificate.delete({ where: { id } });

    // Log atomically with delete
    await createAuditLog(tx, "DELETE", "certificate", id);
  });

  revalidatePath("/dashboard/certificates");
  return { success: true };
}

// 4. Get certificates for a specific player (Parent-safe)
export async function getPlayerCertificatesAction(playerId: string) {
  const session = await requireAuth();
  const { role: userRole, id: userId } = session.user;

  const player = await prisma.player.findFirst({
    where: { id: playerId, isDeleted: false },
  });

  if (!player) return [];

  // IDOR Protection: Parent can only view their own child's certificates
  if (userRole === "PARENT" && player.parentId !== userId) {
    throw new Error("Akses Terlarang: Anda tidak diizinkan melihat sertifikat anak dari keluarga lain.");
  }

  return await prisma.certificate.findMany({
    where: {
      OR: [{ playerId }, ...(player.groupId ? [{ groupId: player.groupId }] : [])],
    },
    orderBy: { uploadedAt: "desc" },
  });
}
