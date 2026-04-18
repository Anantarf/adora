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

  return await prisma.user.findMany({
    where: { role },
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
    orderBy: { name: "asc" },
  });
}

// 2. Create New Parent Account
export async function createUserAction(data: { username: string; name: string; email?: string; password?: string }) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  const existing = await prisma.user.findUnique({ where: { username: data.username } });
  if (existing) {
    throw new Error("Username sudah digunakan oleh akun lain.");
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
        role: "PARENT",
      },
    });
    await createAuditLog(tx, "CREATE", "user", newUser.id, userId);
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
    const res = await tx.user.update({ where: { id }, data: buildUpdateData(data) });
    await createAuditLog(tx, "UPDATE", "user", id, userId);
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

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: { password: hashedPassword } });
    await createAuditLog(tx, "RESET_PASSWORD", "user", id, userId);
  });

  return { message: "Password berhasil direset." };
}

// 5. Delete User (Account Termination) — Hardened with Restrict Check
export async function deleteUserAction(id: string) {
  const session = await requireAdmin();
  const userId = session.user.id ?? null;

  await prisma.$transaction(async (tx) => {
    const playerCount = await tx.player.count({
      where: { parentId: id, isDeleted: false },
    });
    if (playerCount > 0) {
      throw new Error(`Tidak dapat menghapus akun: Akun ini masih terhubung dengan ${playerCount} pemain aktif.`);
    }
    await createAuditLog(tx, "DELETE", "user", id, userId);
    await tx.user.delete({ where: { id } });
  });

  revalidatePath("/dashboard/users");
  return { success: true as const };
}

// 6. Update SELF (Member/Parent updating their own data)
export async function updateSelfAction(data: { name?: string; email?: string; password?: string }) {
  const session = await requireAuth();
  const userId = session.user.id ?? null;

  const result = await prisma.$transaction(async (tx) => {
    const updateData: Partial<{ name: string; email: string | null; password: string }> = {
      ...(data.name ? { name: data.name } : {}),
      ...(data.email !== undefined ? { email: data.email === "" ? null : data.email } : {}),
    };
    if (data.password) updateData.password = await bcrypt.hash(data.password, 10);

    const res = await tx.user.update({ where: { id: userId! }, data: updateData });
    await createAuditLog(tx, "UPDATE_SELF", "user", userId!, userId);
    return res;
  });

  revalidatePath("/parent");
  return result;
}
