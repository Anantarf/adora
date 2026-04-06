import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * ADORA Basketball - PDF Report Generator API Route
 * Generates a simple HTML-to-PDF report for player statistics.
 * No external PDF library needed — uses server-rendered HTML that the
 * browser's native print dialog can handle (window.print()).
 *
 * This route returns a styled HTML page optimized for print/PDF export.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Auth Check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string })?.id;
    const userRole = (session.user as { role?: string })?.role;

    // 2. Parse query params
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId");

    if (!playerId) {
      return NextResponse.json({ error: "playerId is required" }, { status: 400 });
    }

    // 3. IDOR Protection: Parent can only access their own child's data
    if (userRole === "PARENT") {
      const ownsChild = await prisma.player.findFirst({
        where: { id: playerId, parentId: userId },
      });
      if (!ownsChild) {
        return NextResponse.json(
          { error: "Akses Terlarang: Anda tidak memiliki izin untuk data ini." },
          { status: 403 }
        );
      }
    }

    // 4. Fetch player data with statistics
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        group: { select: { name: true } },
        statistic: {
          where: { status: "Published" },
          orderBy: { date: "desc" },
          take: 6, // Last 6 evaluation periods
        },
        attendance: {
          orderBy: { date: "desc" },
          take: 30, // Last 30 attendance records
        },
        certificate: {
          orderBy: { uploadedAt: "desc" },
        },
      },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // 5. Calculate embedded metrics
    const latestStat = player.statistic[0];
    let latestMetrics: Record<string, number> = {};
    let coachNotes = "";

    if (latestStat) {
      try {
        const parsed = JSON.parse(latestStat.metricsJson as string);
        latestMetrics = {
          shooting: parsed.shooting || 0,
          dribbling: parsed.dribbling || 0,
          passing: parsed.passing || 0,
          stamina: parsed.stamina || 0,
          attitude: parsed.attitude || 0,
        };
        coachNotes = parsed.notes || "";
      } catch {
        // malformed JSON
      }
    }

    const overallScore = Object.values(latestMetrics).length > 0
      ? (Object.values(latestMetrics).reduce((a, b) => a + b, 0) / Object.values(latestMetrics).length).toFixed(1)
      : "N/A";

    const totalAttendance = player.attendance.length;
    const hadirCount = player.attendance.filter((a: { status: string }) => a.status === "HADIR").length;
    const attendanceRate = totalAttendance > 0
      ? ((hadirCount / totalAttendance) * 100).toFixed(0)
      : "N/A";

    const age = getAge(player.dateOfBirth);
    const evalDate = latestStat
      ? new Date(latestStat.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
      : "Belum ada evaluasi";

    // 6. Generate printable HTML
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Rapor ${player.name} - ADORA Basketball Club</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      color: #1a1a2e;
      background: #fff;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #D4AF37;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .header-brand {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 4px;
      color: #1a1a2e;
      text-transform: uppercase;
    }

    .header-brand span { color: #D4AF37; }

    .header-meta {
      text-align: right;
      font-size: 11px;
      color: #666;
      line-height: 1.6;
    }

    .player-info {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 28px;
      border: 1px solid #dee2e6;
    }

    .player-name {
      font-size: 22px;
      font-weight: 800;
      color: #1a1a2e;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .player-meta {
      display: flex;
      gap: 20px;
      font-size: 12px;
      color: #555;
      font-weight: 600;
    }

    .player-meta span {
      background: white;
      padding: 4px 12px;
      border-radius: 6px;
      border: 1px solid #dee2e6;
    }

    .section-title {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: #D4AF37;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #f0e6c8;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;
      margin-bottom: 28px;
    }

    .metric-card {
      text-align: center;
      background: #f8f9fa;
      border-radius: 10px;
      padding: 16px 8px;
      border: 1px solid #dee2e6;
    }

    .metric-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #888;
      margin-bottom: 6px;
    }

    .metric-value {
      font-size: 28px;
      font-weight: 900;
      color: #1a1a2e;
    }

    .summary-row {
      display: flex;
      gap: 16px;
      margin-bottom: 28px;
    }

    .summary-card {
      flex: 1;
      background: #1a1a2e;
      color: white;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }

    .summary-card .value {
      font-size: 32px;
      font-weight: 900;
      color: #D4AF37;
    }

    .summary-card .label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #aaa;
      margin-top: 4px;
    }

    .notes-box {
      background: #fffbeb;
      border-left: 4px solid #D4AF37;
      border-radius: 0 10px 10px 0;
      padding: 20px;
      margin-bottom: 28px;
      font-size: 13px;
      line-height: 1.8;
      color: #333;
      font-style: italic;
    }

    .cert-list {
      margin-bottom: 28px;
    }

    .cert-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 6px;
      border: 1px solid #dee2e6;
      font-size: 12px;
      font-weight: 600;
    }

    .cert-badge {
      background: #D4AF37;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .footer {
      border-top: 2px solid #dee2e6;
      padding-top: 20px;
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #999;
    }

    .print-btn {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: #D4AF37;
      color: white;
      border: none;
      padding: 14px 28px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      cursor: pointer;
      box-shadow: 0 8px 30px rgba(212,175,55,0.4);
      transition: all 0.2s;
    }

    .print-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(212,175,55,0.5);
    }
  </style>
