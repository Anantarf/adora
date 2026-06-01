import { NextRequest, NextResponse } from "next/server";
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
  try {
    const actor = await getSessionActor();
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!actor.role || !ALLOWED_REPORT_ROLES.has(actor.role)) {
      return NextResponse.json({ error: "Tidak diizinkan mengakses laporan ini." }, { status: 403 });
    }

    const playerId = getRequestedPlayerId(req);
    if (!playerId) {
      return NextResponse.json({ error: "playerId is required" }, { status: 400 });
    }

    const player = await getPlayerReportRecord(playerId);
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    if (!canActorAccessPlayer(actor, player)) {
      return NextResponse.json({ error: "Akses Terlarang: Anda tidak memiliki izin untuk data ini." }, { status: 403 });
    }

    const html = renderReportHtml(buildReportViewModel(player));
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("[PDF_REPORT_ERROR]:", error);
    return NextResponse.json({ error: "Gagal generate laporan." }, { status: 500 });
  }
}
