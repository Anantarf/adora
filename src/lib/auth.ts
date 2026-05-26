import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { clearBucket, getActiveBucket, incrementBucket } from "@/lib/shared-rate-limit";

const LOGIN_FAILURE_NAMESPACE = "login-failures";
const MAX_FAILURES = 10;
const LOCKOUT_MS = 15 * 60 * 1000;
const INVALID_CREDENTIALS_ERROR = "Username atau sandi tidak valid.";
const LOGIN_TEMPORARY_ERROR = "Layanan login sedang bermasalah. Silakan coba lagi sebentar lagi.";

async function checkFailureLimit(ip: string) {
  try {
    const record = await getActiveBucket(LOGIN_FAILURE_NAMESPACE, ip);

    if (record && record.count >= MAX_FAILURES) {
      const remainingMinutes = Math.ceil((record.resetAt.getTime() - Date.now()) / 60000);
      throw new Error(`Akun dikunci sementara karena terlalu banyak percobaan gagal. Coba lagi dalam ${remainingMinutes} menit.`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Akun dikunci sementara")) {
      throw error;
    }

    console.warn("[LOGIN_FAILURE_LIMIT_CHECK_ERROR]", { ip, error });
  }
}

async function recordFailure(ip: string, failed: boolean) {
  try {
    if (failed) {
      await incrementBucket(LOGIN_FAILURE_NAMESPACE, ip, LOCKOUT_MS);
      return;
    }

    await clearBucket(LOGIN_FAILURE_NAMESPACE, ip);
  } catch (error) {
    console.warn("[LOGIN_FAILURE_RECORD_ERROR]", { ip, failed, error });
  }
}

function normalizeAuthorizeError(error: unknown) {
  if (error instanceof Error) {
    if (
      error.message === INVALID_CREDENTIALS_ERROR ||
      error.message === "Izin akses gagal: Identitas login belum lengkap." ||
      error.message.startsWith("Akun dikunci sementara")
    ) {
      return error.message;
    }
  }

  return LOGIN_TEMPORARY_ERROR;
}

async function findActiveUser(username: string) {
  try {
    return await prisma.user.findUnique({
      where: { username },
    });
  } catch (error) {
    console.error("[LOGIN_USER_LOOKUP_ERROR]", { username, error });
    throw new Error(LOGIN_TEMPORARY_ERROR);
  }
}

async function comparePassword(password: string, hashedPassword: string) {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error("[LOGIN_PASSWORD_COMPARE_ERROR]", error);
    throw new Error(LOGIN_TEMPORARY_ERROR);
  }
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

          const user = await findActiveUser(credentials.username);

          if (!user || !user.password || user.isDeleted) {
            await recordFailure(ip, true);
            throw new Error(INVALID_CREDENTIALS_ERROR);
          }

          const isPasswordCorrect = await comparePassword(credentials.password, user.password);

          if (!isPasswordCorrect) {
            await recordFailure(ip, true);
            throw new Error(INVALID_CREDENTIALS_ERROR);
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
          throw new Error(normalizeAuthorizeError(error));
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
