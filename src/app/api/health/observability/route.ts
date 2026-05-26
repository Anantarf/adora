import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeFixedWindowLimit } from "@/lib/shared-rate-limit";
import { getObservabilitySnapshot } from "@/lib/observability-snapshot";
import { recordOperationalError } from "@/lib/observability";

const HEALTH_RATE_LIMIT = 60;
const HEALTH_WINDOW_MS = 60_000;
const REQUIRED_TOKEN = process.env.HEALTH_CHECK_TOKEN || "";
const HEALTH_RATE_LIMIT_NAMESPACE = "health-observability";

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
}

export async function GET(req: Request) {
  const token = req.headers.get("x-health-token") ?? "";
  if (REQUIRED_TOKEN === "" || token !== REQUIRED_TOKEN) {
    return NextResponse.json({ error: "Unauthorized observability check" }, { status: 401 });
  }

  const rateLimitResult = await consumeFixedWindowLimit(
    HEALTH_RATE_LIMIT_NAMESPACE,
    getClientIp(req),
    HEALTH_RATE_LIMIT,
    HEALTH_WINDOW_MS,
  );

  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: "Too many observability checks" }, { status: 429 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    const summary = await getObservabilitySnapshot(24);

    return NextResponse.json({
      ok: true,
      db: true,
      summary,
    });
  } catch (error) {
    await recordOperationalError({
      source: "health-observability",
      message: "Observability health check failed",
      error,
      statusCode: 503,
    });

    return NextResponse.json({ ok: false, db: false }, { status: 503 });
  }
}
