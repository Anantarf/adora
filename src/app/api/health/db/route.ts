import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordOperationalError, recordOperationalWarning } from "@/lib/observability";

const REQUIRED_TOKEN = process.env.HEALTH_CHECK_TOKEN || "";

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
}

export async function GET(req: Request) {
  const token = req.headers.get("x-health-token") ?? "";
  if (REQUIRED_TOKEN === "" || token !== REQUIRED_TOKEN) {
    return NextResponse.json({ error: "Unauthorized health check" }, { status: 401 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: true });
  } catch (error) {
    await recordOperationalError({
      source: "health-db",
      message: "Database health check failed",
      error,
      statusCode: 503,
    });
    return NextResponse.json({ ok: false, db: false }, { status: 503 });
  }
}
