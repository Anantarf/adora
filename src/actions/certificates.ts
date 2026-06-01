"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireAuth } from "@/lib/server-auth";
import { createAuditLog } from "./audit";
import { ensureActivePlayer, ensureOwnedPlayer } from "@/lib/domain-guards";
// ─── Types ───────────────────────────────────────────
export type CertificateRecord = {
  id: string;
  title: string;
  fileUrl: string;
  uploadedAt: Date;
  playerId: string;
  player: { id: string; name: string };
};

// 1. List all certificates (Admin)
export async function getCertificatesAction(): Promise<CertificateRecord[]> {
  await requireAdmin();

  return await prisma.certificate.findMany({
    include: {
      player: { select: { id: true, name: true } },
    },
    orderBy: { uploadedAt: "desc" },
  });
}

// 2. Create certificate (Admin)
export async function addCertificateAction(data: { title: string; fileUrl: string; playerId: string }) {
  await requireAdmin();

  if (!data.playerId.trim()) {
    throw new Error("Sertifikat wajib ditujukan ke pemain tertentu.");
  }

  const cert = await prisma.$transaction(async (tx) => {
    await ensureActivePlayer(tx, data.playerId);

    const newCert = await tx.certificate.create({
      data: {
        title: data.title,
        fileUrl: data.fileUrl,
        playerId: data.playerId.trim(),
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

  if (userRole === "PARENT") {
    await prisma.$transaction(async (tx) => {
      await ensureOwnedPlayer(tx, playerId, userId!);
    });
  } else {
    await prisma.$transaction(async (tx) => {
      await ensureActivePlayer(tx, playerId);
    });
  }

  return await prisma.certificate.findMany({
    where: {
      playerId,
    },
    orderBy: { uploadedAt: "desc" },
  });
}
