import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getActiveSessionUser(expectedRole?: "ADMIN" | "PARENT") {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) {
    return null;
  }

  const activeUser = await prisma.user.findFirst({
    where: {
      id: sessionUserId,
      isDeleted: false,
      ...(expectedRole ? { role: expectedRole } : {}),
    },
    select: {
      id: true,
      role: true,
      username: true,
      name: true,
      email: true,
    },
  });

  if (!activeUser) {
    return null;
  }

  return {
    ...session,
    user: {
      ...session.user,
      id: activeUser.id,
      role: activeUser.role,
      username: activeUser.username,
      name: activeUser.name,
      email: activeUser.email,
    },
  };
}

export async function requireAdmin() {
  const session = await getActiveSessionUser("ADMIN");

  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized Access: Administrator privilege required.");
  }

  return session;
}

export async function requireAuth() {
  const session = await getActiveSessionUser();
  if (!session?.user?.id) throw new Error("Sesi tidak valid. Silakan login kembali.");
  return session;
}