</head>
<body>
  <!-- Print Button -->
  <button class="print-btn no-print" onclick="window.print()">📄 Simpan sebagai PDF</button>

  <!-- Header -->
  <div class="header">
    <div class="header-brand">ADORA <span>Basketball</span></div>
    <div class="header-meta">
      Portofolio Prestasi Atlet<br>
      Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
    </div>
  </div>

  <!-- Player Info -->
  <div class="player-info">
    <div class="player-name">${player.name}</div>
    <div class="player-meta">
      <span>🏀 ${player.group?.name || "Tanpa Kelas"}</span>
      <span>🎂 ${age} Tahun</span>
      <span>🏫 ${player.schoolOrigin || "—"}</span>
      <span>📅 Evaluasi: ${evalDate}</span>
    </div>
  </div>

  <!-- Summary Cards -->
  <div class="summary-row">
    <div class="summary-card">
      <div class="value">${overallScore}</div>
      <div class="label">skor rata-rata</div>
    </div>
    <div class="summary-card">
      <div class="value">${attendanceRate}%</div>
      <div class="label">tingkat kehadiran</div>
    </div>
    <div class="summary-card">
      <div class="value">${player.statistic.length}</div>
      <div class="label">total evaluasi</div>
    </div>
    <div class="summary-card">
      <div class="value">${player.certificate.length}</div>
      <div class="label">sertifikat</div>
    </div>
  </div>

  <!-- Skill Metrics -->
  ${Object.keys(latestMetrics).length > 0 ? `
  <div class="section-title">Komposisi Kemampuan Terakhir</div>
  <div class="metrics-grid">
    ${Object.entries(latestMetrics).map(([key, val]) => `
    <div class="metric-card">
      <div class="metric-label">${key}</div>
      <div class="metric-value">${val}</div>
    </div>`).join("")}
  </div>` : ""}

  <!-- Coach Notes -->
  ${coachNotes ? `
  <div class="section-title">Catatan Pelatih</div>
  <div class="notes-box">"${coachNotes}"</div>` : ""}

  <!-- Certificates -->
  ${player.certificate.length > 0 ? `
  <div class="section-title">Riwayat Sertifikat Prestasi</div>
  <div class="cert-list">
    ${player.certificate.map((c: { title: string; uploadedAt: Date }) => `
    <div class="cert-item">
      <span class="cert-badge">🏆 Prestasi</span>
      ${c.title}
      <span style="margin-left:auto; color:#999; font-size:10px;">
        ${new Date(c.uploadedAt).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}
      </span>
    </div>`).join("")}
  </div>` : ""}

  <!-- Footer -->
  <div class="footer">
    <span>Dokumen ini dibuat otomatis oleh sistem ADORA Basketball Club.</span>
    <span>© ${new Date().getFullYear()} ADORA Basketball Club</span>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("[PDF_REPORT_ERROR]:", error);
    return NextResponse.json(
      { error: "Gagal generate laporan." },
      { status: 500 }
    );
  }
}

// Helper
function getAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}
