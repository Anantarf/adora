import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeWebVitalPayload, shouldPersistWebVital, type WebVitalPayload } from "@/lib/analytics/web-vitals";
import { recordOperationalError, recordOperationalWarning } from "@/lib/observability";
import { consumeFixedWindowLimit } from "@/lib/shared-rate-limit";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const RATE_LIMIT = 120;
    const RATE_WINDOW_MS = 60_000;
    const limitResult = await consumeFixedWindowLimit("web-vitals", ip, RATE_LIMIT, RATE_WINDOW_MS);
    if (!limitResult.allowed) {
      await recordOperationalWarning({
        source: "web-vitals",
        message: "Web-vitals rate limit exceeded",
        statusCode: 429,
        metadata: { ip, count: limitResult.count },
      });
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const payload = (await request.json()) as WebVitalPayload;
    const normalizedPayload = normalizeWebVitalPayload(payload);
    if (!normalizedPayload) {
      await recordOperationalWarning({
        source: "web-vitals",
        message: "Rejected invalid web vitals payload",
        statusCode: 400,
      });
      return NextResponse.json({ error: "Invalid web vitals payload" }, { status: 400 });
    }

    if (!shouldPersistWebVital(normalizedPayload)) {
      return NextResponse.json({ ok: true });
    }

    await prisma.webVitalEvent.create({
      data: {
        metricId: normalizedPayload.id || null,
        name: normalizedPayload.name,
        value: normalizedPayload.value,
        delta: normalizedPayload.delta,
        rating: normalizedPayload.rating,
        navigationType: normalizedPayload.navigationType || null,
        pathname: normalizedPayload.pathname,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    await recordOperationalError({
      source: "web-vitals",
      message: "Failed to persist web vitals payload",
      error,
      statusCode: 500,
    });
    return NextResponse.json({ error: "Failed to persist web vitals" }, { status: 500 });
  }
}
