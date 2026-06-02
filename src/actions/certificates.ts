"use server";

import { revalidatePath } from "next/cache";

import { createAuditLog } from "./audit";
import { ensureActivePlayer, ensureOwnedPlayer } from "@/lib/domain-guards";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/server-auth";

export type CertificateRecord = {
  id: string;
  title: string;
  fileUrl: string;
  uploadedAt: Date;
  playerId: string;
  player: { id: string; name: string };
};

export async function getCertificatesAction(): Promise<CertificateRecord[]> {
  await requireAdmin();

  return prisma.certificate.findMany({
    include: {
      player: { select: { id: true, name: true } },
    },
    orderBy: { uploadedAt: "desc" },
  });
}

export async function addCertificateAction(data: {
  title: string;
  fileUrl: string;
  playerId: string;
}) {
  await requireAdmin();

  if (!data.playerId.trim()) {
    throw new Error("Sertifikat wajib ditujukan ke pemain tertentu.");
  }

  const certificate = await prisma.$transaction(async (tx) => {
    await ensureActivePlayer(tx, data.playerId);

    const newCertificate = await tx.certificate.create({
      data: {
        title: data.title,
        fileUrl: data.fileUrl,
        playerId: data.playerId.trim(),
      },
    });

    await createAuditLog(tx, "CREATE", "certificate", newCertificate.id);
    return newCertificate;
  });

  revalidatePath("/dashboard/certificates");
  return certificate;
}

export async function deleteCertificateAction(id: string) {
  await requireAdmin();

  await prisma.$transaction(async (tx) => {
    await tx.certificate.delete({ where: { id } });
    await createAuditLog(tx, "DELETE", "certificate", id);
  });

  revalidatePath("/dashboard/certificates");
  return { success: true };
}

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

  return prisma.certificate.findMany({
    where: { playerId },
    orderBy: { uploadedAt: "desc" },
  });
}
