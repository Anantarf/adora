// src/lib/prisma.ts
import { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL must be specified in production environment.");
    }

    // Keep local and CI boot resilient even when env setup is incomplete.
    console.warn("WARNING: DATABASE_URL is missing. Prisma will fail to connect.");
  }

  const adapter = new PrismaPg({
    connectionString: url || "postgresql://localhost:5432/postgres",
  });

  return new PrismaClient({
    adapter,
    log: process.env.npm_lifecycle_event === "build" ? [] : process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Re-exporting types for cleaner imports in services/actions.
 */
export type { Prisma };
export const runtime = "nodejs";
