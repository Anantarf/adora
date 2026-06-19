import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { recordOperationalError, recordOperationalWarning } from "@/lib/observability";
import {
  ALLOWED_REPORT_ROLES,
  buildReportViewModel,
  canActorAccessPlayer,
  getPlayerReportRecord,
  getRequestedPlayerId,
  getSessionActor,
} from "./report-data";
import { renderReportHtml } from "./report-render";

export async function GET(req: NextRequest) {
  const startMs = Date.now();
  try {
    const actor = await getSessionActor();
    if (!actor) {
      return apiError("UNAUTHORIZED", "Unauthorized", 401);
    }

    if (!actor.role || !ALLOWED_REPORT_ROLES.has(actor.role)) {
      return apiError("FORBIDDEN", "Tidak diizinkan mengakses laporan ini.", 403);
    }

    const playerId = getRequestedPlayerId(req);
    if (!playerId) {
      return apiError("BAD_REQUEST", "playerId is required", 400);
    }

    const player = await getPlayerReportRecord(playerId);
    if (!player) {
      return apiError("NOT_FOUND", "Player not found", 404);
    }

    if (!canActorAccessPlayer(actor, player)) {
      return apiError("FORBIDDEN", "Akses Terlarang: Anda tidak memiliki izin untuk data ini.", 403);
    }

    const html = renderReportHtml(buildReportViewModel(player));
    
    const durationMs = Date.now() - startMs;
    if (durationMs > 2000) {
      recordOperationalWarning({
        source: "PDF_REPORT_GENERATION",
        message: `Pembuatan HTML rapor untuk player ${playerId} lambat.`,
        durationMs,
      });
    }

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[PDF_REPORT_ERROR]:", error);
    recordOperationalError({
      source: "PDF_REPORT_GENERATION",
      message: "Gagal generate laporan HTML",
      error,
    });
    return apiError("INTERNAL_ERROR", "Gagal generate laporan.", 500);
  }
}
