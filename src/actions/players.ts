"use server";

import { prisma } from "@/lib/prisma";
import { type PlayerSummary } from "@/types/dashboard";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server-auth";
import { toJakartaDate } from "@/lib/date-utils";
import { createAuditLog } from "./audit";
import { withSerializableTransaction } from "@/lib/db-concurrency";
import { ensureActiveGroup, ensureActiveParentUser, ensureActivePlayer } from "@/lib/domain-guards";
import { buildPlayerFullName, splitPlayerName } from "@/lib/player-profile";
import { batchPlayersInputSchema, playerListArgsSchema, DEFAULT_PLAYER_PAGE_SIZE } from "@/lib/validation/player";

const BATCH_CHUNK_SIZE = 200;

function buildPlayerListWhere(groupId?: string, searchQuery?: string) {
  return {
    isDeleted: false,
    ...(groupId && groupId !== "all" ? { groupId } : {}),
    ...(searchQuery
      ? {
          OR: [
            { name: { contains: searchQuery } },
            { firstName: { contains: searchQuery } },
            { lastName: { contains: searchQuery } },
            { schoolOrigin: { contains: searchQuery } },
          ],
        }
      : {}),
  };
}

export async function getPlayersAction(groupId?: string, searchQuery?: string) {
  await requireAdmin();
  return await prisma.player.findMany({
    where: buildPlayerListWhere(groupId, searchQuery),
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      schoolOrigin: true,
      groupId: true,
      group: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getPlayersPageAction(input?: {
  groupId?: string;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  items: PlayerSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  await requireAdmin();

  const parsed = playerListArgsSchema.parse(input ?? {});
  const requestedPage = parsed.page ?? 1;
  const pageSize = parsed.pageSize ?? DEFAULT_PLAYER_PAGE_SIZE;
  const where = buildPlayerListWhere(parsed.groupId, parsed.searchQuery);
  const total = await prisma.player.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const skip = (page - 1) * pageSize;
  const items = await prisma.player.findMany({
    where,
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      schoolOrigin: true,
      groupId: true,
      group: { select: { id: true, name: true } },
      gender: true,
      dateOfBirth: true,
      phoneNumber: true,
      hasMedicalCondition: true,
      medicalConditionDetail: true,
      photoUrl: true,
      signatureUrl: true,
    },
    orderBy: { name: "asc" },
    skip,
    take: pageSize,
  });

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getPlayerDetailAction(id: string) {
  await requireAdmin();
  return prisma.player.findUnique({
    where: { id, isDeleted: false },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      placeOfBirth: true,
      gender: true,
      religion: true,
      weight: true,
      height: true,
      schoolOrigin: true,
      address: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      province: true,
      postalCode: true,
      ktpAddress: true,
      email: true,
      phoneNumber: true,
      medicalHistory: true,
      hasMedicalCondition: true,
      medicalConditionDetail: true,
      instagram: true,
      parentName: true,
      parentAddress: true,
      parentPhoneNumber: true,
      photoUrl: true,
      signatureUrl: true,
      dateOfBirth: true,
      groupId: true,
      parentId: true,
      group: {
        select: { id: true, name: true },
      },
      user: {
        select: { id: true, username: true },
      },
    },
  });
}

export async function addPlayerAction(data: {
  firstName: string;
  lastName?: string;
  dateOfBirth: string;
  placeOfBirth?: string;
  gender?: string;
  religion?: string;
  weight?: string;
  height?: string;
  schoolOrigin?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  ktpAddress?: string;
  email?: string;
  phoneNumber?: string;
  instagram?: string;
  hasMedicalCondition?: boolean;
  medicalConditionDetail?: string;
  parentName?: string;
  parentAddress?: string;
  parentPhoneNumber?: string;
  photoUrl?: string;
  signatureUrl?: string;
  groupId: string;
  parentId?: string;
}) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  const player = await prisma.$transaction(async (tx) => {
    await ensureActiveGroup(tx, data.groupId);
    if (data.parentId) {
      await ensureActiveParentUser(tx, data.parentId);
    }

    const fullName = buildPlayerFullName(data.firstName, data.lastName) || data.firstName.trim();
    const p = await tx.player.create({
      data: {
        name: fullName,
        firstName: data.firstName.trim(),
        lastName: data.lastName?.trim() || "",
        dateOfBirth: toJakartaDate(data.dateOfBirth),
        groupId: data.groupId,
        placeOfBirth: data.placeOfBirth?.trim() || undefined,
        gender: data.gender?.trim() || undefined,
        religion: data.religion?.trim() || undefined,
        weight: data.weight?.trim() || undefined,
        height: data.height?.trim() || undefined,
        schoolOrigin: data.schoolOrigin?.trim() || undefined,
        address: data.addressLine1?.trim() || undefined,
        addressLine1: data.addressLine1?.trim() || undefined,
        addressLine2: data.addressLine2?.trim() || undefined,
        city: data.city?.trim() || undefined,
        province: data.province?.trim() || undefined,
        postalCode: data.postalCode?.trim() || undefined,
        ktpAddress: data.ktpAddress?.trim() || undefined,
        email: data.email?.trim() || undefined,
        phoneNumber: data.phoneNumber?.trim() || undefined,
        medicalHistory: data.hasMedicalCondition ? data.medicalConditionDetail?.trim() || undefined : undefined,
        hasMedicalCondition: Boolean(data.hasMedicalCondition),
        medicalConditionDetail: data.hasMedicalCondition ? data.medicalConditionDetail?.trim() || undefined : undefined,
        instagram: data.instagram?.trim() || undefined,
        parentName: data.parentName?.trim() || undefined,
        parentAddress: data.parentAddress?.trim() || undefined,
        parentPhoneNumber: data.parentPhoneNumber?.trim() || undefined,
        photoUrl: data.photoUrl?.trim() || undefined,
        signatureUrl: data.signatureUrl?.trim() || undefined,
        parentId: data.parentId?.trim() || undefined,
        updatedAt: new Date(),
      },
    });
    await createAuditLog(tx, "CREATE", "player", p.id, userId, {
      name: fullName,
      groupId: p.groupId,
      dateOfBirth: p.dateOfBirth,
    });
    return p;
  });

  revalidatePath("/dashboard/players");
  return player;
}

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
    throw new Error("Data batch tidak valid. Periksa kolom wajib dan format tanggal dd/mm/yyyy.");
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

  const formattedData = dedupedPayload.map((row) => {
    const splitName = splitPlayerName(row.name);
    return {
      name: row.name.trim(),
      firstName: splitName.firstName,
      lastName: splitName.lastName,
      dateOfBirth: toJakartaDate(row.dateOfBirth),
      placeOfBirth: row.placeOfBirth?.trim() || undefined,
      gender: row.gender?.trim() || undefined,
      weight: row.weight?.trim() || undefined,
      height: row.height?.trim() || undefined,
      schoolOrigin: row.schoolOrigin?.trim() || undefined,
      address: row.address?.trim() || undefined,
      addressLine1: row.address?.trim() || undefined,
      email: row.email?.trim() || undefined,
      phoneNumber: row.phoneNumber?.trim() || undefined,
      medicalHistory: row.medicalHistory?.trim() || undefined,
      hasMedicalCondition: Boolean(row.medicalHistory?.trim()),
      medicalConditionDetail: row.medicalHistory?.trim() || undefined,
      parentName: row.parentName?.trim() || undefined,
      parentAddress: row.parentAddress?.trim() || undefined,
      parentPhoneNumber: row.parentPhoneNumber?.trim() || undefined,
      groupId: row.groupId,
      parentId: row.parentId?.trim() || undefined,
      updatedAt: new Date(),
    };
  });

  const chunks = Array.from(
    { length: Math.ceil(formattedData.length / BATCH_CHUNK_SIZE) },
    (_, i) => formattedData.slice(i * BATCH_CHUNK_SIZE, (i + 1) * BATCH_CHUNK_SIZE),
  );

  const result = await withSerializableTransaction(async (tx) => {
    let count = 0;
    for (const chunk of chunks) {
      const res = await tx.player.createMany({ data: chunk, skipDuplicates: true });
      count += res.count;
    }
    await createAuditLog(tx, "CREATE", "player_batch", String(count), userId, {
      count,
      submitted: validPayload.length,
      deduped: dedupedPayload.length,
    });
    return { count };
  });

  revalidatePath("/dashboard/players");
  return { count: result.count, submitted: validPayload.length, deduped: dedupedPayload.length };
}

export async function updatePlayerAction(
  id: string,
  data: {
    firstName?: string; lastName?: string; dateOfBirth?: string; placeOfBirth?: string; gender?: string;
    religion?: string; weight?: string; height?: string; schoolOrigin?: string; addressLine1?: string;
    addressLine2?: string; city?: string; province?: string; postalCode?: string; ktpAddress?: string;
    email?: string; phoneNumber?: string; instagram?: string; hasMedicalCondition?: boolean; medicalConditionDetail?: string;
    parentName?: string; parentAddress?: string; parentPhoneNumber?: string; groupId?: string;
    parentId?: string | null; photoUrl?: string; signatureUrl?: string;
  },
) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  const updated = await prisma.$transaction(async (tx) => {
    await ensureActivePlayer(tx, id);
    if (data.groupId) {
      await ensureActiveGroup(tx, data.groupId);
    }
    if (data.parentId) {
      await ensureActiveParentUser(tx, data.parentId);
    }

    const res = await tx.player.update({
      where: { id },
      data: {
        name: buildPlayerFullName(data.firstName, data.lastName) || undefined,
        firstName: data.firstName,
        lastName: data.lastName ?? undefined,
        dateOfBirth: data.dateOfBirth ? toJakartaDate(data.dateOfBirth) : undefined,
        placeOfBirth: data.placeOfBirth,
        gender: data.gender,
        religion: data.religion,
        weight: data.weight,
        height: data.height,
        schoolOrigin: data.schoolOrigin,
        address: data.addressLine1,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode,
        ktpAddress: data.ktpAddress,
        email: data.email,
        phoneNumber: data.phoneNumber,
        medicalHistory: data.hasMedicalCondition ? data.medicalConditionDetail : null,
        hasMedicalCondition: data.hasMedicalCondition,
        medicalConditionDetail: data.hasMedicalCondition ? data.medicalConditionDetail : null,
        instagram: data.instagram,
        parentName: data.parentName,
        parentAddress: data.parentAddress,
        parentPhoneNumber: data.parentPhoneNumber,
        photoUrl: data.photoUrl,
        signatureUrl: data.signatureUrl,
        groupId: data.groupId,
        ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
        updatedAt: new Date(),
      },
    });
    await createAuditLog(tx, "UPDATE", "player", res.id, userId, {
      before: { name: buildPlayerFullName(data.firstName, data.lastName), groupId: data.groupId, parentId: data.parentId },
      after: { name: res.name, groupId: res.groupId, parentId: res.parentId },
    });
    return res;
  });

  revalidatePath("/dashboard/players");
  return updated;
}

