// src/lib/prisma.ts
import { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSlowQueryListenerAttached?: boolean;
};
const SLOW_QUERY_SOURCE = "prisma-slow-query";

function createPrismaClient() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is required. Copy .env.example to .env and set DATABASE_URL (Prisma will not silently fall back to localhost).");
  }

  // Cap individual query duration so a runaway query cannot pin a worker
  // indefinitely. We append Postgres `statement_timeout` (server-side, in ms)
  // to the connection string instead of constructing a `pg.Pool` because the
  // pg package pulls in Node-only modules (tls, net, stream) that Next cannot
  // bundle into client components that transitively import prisma.ts.
  // Operators should configure this on the database server for production; the
  // 10s default here is a safety net for local/dev where it is not pre-set.
  const urlWithTimeout = url.includes("statement_timeout=")
    ? url
    : url + (url.includes("?") ? "&" : "?") + "statement_timeout=10000";

  const adapter = new PrismaPg({
    connectionString: urlWithTimeout,
  });

  return new PrismaClient({
    adapter,
    log:
      process.env.npm_lifecycle_event === "build"
        ? []
        : process.env.PRISMA_SLOW_QUERY_THRESHOLD_MS
          ? [{ emit: "event", level: "query" }, "error", "warn"]
          : process.env.NODE_ENV === "development"
            ? ["error", "warn"]
            : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

const slowQueryThresholdMs = Number(process.env.PRISMA_SLOW_QUERY_THRESHOLD_MS || 0);

if (slowQueryThresholdMs > 0 && !globalForPrisma.prismaSlowQueryListenerAttached) {
  const prismaWithQueryEvents = prisma as PrismaClient & {
    $on(eventType: "query", callback: (event: { duration: number; target: string; query: string }) => void): void;
  };

  prismaWithQueryEvents.$on("query", async (event) => {
    if (event.duration < slowQueryThresholdMs) {
      return;
    }

    if (event.query.includes("\"OperationalEvent\"") || event.query.includes("OperationalEvent")) {
      return;
    }

    console.warn("[PRISMA_SLOW_QUERY]", {
      durationMs: event.duration,
      target: event.target,
      query: event.query,
    });

    try {
      await prisma.operationalEvent.create({
        data: {
          severity: "WARN",
          source: SLOW_QUERY_SOURCE,
          message: "Prisma query exceeded slow query threshold",
          durationMs: event.duration,
          metadata: {
            target: event.target,
            query: event.query.slice(0, 500),
            thresholdMs: slowQueryThresholdMs,
          },
          fingerprint: `${SLOW_QUERY_SOURCE}:${event.target}`.slice(0, 160),
        },
      });
    } catch (persistError) {
      console.error("[PRISMA_SLOW_QUERY_PERSIST_ERROR]", persistError);
    }
  });

  globalForPrisma.prismaSlowQueryListenerAttached = true;
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Re-exporting types for cleaner imports in services/actions.
 */
export type { Prisma };
export const runtime = "nodejs";
