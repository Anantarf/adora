import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordOperationalError } from "@/lib/observability";
import { getCachedObservabilitySnapshot } from "@/lib/observability-snapshot";

const REQUIRED_TOKEN = process.env.HEALTH_CHECK_TOKEN || "";

export async function GET(req: Request) {
  const token = req.headers.get("x-health-token") ?? "";
  if (REQUIRED_TOKEN === "" || token !== REQUIRED_TOKEN) {
    return NextResponse.json({ error: "Unauthorized observability check" }, { status: 401 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    const summary = await getCachedObservabilitySnapshot(24);

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
