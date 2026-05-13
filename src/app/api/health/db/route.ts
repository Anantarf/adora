import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Simple rate‑limiter for health checks (max 60 req/min per IP)
const healthRateMap = new Map<string, { count: number; reset: number }>();
const HEALTH_RATE_LIMIT = 60; // per minute
const REQUIRED_TOKEN = process.env.HEALTH_CHECK_TOKEN || "";

export async function GET(req: Request) {
  // Token auth
  const token = req.headers.get("x-health-token") ?? "";
  if (REQUIRED_TOKEN === "" || token !== REQUIRED_TOKEN) {
    return NextResponse.json({ error: "Unauthorized health check" }, { status: 401 });
  }

  // Rate‑limit per IP
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();
  const bucket = healthRateMap.get(ip) ?? { count: 0, reset: now + 60_000 };
  if (now > bucket.reset) { bucket.count = 0; bucket.reset = now + 60_000; }
  bucket.count++;
  healthRateMap.set(ip, bucket);
  if (bucket.count > HEALTH_RATE_LIMIT) {
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