export async function getPlayersByParentAction(parentId: string) {
  await requireAdmin();
  return prisma.player.findMany({
    where: { parentId, isDeleted: false },
    select: { id: true, name: true, group: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
}

export async function deletePlayerAction(id: string) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  await prisma.$transaction(async (tx) => {
    const target = await tx.player.findUnique({
      where: { id, isDeleted: false },
      select: { name: true, groupId: true },
    });
    if (!target) {
      throw new Error("Pemain tidak ditemukan atau sudah dihapus.");
    }
    await tx.player.update({ where: { id }, data: { isDeleted: true } });
    await createAuditLog(tx, "DELETE", "player", id, userId, {
      name: target.name,
      groupId: target.groupId,
    });
  });

  revalidatePath("/dashboard/players");
}

export async function getAvailablePlayersAction() {
  await requireAdmin();
  return prisma.player.findMany({
    where: { parentId: null, isDeleted: false },
    select: { id: true, name: true, group: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
}

export async function linkPlayerAction(playerId: string, parentId: string) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  await withSerializableTransaction(async (tx) => {
    await ensureActiveParentUser(tx, parentId);
    const target = await ensureActivePlayer(tx, playerId);
    const linked = await tx.player.updateMany({
      where: { id: playerId, parentId: null, isDeleted: false },
      data: { parentId },
    });

    if (linked.count !== 1) {
      if (target.parentId) {
        throw new Error("Pemain ini sudah dihubungkan ke akun lain.");
      }

      throw new Error("Pemain tidak ditemukan atau sudah tidak bisa dihubungkan.");
    }

    await createAuditLog(tx, "UPDATE", "player_link", playerId, userId, {
      message: `Pemain ${target.name} dihubungkan ke parentId: ${parentId}`,
    });
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/players");
}

export async function unlinkPlayerAction(playerId: string) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  await withSerializableTransaction(async (tx) => {
    const target = await ensureActivePlayer(tx, playerId);
    await tx.player.update({ where: { id: playerId }, data: { parentId: null } });
    await createAuditLog(tx, "UPDATE", "player_unlink", playerId, userId, {
      message: `Pemain ${target.name} diputuskan hubungannya dari orang tuanya.`,
    });
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/players");
}
