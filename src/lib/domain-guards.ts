import type { Prisma } from "@prisma/client";

type TransactionClientLike = Omit<
  Prisma.TransactionClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export async function ensureActiveParentUser(tx: TransactionClientLike, userId: string) {
  const parent = await tx.user.findFirst({
    where: {
      id: userId,
      role: "PARENT",
      isDeleted: false,
    },
    select: { id: true, username: true, name: true },
  });

  if (!parent) {
    throw new Error("Akun orang tua tujuan tidak ditemukan atau sudah tidak aktif.");
  }

  return parent;
}

export async function ensureActiveGroup(tx: TransactionClientLike, groupId: string) {
  const group = await tx.group.findUnique({
    where: { id: groupId },
    select: { id: true, name: true },
  });

  if (!group) {
    throw new Error("Kelompok latihan tidak ditemukan.");
  }

  return group;
}

export async function ensureActiveHomebase(tx: TransactionClientLike, homebaseId: string) {
  const homebase = await tx.homebase.findUnique({
    where: { id: homebaseId },
    select: { id: true, name: true },
  });

  if (!homebase) {
    throw new Error("Homebase tidak ditemukan.");
  }

  return homebase;
}

export async function ensureActivePlayer(tx: TransactionClientLike, playerId: string) {
  const player = await tx.player.findFirst({
    where: {
      id: playerId,
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      parentId: true,
      groupId: true,
    },
  });

  if (!player) {
    throw new Error("Pemain tidak ditemukan atau sudah dihapus.");
  }

  return player;
}

export async function ensureOwnedPlayer(tx: TransactionClientLike, playerId: string, parentId: string) {
  const player = await tx.player.findFirst({
    where: {
      id: playerId,
      parentId,
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!player) {
    throw new Error("Pemain tidak ditemukan atau bukan milik akun ini.");
  }

  return player;
}
