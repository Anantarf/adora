import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeFixedWindowLimit } from "@/lib/shared-rate-limit";

const HEALTH_RATE_LIMIT = 60;
const HEALTH_WINDOW_MS = 60_000;
const REQUIRED_TOKEN = process.env.HEALTH_CHECK_TOKEN || "";
const HEALTH_RATE_LIMIT_NAMESPACE = "health-db";

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
}

export async function GET(req: Request) {
  const token = req.headers.get("x-health-token") ?? "";
  if (REQUIRED_TOKEN === "" || token !== REQUIRED_TOKEN) {
    return NextResponse.json({ error: "Unauthorized health check" }, { status: 401 });
  }

  const rateLimitResult = await consumeFixedWindowLimit(
    HEALTH_RATE_LIMIT_NAMESPACE,
    getClientIp(req),
    HEALTH_RATE_LIMIT,
    HEALTH_WINDOW_MS,
  );

  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: "Too many health checks" }, { status: 429 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: true });
  } catch (error) {
    console.error("DB healthcheck failed:", error);
    return NextResponse.json({ ok: false, db: false }, { status: 503 });
  }
}
