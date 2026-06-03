import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SupportedRole = "ADMIN" | "PARENT" | "COACH";

async function getSessionRole(expectedRole?: SupportedRole) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  if (expectedRole && session.user.role !== expectedRole) {
    return null;
  }

  return session;
}

async function getActiveSessionUser(expectedRole?: SupportedRole) {
  const session = await getSessionRole(expectedRole);
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

export async function requireSessionRole(expectedRole?: SupportedRole) {
  const session = await getSessionRole(expectedRole);

  if (!session?.user?.id) {
    throw new Error("Sesi tidak valid. Silakan login kembali.");
  }

  return session;
}

export async function requireActiveUser(expectedRole?: SupportedRole) {
  const session = await getActiveSessionUser(expectedRole);

  if (!session?.user?.id) {
    throw new Error("Sesi tidak valid. Silakan login kembali.");
  }

  return session;
}

export async function requireAdmin() {
  const session = await getActiveSessionUser("ADMIN");

  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized Access: Administrator privilege required.");
  }

  return session;
}

export async function requireAuth() {
  return requireActiveUser();
}
