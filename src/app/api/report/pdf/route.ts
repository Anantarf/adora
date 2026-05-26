import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { MetricsJson } from "@/types/dashboard";

const REPORT_TITLE = "ADORA Basketball Club";
const PRINT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};
const CERTIFICATE_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: "short",
  year: "numeric",
};
const MAX_STATISTICS = 6;
const MAX_ATTENDANCE = 30;
const MAX_CERTIFICATES = 12;

type ReportMetricItem = {
  label: string;
  value: number;
  max: number;
};

type SessionActor = {
  id?: string;
  role?: string;
};

const ALLOWED_REPORT_ROLES = new Set(["ADMIN", "PARENT"]);

type PlayerReportRecord = NonNullable<Awaited<ReturnType<typeof getPlayerReportRecord>>>;
type ReportViewModel = {
  attendanceRateLabel: string;
  age: number;
  certificates: Array<{ title: string; uploadedAtLabel: string }>;
  coachNotes: string;
  evaluationDateLabel: string;
  generatedAtLabel: string;
  groupName: string;
  latestMetrics: ReportMetricItem[];
  overallScoreLabel: string;
  playerName: string;
  schoolOrigin: string;
  totalCertificates: number;
  totalEvaluations: number;
};

const REPORT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 3px solid #FF6A00;
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

  .header-brand span { color: #FF6A00; }

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
    flex-wrap: wrap;
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
    color: #FF6A00;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid #ede9fe;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
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
    color: #FF6A00;
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
    background: #faf5ff;
    border-left: 4px solid #FF6A00;
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
    background: #FF6A00;
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
    background: #FF6A00;
    color: white;
    border: none;
    padding: 14px 28px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 2px;
    cursor: pointer;
    box-shadow: 0 8px 30px rgba(124, 58, 237, 0.4);
    transition: all 0.2s;
  }

  .print-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(124, 58, 237, 0.5);
  }
