// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
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

  const parsedUrl = new URL(url || "mysql://localhost:3306/");

  // Initialize with MariaDB adapter. Dynamic pool limit to avoid exhaustion during build workers.
  const poolLimit = process.env.npm_lifecycle_event === "build" ? 10 : 25;
  const adapter = new PrismaMariaDb({
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port) || 3306,
    user: parsedUrl.username,
    password: parsedUrl.password,
    database: parsedUrl.pathname.slice(1) || process.env.DB_NAME,
    connectionLimit: poolLimit,
  });

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
