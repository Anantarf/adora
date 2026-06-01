import { NextResponse } from "next/server";

const REQUIRED_TOKEN = process.env.HEALTH_CHECK_TOKEN || "";

export function requireHealthCheckToken(req: Request, label: string) {
  const token = req.headers.get("x-health-token") ?? "";
  if (REQUIRED_TOKEN === "" || token !== REQUIRED_TOKEN) {
    return NextResponse.json({ ok: false, service: label, error: "Unauthorized health check" }, { status: 401 });
  }

  return null;
}

export function buildHealthOkResponse<T extends Record<string, unknown>>(label: string, extra?: T) {
  return NextResponse.json({
    ok: true,
    service: label,
    db: true,
    ...(extra ?? {}),
  });
}

export function buildHealthErrorResponse(label: string) {
  return NextResponse.json({ ok: false, service: label, db: false }, { status: 503 });
}
