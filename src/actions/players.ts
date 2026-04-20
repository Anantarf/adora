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

const BATCH_CHUNK_SIZE = 200;

const OPTIONAL_PLAYER_FIELDS = [
  "placeOfBirth", "gender", "weight", "height", "schoolOrigin",
  "address", "email", "phoneNumber", "medicalHistory",
  "parentName", "parentAddress", "parentPhoneNumber", "parentId",
] as const;
type OptionalPlayerField = (typeof OPTIONAL_PLAYER_FIELDS)[number];

// 1. Ambil semua pemain (Read)
export async function getPlayersAction(groupId?: string, searchQuery?: string) {
  await requireAdmin();
  return await prisma.player.findMany({
    where: {
      isDeleted: false,
      ...(groupId && groupId !== "all" ? { groupId } : {}),
      ...(searchQuery
        ? { OR: [{ name: { contains: searchQuery } }, { schoolOrigin: { contains: searchQuery } }] }
        : {}),
    },
    include: { group: { select: { id: true, name: true } } },
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
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  const player = await prisma.$transaction(async (tx) => {
    const optionalData = Object.fromEntries(
      OPTIONAL_PLAYER_FIELDS.map((k) => [k, (data[k as OptionalPlayerField] as string | undefined) || undefined])
    );
    const p = await tx.player.create({
      data: {
        name: data.name,
        dateOfBirth: toJakartaDate(data.dateOfBirth),
        groupId: data.groupId,
        ...optionalData,
        updatedAt: new Date(),
      },
    });
    await createAuditLog(tx, "CREATE", "player", p.id, userId);
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
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  const parsedInput = batchPlayersInputSchema.safeParse(playersData);
  if (!parsedInput.success) {
    throw new Error("Data batch tidak valid. Periksa kolom wajib dan format tanggal YYYY-MM-DD.");
  }

  const validPayload = parsedInput.data;

  const dedupedPayload = Array.from(
    new Map(
      validPayload.map((row) => {
        const key = [row.name.trim().toLowerCase(), row.dateOfBirth, row.groupId, row.parentId?.trim() || ""].join("|");
        return [key, row] as const;
      }),
    ).values(),
  );

  const uniqueGroupIds = Array.from(new Set(dedupedPayload.map((row) => row.groupId)));
  const uniqueParentIds = Array.from(new Set(dedupedPayload.map((row) => row.parentId).filter((id): id is string => Boolean(id))));

  const [foundGroups, foundParents] = await Promise.all([
    prisma.group.findMany({ where: { id: { in: uniqueGroupIds } }, select: { id: true } }),
    uniqueParentIds.length
      ? prisma.user.findMany({ where: { id: { in: uniqueParentIds } }, select: { id: true } })
      : Promise.resolve([]),
  ]);

  const existingGroupIds = new Set(foundGroups.map((g) => g.id));
  const invalidGroupIds = uniqueGroupIds.filter((id) => !existingGroupIds.has(id));
  if (invalidGroupIds.length > 0) {
    throw new Error(`Ada groupId tidak ditemukan: ${invalidGroupIds.slice(0, 5).join(", ")}`);
  }

  const existingParentIds = new Set(foundParents.map((p) => p.id));
  const invalidParentIds = uniqueParentIds.filter((id) => !existingParentIds.has(id));
  if (invalidParentIds.length > 0) {
    throw new Error(`Ada parentId tidak ditemukan: ${invalidParentIds.slice(0, 5).join(", ")}`);
  }

  const formattedData = dedupedPayload.map((row) => ({
    name: row.name.trim(),
    dateOfBirth: toJakartaDate(row.dateOfBirth),
    placeOfBirth: row.placeOfBirth?.trim() || undefined,
    gender: row.gender?.trim() || undefined,
    weight: row.weight?.trim() || undefined,
    height: row.height?.trim() || undefined,
    schoolOrigin: row.schoolOrigin?.trim() || undefined,
    address: row.address?.trim() || undefined,
    email: row.email?.trim() || undefined,
    phoneNumber: row.phoneNumber?.trim() || undefined,
    medicalHistory: row.medicalHistory?.trim() || undefined,
    parentName: row.parentName?.trim() || undefined,
    parentAddress: row.parentAddress?.trim() || undefined,
    parentPhoneNumber: row.parentPhoneNumber?.trim() || undefined,
    groupId: row.groupId,
    parentId: row.parentId?.trim() || undefined,
    updatedAt: new Date(),
  }));

  const chunks = Array.from(
    { length: Math.ceil(formattedData.length / BATCH_CHUNK_SIZE) },
    (_, i) => formattedData.slice(i * BATCH_CHUNK_SIZE, (i + 1) * BATCH_CHUNK_SIZE),
  );

  const result = await prisma.$transaction(async (tx) => {
    let count = 0;
    for (const chunk of chunks) {
      const res = await tx.player.createMany({ data: chunk, skipDuplicates: true });
      count += res.count;
    }
    await createAuditLog(tx, "CREATE", "player_batch", String(count), userId);
    return { count };
  });

  revalidatePath("/dashboard/players");
  return { count: result.count, submitted: validPayload.length, deduped: dedupedPayload.length };
}

// 3. Update pemain (Update)
export async function updatePlayerAction(
  id: string,
  data: {
    name?: string; dateOfBirth?: string; placeOfBirth?: string; gender?: string;
    weight?: string; height?: string; schoolOrigin?: string; address?: string;
    email?: string; phoneNumber?: string; medicalHistory?: string;
    parentName?: string; parentAddress?: string; parentPhoneNumber?: string; groupId?: string;
  },
) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

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
    await createAuditLog(tx, "UPDATE", "player", res.id, userId);
    return res;
  });

  revalidatePath("/dashboard/players");
  return updated;
}

// 4. Hapus pemain (Soft Delete)
export async function deletePlayerAction(id: string) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  await prisma.$transaction(async (tx) => {
    await tx.player.update({ where: { id }, data: { isDeleted: true } });
    await createAuditLog(tx, "DELETE", "player", id, userId);
  });

  revalidatePath("/dashboard/players");
}
