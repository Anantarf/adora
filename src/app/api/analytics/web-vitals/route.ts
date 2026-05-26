import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeWebVitalPayload, shouldPersistWebVital, type WebVitalPayload } from "@/lib/analytics/web-vitals";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as WebVitalPayload;
    const normalizedPayload = normalizeWebVitalPayload(payload);
    if (!normalizedPayload) {
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
    console.error("[WEB_VITALS_ERROR]", error);
    return NextResponse.json({ error: "Failed to persist web vitals" }, { status: 500 });
  }
}
