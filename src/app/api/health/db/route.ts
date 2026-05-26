import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const HEALTH_RATE_LIMIT = 60;
const HEALTH_WINDOW_MS = 60_000;
const REQUIRED_TOKEN = process.env.HEALTH_CHECK_TOKEN || "";
const healthRateMap = new Map<string, { count: number; reset: number }>();

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = healthRateMap.get(ip) ?? { count: 0, reset: now + HEALTH_WINDOW_MS };

  if (now > bucket.reset) {
    bucket.count = 0;
    bucket.reset = now + HEALTH_WINDOW_MS;
  }

  bucket.count += 1;
  healthRateMap.set(ip, bucket);

  return bucket.count > HEALTH_RATE_LIMIT;
}

export async function GET(req: Request) {
  const token = req.headers.get("x-health-token") ?? "";
  if (REQUIRED_TOKEN === "" || token !== REQUIRED_TOKEN) {
    return NextResponse.json({ error: "Unauthorized health check" }, { status: 401 });
  }

  if (isRateLimited(getClientIp(req))) {
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