`;

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function getAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

function formatDate(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString("id-ID", options);
}

function extractReportMetrics(raw: unknown): { metrics: ReportMetricItem[]; notes: string } {
  const parsed = raw as Partial<MetricsJson> & { notes?: unknown };

  return {
    metrics: [
      { label: "In & Out Dribble", value: toNumber(parsed.dribble?.inAndOut), max: 99 },
      { label: "Crossover", value: toNumber(parsed.dribble?.crossover), max: 10 },
      { label: "V Dribble (Kiri)", value: toNumber(parsed.dribble?.vLeft), max: 10 },
      { label: "V Dribble (Kanan)", value: toNumber(parsed.dribble?.vRight), max: 10 },
      { label: "Between Legs (Kiri)", value: toNumber(parsed.dribble?.betweenLegsLeft), max: 10 },
      { label: "Between Legs (Kanan)", value: toNumber(parsed.dribble?.betweenLegsRight), max: 10 },
      { label: "Chest Pass", value: toNumber(parsed.passing?.chestPass), max: 10 },
      { label: "Bounce Pass", value: toNumber(parsed.passing?.bouncePass), max: 10 },
      { label: "Overhead Pass", value: toNumber(parsed.passing?.overheadPass), max: 10 },
      { label: "Lay Up", value: toNumber(parsed.layUp), max: 10 },
      { label: "Shooting", value: toNumber(parsed.shooting), max: 10 },
    ],
    notes: typeof parsed.notes === "string" ? parsed.notes : "",
  };
}

async function getSessionActor() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }

  return session.user as SessionActor;
}

async function getPlayerReportRecord(playerId: string) {
  return prisma.player.findUnique({
    where: { id: playerId, isDeleted: false },
    select: {
      id: true,
      name: true,
      parentId: true,
      dateOfBirth: true,
      schoolOrigin: true,
      group: { select: { name: true } },
      statistic: {
        where: { status: "Published" },
        orderBy: { date: "desc" },
        take: MAX_STATISTICS,
        select: {
          date: true,
          metricsJson: true,
        },
      },
      attendance: {
        orderBy: { date: "desc" },
        take: MAX_ATTENDANCE,
        select: {
          status: true,
        },
      },
      certificate: {
        orderBy: { uploadedAt: "desc" },
        take: MAX_CERTIFICATES,
        select: {
          title: true,
          uploadedAt: true,
        },
      },
      _count: {
        select: {
          certificate: true,
          statistic: {
            where: { status: "Published" },
          },
        },
      },
    },
  });
}

function buildReportViewModel(player: PlayerReportRecord): ReportViewModel {
  const latestStat = player.statistic[0];
  const extractedMetrics = latestStat ? extractReportMetrics(latestStat.metricsJson) : { metrics: [], notes: "" };
  const totalAttendance = player.attendance.length;
  const hadirCount = player.attendance.filter((attendance) => attendance.status === "HADIR").length;
  const attendanceRate = totalAttendance > 0 ? ((hadirCount / totalAttendance) * 100).toFixed(0) : "N/A";
  const overallScore = extractedMetrics.metrics.length > 0
    ? (extractedMetrics.metrics.reduce((total, item) => total + item.value, 0) / extractedMetrics.metrics.length).toFixed(1)
    : "N/A";

  return {
    attendanceRateLabel: attendanceRate === "N/A" ? attendanceRate : `${attendanceRate}%`,
    age: getAge(player.dateOfBirth),
    certificates: player.certificate.map((certificate) => ({
      title: certificate.title,
      uploadedAtLabel: formatDate(certificate.uploadedAt, CERTIFICATE_DATE_FORMAT),
    })),
    coachNotes: extractedMetrics.notes,
    evaluationDateLabel: latestStat ? formatDate(latestStat.date, PRINT_DATE_FORMAT) : "Belum ada evaluasi",
    generatedAtLabel: formatDate(new Date(), PRINT_DATE_FORMAT),
    groupName: player.group?.name || "Tanpa Kelompok",
    latestMetrics: extractedMetrics.metrics,
    overallScoreLabel: overallScore,
    playerName: player.name,
    schoolOrigin: player.schoolOrigin || "-",
    totalCertificates: player._count.certificate,
    totalEvaluations: player._count.statistic,
  };
}

function renderMetricsSection(metrics: ReportMetricItem[]): string {
  if (metrics.length === 0) {
    return "";
  }

  const cards = metrics
    .map(
      (item) => `
    <div class="metric-card">
      <div class="metric-label">${escapeHtml(item.label)}</div>
      <div class="metric-value">${item.value}</div>
    </div>`,
    )
    .join("");

  return `
  <div class="section-title">Komposisi Kemampuan Terakhir</div>
  <div class="metrics-grid">${cards}
  </div>`;
}

function renderCoachNotes(notes: string): string {
  if (!notes) {
    return "";
  }

  return `
  <div class="section-title">Catatan Pelatih</div>
  <div class="notes-box">"${escapeHtml(notes)}"</div>`;
}

function renderCertificates(certificates: ReportViewModel["certificates"]): string {
  if (certificates.length === 0) {
    return "";
  }

  const items = certificates
    .map(
      (certificate) => `
    <div class="cert-item">
      <span class="cert-badge">Prestasi</span>
      ${escapeHtml(certificate.title)}
      <span style="margin-left:auto; color:#999; font-size:10px;">
        ${certificate.uploadedAtLabel}
      </span>
    </div>`,
    )
    .join("");

  return `
  <div class="section-title">Riwayat Sertifikat Prestasi</div>
  <div class="cert-list">${items}
  </div>`;
}

function renderReportHtml(viewModel: ReportViewModel): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Rapor ${escapeHtml(viewModel.playerName)} - ${REPORT_TITLE}</title>
  <style>${REPORT_STYLES}
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Simpan sebagai PDF</button>

  <div class="header">
    <div class="header-brand">ADORA <span>Basketball</span></div>
    <div class="header-meta">
      Portofolio Prestasi Pemain<br>
      Dicetak: ${viewModel.generatedAtLabel}
    </div>
  </div>

  <div class="player-info">
    <div class="player-name">${escapeHtml(viewModel.playerName)}</div>
    <div class="player-meta">
      <span>Kelompok: ${escapeHtml(viewModel.groupName)}</span>
      <span>Usia: ${viewModel.age} Tahun</span>
      <span>Sekolah: ${escapeHtml(viewModel.schoolOrigin)}</span>
      <span>Evaluasi: ${escapeHtml(viewModel.evaluationDateLabel)}</span>
    </div>
  </div>

  <div class="summary-row">
    <div class="summary-card">
      <div class="value">${viewModel.overallScoreLabel}</div>
      <div class="label">skor rata-rata</div>
    </div>
    <div class="summary-card">
      <div class="value">${viewModel.attendanceRateLabel}</div>
      <div class="label">tingkat kehadiran</div>
    </div>
    <div class="summary-card">
      <div class="value">${viewModel.totalEvaluations}</div>
      <div class="label">total evaluasi</div>
    </div>
    <div class="summary-card">
      <div class="value">${viewModel.totalCertificates}</div>
      <div class="label">sertifikat</div>
    </div>
  </div>
${renderMetricsSection(viewModel.latestMetrics)}
${renderCoachNotes(viewModel.coachNotes)}
${renderCertificates(viewModel.certificates)}

  <div class="footer">
    <span>Dokumen ini dibuat otomatis oleh sistem ${REPORT_TITLE}.</span>
    <span>&copy; ${new Date().getFullYear()} ${REPORT_TITLE}</span>
  </div>
</body>
</html>`;
}

export async function GET(req: NextRequest) {
  try {
    const actor = await getSessionActor();
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!actor.role || !ALLOWED_REPORT_ROLES.has(actor.role)) {
      return NextResponse.json({ error: "Tidak diizinkan mengakses laporan ini." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId");
    if (!playerId || !playerId.trim()) {
      return NextResponse.json({ error: "playerId is required" }, { status: 400 });
    }

    const player = await getPlayerReportRecord(playerId.trim());
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    if (actor.role === "PARENT" && player.parentId !== actor.id) {
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
