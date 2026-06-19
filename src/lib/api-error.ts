import { NextResponse } from "next/server";

/**
 * Standar error envelope untuk semua API routes.
 *
 * Menggunakan shape `{ error: { code, message } }` sehingga client dapat membedakan
 * error berdasarkan code (i18n, retry policy, telemetry) tanpa parsing string.
 */
export function apiError(
  code: string,
  message: string,
  status: number,
): NextResponse {
  return NextResponse.json(
    { error: { code, message } },
    { status },
  );
}
