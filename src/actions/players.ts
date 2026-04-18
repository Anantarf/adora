"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server-auth";
import { toJakartaDate } from "@/lib/date-utils";
import { createAuditLog } from "./audit";
import { z } from "zod";

const batchPlayerSchema = z.object({
  name: z.string().trim().min(2),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  placeOfBirth: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  weight: z.string().trim().optional(),
  height: z.string().trim().optional(),
  schoolOrigin: z.string().trim().optional(),
  address: z.string().trim().optional(),
  email: z.string().trim().optional(),
  phoneNumber: z.string().trim().optional(),
  medicalHistory: z.string().trim().optional(),
  parentName: z.string().trim().optional(),
  parentAddress: z.string().trim().optional(),
  parentPhoneNumber: z.string().trim().optional(),
  groupId: z.string().trim().min(1),
  parentId: z.string().trim().optional(),
});

const batchPlayersInputSchema = z.array(batchPlayerSchema).min(1).max(1000);
// 1. Ambil semua pemain (Read)
export async function getPlayersAction(groupId?: string, searchQuery?: string) {
  await requireAdmin();
  return await prisma.player.findMany({
    where: {
      isDeleted: false,
      ...(groupId && groupId !== "all" ? { groupId } : {}),
      ...(searchQuery
        ? {
            OR: [{ name: { contains: searchQuery } }, { schoolOrigin: { contains: searchQuery } }],
          }
        : {}),
    },
    include: {
      group: {
        select: { id: true, name: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

// 2. Tambah pemain baru (Create)
export async function addPlayerAction(data: {
  name: string;
  dateOfBirth: string;
  placeOfBirth?: string;
  gender?: string;
  weight?: string;
  height?: string;
  schoolOrigin?: string;
  address?: string;
  email?: string;
  phoneNumber?: string;
  medicalHistory?: string;
  parentName?: string;
  parentAddress?: string;
  parentPhoneNumber?: string;
  groupId: string;
  parentId?: string;
}) {
  await requireAdmin();
  const player = await prisma.$transaction(async (tx) => {
    const p = await tx.player.create({
      data: {
        name: data.name,
        dateOfBirth: toJakartaDate(data.dateOfBirth),
        placeOfBirth: data.placeOfBirth || undefined,
        gender: data.gender || undefined,
        weight: data.weight || undefined,
        height: data.height || undefined,
        schoolOrigin: data.schoolOrigin || undefined,
        address: data.address || undefined,
        email: data.email || undefined,
        phoneNumber: data.phoneNumber || undefined,
        medicalHistory: data.medicalHistory || undefined,
        parentName: data.parentName || undefined,
        parentAddress: data.parentAddress || undefined,
        parentPhoneNumber: data.parentPhoneNumber || undefined,
        groupId: data.groupId,
        parentId: data.parentId || undefined,
        updatedAt: new Date(),
      },
    });

    await createAuditLog(tx, "CREATE", "player", p.id);
    return p;
  });

  revalidatePath("/dashboard/players");
  return player;
}

// 2.5 Tambah massal pemain (Batch Create)
export async function addBatchPlayersAction(
  playersData: Array<{
    name: string;
    dateOfBirth: string;
    placeOfBirth?: string;
    gender?: string;
    weight?: string;
    height?: string;
    schoolOrigin?: string;
    address?: string;
    email?: string;
    phoneNumber?: string;
    medicalHistory?: string;
    parentName?: string;
    parentAddress?: string;
    parentPhoneNumber?: string;
    groupId: string;
    parentId?: string;
  }>,
) {
  await requireAdmin();

  const parsedInput = batchPlayersInputSchema.safeParse(playersData);
  if (!parsedInput.success) {
    throw new Error("Data batch tidak valid. Periksa kolom wajib dan format tanggal YYYY-MM-DD.");
  }

  const validPayload = parsedInput.data;

  // Deduplicate rows from a single upload payload to avoid accidental double entries in one file.
  const dedupedPayload = Array.from(
    new Map(
      validPayload.map((row) => {
        const key = [row.name.trim().toLowerCase(), row.dateOfBirth, row.groupId, row.parentId?.trim() || ""].join("|");
        return [key, row] as const;
      }),
    ).values(),
  );

  const uniqueGroupIds = Array.from(new Set(dedupedPayload.map((row) => row.groupId)));
  const uniqueParentIds = Array.from(new Set(dedupedPayload.map((row) => row.parentId).filter((parentId): parentId is string => Boolean(parentId))));

  const [foundGroups, foundParents] = await Promise.all([
    prisma.group.findMany({
      where: { id: { in: uniqueGroupIds } },
      select: { id: true },
    }),
    uniqueParentIds.length
      ? prisma.user.findMany({
          where: { id: { in: uniqueParentIds } },
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  const existingGroupIds = new Set(foundGroups.map((group) => group.id));
  const invalidGroupIds = uniqueGroupIds.filter((groupId) => !existingGroupIds.has(groupId));
  if (invalidGroupIds.length > 0) {
    throw new Error(`Ada groupId tidak ditemukan: ${invalidGroupIds.slice(0, 5).join(", ")}`);
  }

  const existingParentIds = new Set(foundParents.map((parent) => parent.id));
  const invalidParentIds = uniqueParentIds.filter((parentId) => !existingParentIds.has(parentId));
  if (invalidParentIds.length > 0) {
    throw new Error(`Ada parentId tidak ditemukan: ${invalidParentIds.slice(0, 5).join(", ")}`);
  }

  const formattedData = dedupedPayload.map((data) => ({
    name: data.name.trim(),
    dateOfBirth: toJakartaDate(data.dateOfBirth),
    placeOfBirth: data.placeOfBirth?.trim() || undefined,
    gender: data.gender?.trim() || undefined,
    weight: data.weight?.trim() || undefined,
    height: data.height?.trim() || undefined,
    schoolOrigin: data.schoolOrigin?.trim() || undefined,
    address: data.address?.trim() || undefined,
    email: data.email?.trim() || undefined,
    phoneNumber: data.phoneNumber?.trim() || undefined,
    medicalHistory: data.medicalHistory?.trim() || undefined,
    parentName: data.parentName?.trim() || undefined,
    parentAddress: data.parentAddress?.trim() || undefined,
    parentPhoneNumber: data.parentPhoneNumber?.trim() || undefined,
    groupId: data.groupId,
    parentId: data.parentId?.trim() || undefined,
    updatedAt: new Date(),
  }));

  const result = await prisma.$transaction(async (tx) => {
    const res = await tx.player.createMany({
      data: formattedData,
      skipDuplicates: true,
    });

    // Create audit logs for all players atomically
    await createAuditLog(tx, "CREATE", "player_batch", String(res.count));
    return res;
  });

  revalidatePath("/dashboard/players");
  return {
    count: result.count,
    submitted: validPayload.length,
    deduped: dedupedPayload.length,
  };
}

// 3. Update pemain (Update)
export async function updatePlayerAction(
  id: string,
  data: {
    name?: string;
    dateOfBirth?: string;
    placeOfBirth?: string;
    gender?: string;
    weight?: string;
    height?: string;
    schoolOrigin?: string;
    address?: string;
    email?: string;
    phoneNumber?: string;
    medicalHistory?: string;
    parentName?: string;
    parentAddress?: string;
    parentPhoneNumber?: string;
    groupId?: string;
  },
) {
  await requireAdmin();

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.player.update({
      where: { id },
      data: {
        name: data.name,
        dateOfBirth: data.dateOfBirth ? toJakartaDate(data.dateOfBirth) : undefined,
        placeOfBirth: data.placeOfBirth,
        gender: data.gender,
        weight: data.weight,
        height: data.height,
        schoolOrigin: data.schoolOrigin,
        address: data.address,
        email: data.email,
        phoneNumber: data.phoneNumber,
        medicalHistory: data.medicalHistory,
        parentName: data.parentName,
        parentAddress: data.parentAddress,
        parentPhoneNumber: data.parentPhoneNumber,
        groupId: data.groupId,
        updatedAt: new Date(),
      },
    });

    await createAuditLog(tx, "UPDATE", "player", res.id);
    return res;
  });

  revalidatePath("/dashboard/players");
  return updated;
}

// 4. Hapus pemain (Soft Delete)
export async function deletePlayerAction(id: string) {
  await requireAdmin();
  await prisma.$transaction(async (tx) => {
    await tx.player.update({
      where: { id },
      data: { isDeleted: true },
    });

    await createAuditLog(tx, "DELETE", "player", id);
  });

  revalidatePath("/dashboard/players");
}
