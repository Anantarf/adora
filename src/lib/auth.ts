import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Track failed login attempts per IP — only increments on actual failures
const loginFailures = new Map<string, { count: number; resetAt: number }>();
const MAX_FAILURES = 5;
const LOCKOUT_MS = 60 * 1000;

function checkAndRecordFailure(ip: string, failed: boolean) {
  const now = Date.now();
  const record = loginFailures.get(ip);
  const active = record && record.resetAt > now ? record : { count: 0, resetAt: now + LOCKOUT_MS };

  if (active.count >= MAX_FAILURES) {
    throw new Error("Terlalu banyak percobaan login yang gagal. Harap tunggu 1 menit.");
  }

  if (failed) {
    loginFailures.set(ip, { count: active.count + 1, resetAt: active.resetAt });
  } else {
    loginFailures.delete(ip);
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 hari, session otomatis kadaluwarsa
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const ip =
          (req.headers?.["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
          (req.headers?.["x-real-ip"] as string | undefined) ??
          "unknown";

        if (!credentials?.username || !credentials?.password) {
          throw new Error("Izin akses gagal: Identitas login belum lengkap.");
        }

        try {
          checkAndRecordFailure(ip, false); // cek limit dulu, belum catat failure

          const user = await prisma.user.findUnique({
            where: { username: credentials.username },
          });

          if (!user || !user.password) {
            checkAndRecordFailure(ip, true);
            throw new Error("Identitas ditolak: Akun tidak ditemukan.");
          }

          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordCorrect) {
            checkAndRecordFailure(ip, true);
            throw new Error("Identitas ditolak: Sandi tidak cocok.");
          }

          checkAndRecordFailure(ip, false); // login sukses → hapus record failure
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            username: user.username,
          };
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Terjadi kesalahan saat verifikasi.";
          throw new Error(msg);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.username = token.username;
      }
      return session;
    },
  },

};
