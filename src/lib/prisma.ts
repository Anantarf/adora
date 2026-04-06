// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { Prisma } from "@prisma/client";

/**
 * Senior Developer Standard: Explicit Singleton Pattern for Next.js 16.
 * Using Prisma 7 Driver Adapters for maximal performance and "Rust-free" portability.
 */

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

    // Initialize with MariaDB adapter for MySQL workloads in Prisma 7
    const adapter = new PrismaMariaDb(url || "");
    
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Re-exporting types for cleaner imports in services/actions
 */
export type { Prisma };
export const runtime = "nodejs";
