// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const url = process.env.DATABASE_URL;

  if (!url) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL must be specified in production environment.");
    }
    // Safety fallback to prevent crashes in CI or partial setup
    console.warn("⚠ WARNING: DATABASE_URL is missing. Prisma will fail to connect.");
  }

  const connectionString = url || "postgresql://localhost:5432/postgres";

  // Initialize with PostgreSQL adapter. Dynamic pool limit to avoid exhaustion during build workers.
  const poolLimit = process.env.npm_lifecycle_event === "build" ? 10 : 25;
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.npm_lifecycle_event === "build" ? [] : process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Re-exporting types for cleaner imports in services/actions
 */
export type { Prisma };
export const runtime = "nodejs";
