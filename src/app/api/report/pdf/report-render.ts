import type { ReportMetricItem, ReportViewModel } from "./report-data";

const REPORT_TITLE = "ADORA Basketball Club";

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

  @media (max-width: 720px) {
    body { padding: 20px; }
    .header,
    .summary-row,
    .footer {
      flex-direction: column;
      align-items: flex-start;
    }

    .metrics-grid {
      grid-template-columns: 1fr;
    }

    .player-meta {
      gap: 10px;
    }
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

`;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
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

export function renderReportHtml(viewModel: ReportViewModel): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Rapor ${escapeHtml(viewModel.playerName)} - ${REPORT_TITLE}</title>
  <style>${REPORT_STYLES}
  </style>
</head>
<body>
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
