"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "./audit";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSessionRole } from "@/lib/server-auth";
import { buildUpdateData } from "@/lib/utils";
import { DEFAULT_USER_PAGE_SIZE, userListArgsSchema } from "@/lib/validation/user";

function buildUserListWhere(role: "PARENT" | "ADMIN", searchQuery?: string) {
  return {
    role,
    isDeleted: false,
    ...(searchQuery
      ? {
          OR: [
            { name: { contains: searchQuery } },
            { username: { contains: searchQuery } },
            { email: { contains: searchQuery } },
          ],
        }
      : {}),
  };
}

function sortSuperadminFirst<T extends { username: string | null }>(items: T[]) {
  return [...items].sort((a, b) => {
    if (a.username === "superadmin") return -1;
    if (b.username === "superadmin") return 1;
    return 0;
  });
}

export async function getUsersAction(role: "PARENT" | "ADMIN" = "PARENT") {
  await requireSessionRole("ADMIN");

  const users = await prisma.user.findMany({
    where: buildUserListWhere(role),
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      image: true,
      _count: {
        select: { player: { where: { isDeleted: false } } },
      },
    },
    orderBy: { username: "asc" },
  });

  return sortSuperadminFirst(users);
}

export async function getUsersPageAction(input?: {
  role?: "PARENT" | "ADMIN";
  searchQuery?: string;
  page?: number;
  pageSize?: number;
}) {
  await requireSessionRole("ADMIN");

  const parsed = userListArgsSchema.parse(input ?? {});
  const requestedPage = parsed.page ?? 1;
  const pageSize = parsed.pageSize ?? DEFAULT_USER_PAGE_SIZE;
  const where = buildUserListWhere(parsed.role, parsed.searchQuery);
  const total = await prisma.user.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const skip = (page - 1) * pageSize;

  const items = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      image: true,
      _count: {
        select: { player: { where: { isDeleted: false } } },
      },
    },
    orderBy: [{ username: "asc" }],
    skip,
    take: pageSize,
  });

  return {
    items: sortSuperadminFirst(items),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function createUserAction(data: { username: string; name: string; email?: string; password?: string; role?: "PARENT" | "ADMIN" }) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  const existing = await prisma.user.findUnique({ where: { username: data.username } });
  if (existing) {
    throw new Error("Username sudah digunakan oleh akun lain.");
  }

  if (data.email) {
    const emailConflict = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailConflict) throw new Error("Email sudah terdaftar pada akun lain.");
  }

  const defaultPassword = process.env.DEFAULT_RESET_PASSWORD;
  if (!data.password && !defaultPassword) {
    throw new Error("Password harus disediakan atau set DEFAULT_RESET_PASSWORD di environment.");
  }

  const hashedPassword = await bcrypt.hash(data.password || defaultPassword!, 10);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        username: data.username,
        name: data.name,
        email: data.email || null,
        password: hashedPassword,
        role: data.role || "PARENT",
        mustChangePassword: true,
      },
    });

    await createAuditLog(tx, "CREATE", "user", newUser.id, userId, {
      username: newUser.username,
      role: newUser.role,
    });

    return newUser;
  });

  revalidatePath("/dashboard/users");
  return user;
}

export async function updateUserAction(
  id: string,
  data: { name?: string; username?: string; email?: string },
) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  const updated = await prisma.$transaction(async (tx) => {
    const targetUser = await tx.user.findFirst({
      where: { id, isDeleted: false },
      select: { id: true, username: true, name: true, email: true, role: true },
    });
    if (!targetUser) throw new Error("Akun yang ingin diperbarui tidak ditemukan atau sudah tidak aktif.");

    if (data.username) {
      const usernameConflict = await tx.user.findFirst({ where: { username: data.username, id: { not: id } } });
      if (usernameConflict) throw new Error("Username sudah digunakan oleh akun lain.");
    }

    if (data.email) {
      const emailConflict = await tx.user.findFirst({ where: { email: data.email, id: { not: id } } });
      if (emailConflict) throw new Error("Email sudah terdaftar pada akun lain.");
    }

    const before = { username: targetUser.username, name: targetUser.name, email: targetUser.email };
    const res = await tx.user.update({ where: { id }, data: buildUpdateData(data) });

    await createAuditLog(tx, "UPDATE", "user", id, userId, {
      before,
      after: { username: res.username, name: res.name, email: res.email },
    });

    return res;
  });

  revalidatePath("/dashboard/users");
  return updated;
}

