import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { clearBucket, getActiveBucket, incrementBucket } from "@/lib/shared-rate-limit";

const LOGIN_FAILURE_NAMESPACE = "login-failures";
const MAX_FAILURES = 10;
const LOCKOUT_MS = 15 * 60 * 1000;

async function checkFailureLimit(ip: string) {
  const record = await getActiveBucket(LOGIN_FAILURE_NAMESPACE, ip);

  if (record && record.count >= MAX_FAILURES) {
    const remainingMinutes = Math.ceil((record.resetAt.getTime() - Date.now()) / 60000);
    throw new Error(`Akun dikunci sementara karena terlalu banyak percobaan gagal. Coba lagi dalam ${remainingMinutes} menit.`);
  }
}

async function recordFailure(ip: string, failed: boolean) {
  if (failed) {
    await incrementBucket(LOGIN_FAILURE_NAMESPACE, ip, LOCKOUT_MS);
    return;
  }

  await clearBucket(LOGIN_FAILURE_NAMESPACE, ip);
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
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
          await checkFailureLimit(ip);

          const user = await prisma.user.findUnique({
            where: { username: credentials.username },
          });

          if (!user || !user.password) {
            await recordFailure(ip, true);
            throw new Error("Identitas ditolak: Akun tidak ditemukan.");
          }

          const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordCorrect) {
            await recordFailure(ip, true);
            throw new Error("Identitas ditolak: Sandi tidak cocok.");
          }

          await recordFailure(ip, false);

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            username: user.username,
            mustChangePassword: user.mustChangePassword,
          };
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Terjadi kesalahan saat verifikasi.";
          throw new Error(msg);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.username = user.username;
        token.mustChangePassword = user.mustChangePassword;
      }

      if (trigger === "update" && session) {
        if (typeof session.mustChangePassword === "boolean") {
          token.mustChangePassword = session.mustChangePassword;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.mustChangePassword = token.mustChangePassword as boolean | undefined;
      }

      return session;
    },
  },
};
