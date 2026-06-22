import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeWebVitalPayload, shouldPersistWebVital, type WebVitalPayload } from "@/lib/analytics/web-vitals";
import { recordOperationalError, recordOperationalWarning } from "@/lib/observability";
import { consumeFixedWindowLimit } from "@/lib/shared-rate-limit";
import { RATE_LIMIT_POLICIES } from "@/lib/constants/rate-limits";

function isRequestAbortError(error: unknown) {
  return error instanceof Error && (error.name === "AbortError" || error.message === "aborted");
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const limitResult = await consumeFixedWindowLimit(
      RATE_LIMIT_POLICIES.webVitals.namespace,
      ip,
      RATE_LIMIT_POLICIES.webVitals.limit,
      RATE_LIMIT_POLICIES.webVitals.windowMs,
    );
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
    if (isRequestAbortError(error)) {
      console.warn("[WEB_VITALS_REQUEST_ABORTED]");
      return new NextResponse(null, { status: 204 });
    }

    await recordOperationalError({
      source: "web-vitals",
      message: "Failed to persist web vitals payload",
      error,
      statusCode: 500,
    });
    return NextResponse.json({ error: "Failed to persist web vitals" }, { status: 500 });
  }
}
