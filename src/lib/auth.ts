import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { clearBucket, getActiveBucket, incrementBucket } from "@/lib/shared-rate-limit";
import { recordOperationalError, recordOperationalWarning } from "@/lib/observability";
import { RATE_LIMIT_POLICIES } from "@/lib/constants/rate-limits";
import { getClientIpFromHeaderMap } from "@/lib/client-ip";

const LOGIN_FAILURE_NAMESPACE = RATE_LIMIT_POLICIES.loginFailures.namespace;
const MAX_FAILURES = RATE_LIMIT_POLICIES.loginFailures.maxFailures;
const LOCKOUT_MS = RATE_LIMIT_POLICIES.loginFailures.windowMs;
const INVALID_CREDENTIALS_ERROR = "Username atau sandi tidak valid.";
const LOGIN_TEMPORARY_ERROR = "Layanan login sedang bermasalah. Silakan coba lagi sebentar lagi.";
type AppRole = "ADMIN" | "PARENT" | "COACH";

function normalizeAppRole(role: unknown): AppRole | null {
  if (role === "ADMIN" || role === "SUPERADMIN") {
    return "ADMIN";
  }

  if (role === "PARENT" || role === "COACH") {
    return role;
  }

  return null;
}

async function checkFailureLimit(identifier: string) {
  try {
    const record = await getActiveBucket(LOGIN_FAILURE_NAMESPACE, identifier);

    if (record && record.count >= MAX_FAILURES) {
      await recordOperationalWarning({
        source: "auth",
        message: "Login blocked because identifier is temporarily locked out",
        statusCode: 429,
        metadata: {
          identifier,
          count: record.count,
          resetAt: record.resetAt.toISOString(),
        },
      });
      const remainingMinutes = Math.ceil((record.resetAt.getTime() - Date.now()) / 60000);
      throw new Error(`Akun dikunci sementara karena terlalu banyak percobaan gagal. Coba lagi dalam ${remainingMinutes} menit.`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Akun dikunci sementara")) {
      throw error;
    }

    await recordOperationalError({
      source: "auth",
      message: "Failed to read login failure limiter state",
      error,
      metadata: { identifier },
    });
  }
}

async function recordFailure(identifier: string, failed: boolean) {
  try {
    if (failed) {
      const bucket = await incrementBucket(LOGIN_FAILURE_NAMESPACE, identifier, LOCKOUT_MS);
      if (bucket.count === MAX_FAILURES) {
        await recordOperationalWarning({
          source: "auth",
          message: "Login lockout threshold reached",
          statusCode: 429,
          metadata: {
            identifier,
            count: bucket.count,
            resetAt: bucket.resetAt.toISOString(),
          },
        });
      }
      return;
    }

    await clearBucket(LOGIN_FAILURE_NAMESPACE, identifier);
  } catch (error) {
    await recordOperationalError({
      source: "auth",
      message: "Failed to update login failure limiter state",
      error,
      metadata: { identifier, failed },
    });
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
    await recordOperationalError({
      source: "auth",
      message: "Failed to lookup login user",
      error,
      metadata: { username },
    });
    throw new Error(LOGIN_TEMPORARY_ERROR);
  }
}

async function comparePassword(password: string, hashedPassword: string) {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    await recordOperationalError({
      source: "auth",
      message: "Failed to compare login password hash",
      error,
    });
    throw new Error(LOGIN_TEMPORARY_ERROR);
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
    updateAge: 60 * 60 * 4,
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
        const ip = getClientIpFromHeaderMap(req.headers);

        if (!credentials?.username || !credentials?.password) {
          throw new Error("Izin akses gagal: Identitas login belum lengkap.");
        }

        const identifier = `${ip}:${credentials.username}`;

        try {
          await checkFailureLimit(identifier);

          const user = await findActiveUser(credentials.username);

          if (!user || !user.password || user.isDeleted) {
            await recordFailure(identifier, true);
            throw new Error(INVALID_CREDENTIALS_ERROR);
          }

          const isPasswordCorrect = await comparePassword(credentials.password, user.password);

          if (!isPasswordCorrect) {
            await recordFailure(identifier, true);
            throw new Error(INVALID_CREDENTIALS_ERROR);
          }

          await recordFailure(identifier, false);

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
        token.role = normalizeAppRole(user.role) ?? user.role;
        token.id = user.id;
        token.username = user.username;
        token.mustChangePassword = user.mustChangePassword;
        token.lastChecked = Date.now();
      }

      if (trigger === "update" && session) {
        if (typeof session.mustChangePassword === "boolean") {
          token.mustChangePassword = session.mustChangePassword;
        }
      }

      if (token.id && token.lastChecked && (Date.now() - (token.lastChecked as number) > 15 * 60 * 1000)) {
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { isDeleted: true, role: true, mustChangePassword: true, username: true },
          });

          if (!freshUser || freshUser.isDeleted) {
            token.error = "UserDeleted";
          } else {
            token.role = normalizeAppRole(freshUser.role) ?? freshUser.role;
            token.username = freshUser.username;
            token.mustChangePassword = freshUser.mustChangePassword;
            token.lastChecked = Date.now();
          }
        } catch (error) {
          await recordOperationalError({ source: "jit-session-validation", message: "JIT session validation failed", error });
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token?.error === "UserDeleted") {
        // Returning `user: null` is now type-safe because Session.user is
        // declared as nullable in src/types/next-auth.d.ts. Layouts must handle
        // the null case and redirect to /login.
        return { ...session, user: null };
      }

      if (token && session.user) {
        const normalizedRole = normalizeAppRole(token.role);
        if (normalizedRole) {
          session.user.role = normalizedRole;
        }
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.mustChangePassword = token.mustChangePassword as boolean | undefined;
      }

      return session;
    },
  },
};
