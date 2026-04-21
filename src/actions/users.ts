"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/server-auth";
import { createAuditLog } from "./audit";
import { buildUpdateData } from "@/lib/utils";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";

// 1. List users (Admin only) - Focused on PARENT role by default
export async function getUsersAction(role: "PARENT" | "ADMIN" = "PARENT") {
  await requireAdmin();

  const users = await prisma.user.findMany({
    where: { role, isDeleted: false },
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

  // Superadmin selalu di posisi paling atas
  return users.sort((a, b) => {
    if (a.username === "superadmin") return -1;
    if (b.username === "superadmin") return 1;
    return 0;
  });
}

// 2. Create New User Account
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

// 3. Update User Profile (Admin manual update)
export async function updateUserAction(
  id: string,
  data: { name?: string; username?: string; email?: string },
) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  const updated = await prisma.$transaction(async (tx) => {
    if (data.username) {
      const usernameConflict = await tx.user.findFirst({ where: { username: data.username, id: { not: id } } });
      if (usernameConflict) throw new Error("Username sudah digunakan oleh akun lain.");
    }
    if (data.email) {
      const emailConflict = await tx.user.findFirst({ where: { email: data.email, id: { not: id } } });
      if (emailConflict) throw new Error("Email sudah terdaftar pada akun lain.");
    }

    const before = await tx.user.findUnique({ where: { id }, select: { username: true, name: true, email: true } });
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

// 4. Reset User Password (Admin bypass)
export async function resetPasswordAction(id: string, newPassword?: string) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  const defaultPassword = process.env.DEFAULT_RESET_PASSWORD;
  const passwordToHash = newPassword || defaultPassword;
  if (!passwordToHash) {
    throw new Error("Password harus disediakan atau set DEFAULT_RESET_PASSWORD di environment.");
  }
  const hashedPassword = await bcrypt.hash(passwordToHash, 10);

  const target = await prisma.user.findUnique({ where: { id }, select: { username: true } });
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: { password: hashedPassword } });
    await createAuditLog(tx, "RESET_PASSWORD", "user", id, userId, {
      username: target?.username,
      resetTo: newPassword ? "custom" : "default",
    });
  });

  return { message: "Password berhasil direset." };
}

// 5. Delete User (Account Termination) — Hardened with Restrict Check
export async function deleteUserAction(id: string) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (targetUser?.username === "superadmin") {
    throw new Error("Akun superadmin adalah sistem bawaan dan tidak dapat dihapus.");
  }

  await prisma.$transaction(async (tx) => {
    const playerCount = await tx.player.count({
      where: { parentId: id, isDeleted: false },
    });
    if (playerCount > 0) {
      throw new Error(`Tidak dapat menghapus akun: Akun ini masih terhubung dengan ${playerCount} pemain aktif.`);
    }
    const target = await tx.user.findUnique({ where: { id }, select: { username: true, role: true } });
    await createAuditLog(tx, "DELETE", "user", id, userId, {
      username: target?.username,
      role: target?.role,
    });
    await tx.user.update({ where: { id }, data: { isDeleted: true } });
  });

  revalidatePath("/dashboard/users");
  return { success: true as const };
}

// 6. List parent accounts (lightweight, for selectors)
export async function getParentUsersAction() {
  await requireAdmin();
  return prisma.user.findMany({
    where: { role: "PARENT", isDeleted: false },
    select: { id: true, username: true, name: true },
    orderBy: { username: "asc" },
  });
}

// 7. Update SELF (Member/Parent updating their own data)
export async function updateSelfAction(data: { name?: string; email?: string; password?: string }) {
  const session = await requireAuth();
  const userId = session.user.id ?? null;

  const result = await prisma.$transaction(async (tx) => {
    if (data.email) {
      const emailConflict = await tx.user.findFirst({ where: { email: data.email, id: { not: userId! } } });
      if (emailConflict) throw new Error("Email tersebut sudah digunakan oleh akun lain.");
    }

    const updateData: Partial<{ name: string; email: string | null; password: string }> = {
      ...(data.name ? { name: data.name } : {}),
      ...(data.email !== undefined ? { email: data.email || null } : {}),
    };
    if (data.password) updateData.password = await bcrypt.hash(data.password, 10);

    const res = await tx.user.update({ where: { id: userId! }, data: updateData });
    await createAuditLog(tx, "UPDATE_SELF", "user", userId!, userId, {
      changedFields: data.password ? ["password"] : [],
      message: data.password ? "Pengguna mengubah kata sandi mereka sendiri." : "Pengguna memperbarui profil mereka sendiri."
    });
    return res;
  });

  revalidatePath("/parent");
  return result;
}