export async function resetPasswordAction(id: string, newPassword?: string) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  const defaultPassword = process.env.DEFAULT_RESET_PASSWORD;
  const passwordToHash = newPassword || defaultPassword;
  if (!passwordToHash) {
    throw new Error("Password harus disediakan atau set DEFAULT_RESET_PASSWORD di environment.");
  }

  const hashedPassword = await bcrypt.hash(passwordToHash, 10);

  await prisma.$transaction(async (tx) => {
    const target = await tx.user.findFirst({
      where: { id, isDeleted: false },
      select: { username: true },
    });
    if (!target) throw new Error("Akun yang ingin direset tidak ditemukan atau sudah tidak aktif.");

    await tx.user.update({
      where: { id },
      data: { password: hashedPassword, mustChangePassword: true },
    });

    await createAuditLog(tx, "RESET_PASSWORD", "user", id, userId, {
      username: target.username,
      resetTo: newPassword ? "custom" : "default",
    });
  });

  revalidatePath("/dashboard/users");
  return { message: "Password berhasil direset." };
}

export async function deleteUserAction(id: string) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (targetUser?.username === "superadmin") {
    throw new Error("Akun superadmin adalah sistem bawaan dan tidak dapat dihapus.");
  }

  await prisma.$transaction(async (tx) => {
    const activeTargetUser = await tx.user.findFirst({
      where: { id, isDeleted: false },
      select: { username: true, role: true },
    });
    if (!activeTargetUser) throw new Error("Akun yang ingin dihapus tidak ditemukan atau sudah tidak aktif.");

    const playerCount = await tx.player.count({
      where: { parentId: id, isDeleted: false },
    });
    if (playerCount > 0) {
      throw new Error(`Tidak dapat menghapus akun: Akun ini masih terhubung dengan ${playerCount} pemain aktif.`);
    }

    await createAuditLog(tx, "DELETE", "user", id, userId, {
      username: activeTargetUser.username,
      role: activeTargetUser.role,
    });

    await tx.user.update({ where: { id }, data: { isDeleted: true } });
  });

  revalidatePath("/dashboard/users");
  return { success: true as const };
}

export async function getParentUsersAction() {
  await requireSessionRole("ADMIN");

  return prisma.user.findMany({
    where: { role: "PARENT", isDeleted: false },
    select: { id: true, username: true, name: true },
    orderBy: { username: "asc" },
  });
}

export async function updateSelfAction(data: { name?: string; email?: string; password?: string }) {
  const session = await requireSessionRole();
  const userId = session.user.id ?? null;

  const result = await prisma.$transaction(async (tx) => {
    const currentUser = await tx.user.findFirst({
      where: { id: userId!, isDeleted: false },
      select: { id: true },
    });
    if (!currentUser) throw new Error("Akun Anda tidak lagi aktif.");

    if (data.email) {
      const emailConflict = await tx.user.findFirst({ where: { email: data.email, id: { not: userId! } } });
      if (emailConflict) throw new Error("Email tersebut sudah digunakan oleh akun lain.");
    }

    const updateData: Partial<{ name: string; email: string | null; password: string }> = {
      ...(data.name ? { name: data.name } : {}),
      ...(data.email !== undefined ? { email: data.email || null } : {}),
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const res = await tx.user.update({ where: { id: userId! }, data: updateData });

    await createAuditLog(tx, "UPDATE_SELF", "user", userId!, userId, {
      changedFields: data.password ? ["password"] : [],
      message: data.password ? "Pengguna mengubah kata sandi mereka sendiri." : "Pengguna memperbarui profil mereka sendiri.",
    });

    return res;
  });

  revalidatePath("/parent");
  return result;
}

export async function changeForcedPasswordAction(newPassword: string) {
  const session = await requireSessionRole();
  const userId = session.user.id;
  if (!userId) throw new Error("Tidak terautentikasi.");

  if (!newPassword || newPassword.length < 8) {
    throw new Error("Password baru minimal 8 karakter.");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction(async (tx) => {
    const currentUser = await tx.user.findFirst({
      where: { id: userId, isDeleted: false },
      select: { id: true },
    });
    if (!currentUser) throw new Error("Akun Anda tidak lagi aktif.");

    await tx.user.update({
      where: { id: userId },
      data: { password: hashedPassword, mustChangePassword: false },
    });

    await createAuditLog(tx, "CHANGE_FORCED_PASSWORD", "user", userId, userId, {
      message: "Pengguna menyelesaikan pergantian password wajib.",
    });
  });

  return { success: true as const };
}
