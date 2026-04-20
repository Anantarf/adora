import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized Access: Administrator privilege required.");
  }

  // Validasi ke DB untuk mencegah error foreign key jika session tidak sinkron dengan DB ter-reset
  const userExists = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true }
  });

  if (!userExists) {
    throw new Error("Sesi tidak valid atau akun sudah tidak ada. Silakan logout dan login kembali.");
  }

  return session;
}

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Sesi tidak valid. Silakan login kembali.");
  return session;
}
