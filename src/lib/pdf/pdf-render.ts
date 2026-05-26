import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDFDocument } from "pdf-lib";
import { averageScore, dribbleTotal, letterGrade, passingTotal } from "@/lib/metrics";
import type { MetricsJson } from "@/types/dashboard";
import { toast } from "sonner";
import {
  PAGE_W, PAGE_H, MARGIN, CONTENT_W,
  SIG_BOX_H, STAMP_SIZE, SECTION_GAP,
  SECTION_TITLE_COLOR, PANEL_BORDER, TABLE_HEAD_FILL, TABLE_ACCENT_FILL,
  loadImageAsBase64, openPdfInNewTab, drawHorizontalRule, drawFitImage, drawSectionTitle, drawPanel
} from "./pdf-utils";
import type { RaporData } from "../generate-rapor-pdf";

export function renderDefaultTitle(doc: jsPDF, y: number, periodName: string): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("RAPOR PENILAIAN PEMAIN", PAGE_W / 2, y, { align: "center" });
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...SECTION_TITLE_COLOR);
  doc.text("ADORA Basketball Club", PAGE_W / 2, y, { align: "center" });
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(periodName.toUpperCase(), PAGE_W / 2, y, { align: "center" });
  y += 4;

  drawHorizontalRule(doc, y, 0.6, 180);
  return y + 7;
}

export interface PlayerInfoParam {
  playerName: string;
  groupName: string;
  periodName: string;
  schoolOrigin?: string | null;
  printDate: Date;
}

export function renderPlayerInfo(doc: jsPDF, y: number, info: PlayerInfoParam): number {
  const { playerName, groupName, periodName, schoolOrigin, printDate } = info;
  const rows: [string, string][] = [
    ["Nama", playerName],
    ["Kelompok", groupName],
    ["Periode Evaluasi", periodName],
  ];

  if (schoolOrigin) rows.push(["Sekolah Asal", schoolOrigin]);
  rows.push(["Tanggal Cetak", printDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })]);

  const perCol = Math.ceil(rows.length / 2);
  const panelHeight = 28 + Math.max(0, rows.length - 4) * 6;
  const labelWidth = 28;
  const colGap = 10;
  const colX = [MARGIN + 8, MARGIN + CONTENT_W / 2 + colGap / 2];

  drawPanel(doc, MARGIN, y, CONTENT_W, panelHeight);

  rows.forEach(([label, value], index) => {
    const columnIndex = index < perCol ? 0 : 1;
    const rowIndex = columnIndex === 0 ? index : index - perCol;
    const baseX = colX[columnIndex];
    const rowY = y + 8 + rowIndex * 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(label, baseX, rowY);
    doc.setFont("helvetica", "normal");
    doc.text(`: ${value}`, baseX + labelWidth, rowY);
  });

  return y + panelHeight + SECTION_GAP;
}

export function renderAssessmentTable(doc: jsPDF, y: number, metrics: MetricsJson): number {
  drawSectionTitle(doc, "POIN PENILAIAN", y);
  y += 3;

  const dribTotal = dribbleTotal(metrics.dribble);
  const passTotal = passingTotal(metrics.passing);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: CONTENT_W,
    head: [[
      { content: "Kategori", styles: { halign: "center" } },
      { content: "Jenis Penilaian", styles: { halign: "center" } },
      { content: "Nilai", styles: { halign: "center" } },
      { content: "Total Kategori", styles: { halign: "center" } },
    ]],
    body: [
      [{ content: "Dribble", rowSpan: 6, styles: { valign: "middle", halign: "center", fontStyle: "bold" } }, "In & Out Dribble", { content: metrics.dribble.inAndOut, styles: { halign: "center" } }, { content: dribTotal, rowSpan: 6, styles: { valign: "middle", halign: "center", fontStyle: "bold", fontSize: 11 } }],
      ["Crossover", { content: metrics.dribble.crossover, styles: { halign: "center" } }],
      ["V Dribble (Kiri)", { content: metrics.dribble.vLeft, styles: { halign: "center" } }],
      ["V Dribble (Kanan)", { content: metrics.dribble.vRight, styles: { halign: "center" } }],
      ["Between Legs (Kiri)", { content: metrics.dribble.betweenLegsLeft, styles: { halign: "center" } }],
      ["Between Legs (Kanan)", { content: metrics.dribble.betweenLegsRight, styles: { halign: "center" } }],
      [{ content: "Passing", rowSpan: 3, styles: { valign: "middle", halign: "center", fontStyle: "bold" } }, "Chest Pass", { content: metrics.passing.chestPass, styles: { halign: "center" } }, { content: passTotal, rowSpan: 3, styles: { valign: "middle", halign: "center", fontStyle: "bold", fontSize: 11 } }],
      ["Bounce Pass", { content: metrics.passing.bouncePass, styles: { halign: "center" } }],
      ["Overhead Pass", { content: metrics.passing.overheadPass, styles: { halign: "center" } }],
      [{ content: "Lay Up", styles: { halign: "center", fontStyle: "bold", fillColor: TABLE_ACCENT_FILL } }, "Lay Up", { content: metrics.layUp, styles: { halign: "center" } }, { content: metrics.layUp, styles: { halign: "center", fontStyle: "bold", fontSize: 11, fillColor: TABLE_ACCENT_FILL } }],
      [{ content: "Shooting", styles: { halign: "center", fontStyle: "bold" } }, "Shooting", { content: metrics.shooting, styles: { halign: "center" } }, { content: metrics.shooting, styles: { halign: "center", fontStyle: "bold", fontSize: 11 } }],
    ],
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 80 },
      2: { cellWidth: 25 },
      3: { cellWidth: CONTENT_W - 135 },
    },
    styles: {
      fontSize: 9,
      cellPadding: 2.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: TABLE_HEAD_FILL,
      textColor: 0,
      fontStyle: "bold",
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
    },
    theme: "grid",
  });

  return ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 2;
}

export function renderConclusionAndGrades(
  doc: jsPDF,
  y: number,
  info: { playerName: string; periodName: string; metrics: MetricsJson },
  addNewPage: () => void,
): number {
  const { playerName, periodName, metrics } = info;
  const score = averageScore(metrics);
  const grade = letterGrade(score);
  const notesText = metrics.notes?.trim() || `${playerName} telah menyelesaikan evaluasi pada periode ${periodName}. Nilai rata-rata menunjukkan performa ${grade.label.toLowerCase()} dengan skor akhir ${score}.`;
  const scales = [
    { l: "A", d: "SANGAT BAIK" },
    { l: "B", d: "BAIK" },
    { l: "C", d: "CUKUP BAIK" },
    { l: "D", d: "KURANG BAIK" },
  ];

  const leftWidth = 114;
  const rightWidth = CONTENT_W - leftWidth - 8;
  const splitNotes = doc.splitTextToSize(notesText, leftWidth - 12);
  const noteHeight = Math.max(40, 18 + splitNotes.length * 4.2 + scales.length * 4.1);
  const gradeHeight = 38;
  const blockHeight = Math.max(noteHeight, gradeHeight);

  if (y + 4 + blockHeight > PAGE_H - 45) {
    addNewPage();
    y = MARGIN;
  }

  drawSectionTitle(doc, "KESIMPULAN PENILAIAN", y);
  y += 4;

  drawPanel(doc, MARGIN, y, leftWidth, blockHeight);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(splitNotes, MARGIN + 6, y + 9);

  const legendY = y + 13 + splitNotes.length * 4.2;
  doc.setDrawColor(...PANEL_BORDER);
  doc.setLineWidth(0.25);
  doc.line(MARGIN + 6, legendY, MARGIN + leftWidth - 6, legendY);
  doc.setDrawColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("KETERANGAN", MARGIN + 6, legendY + 5);
  scales.forEach((scale, index) => {
    doc.setFont("helvetica", scale.l === grade.letter ? "bold" : "normal");
    doc.text(`${scale.l} = ${scale.d}`, MARGIN + 6, legendY + 10 + index * 4.1);
  });

  const gradeX = MARGIN + leftWidth + 8;
  drawPanel(doc, gradeX, y, rightWidth, blockHeight);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...SECTION_TITLE_COLOR);
  doc.text("HASIL PENILAIAN", gradeX + rightWidth / 2, y + 7, { align: "center" });
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(28);
  doc.text(grade.letter, gradeX + rightWidth / 2, y + 21, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${grade.label} - ${score}`, gradeX + rightWidth / 2, y + 29, { align: "center" });

  return y + blockHeight + SECTION_GAP;
}

export function renderAchievements(
  doc: jsPDF,
  y: number,
  info: { attendanceRate?: number | null; certificates?: RaporData["certificates"] },
  addNewPage: () => void,
): number {
  const { attendanceRate, certificates } = info;
  const hasAttendance = typeof attendanceRate === "number";
  const hasCertificates = Boolean(certificates?.length);

  if (!hasAttendance && !hasCertificates) {
    return y;
  }

  const certificateLines = certificates?.flatMap((certificate, index) => {
    const dateLabel = certificate.uploadedAt
      ? new Date(certificate.uploadedAt).toLocaleDateString("id-ID", { month: "short", year: "numeric" })
      : null;

    return doc.splitTextToSize(`${index + 1}. ${certificate.title}${dateLabel ? ` (${dateLabel})` : ""}`, CONTENT_W - 14);
  }) ?? [];

  const attendanceHeight = hasAttendance ? 16 : 0;
  const certificateHeight = hasCertificates ? Math.max(16, certificateLines.length * 4.2 + 10) : 0;
  const panelHeight = 8 + attendanceHeight + certificateHeight;

  if (y + panelHeight > PAGE_H - 48) {
    addNewPage();
    y = MARGIN;
  }

  drawSectionTitle(doc, "RINGKASAN PEMAIN", y);
  y += 4;
  drawPanel(doc, MARGIN, y, CONTENT_W, panelHeight);
  y += 8;

  if (hasAttendance) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...SECTION_TITLE_COLOR);
    doc.text("KEHADIRAN", MARGIN + 6, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Tingkat kehadiran pemain selama periode ini: ${attendanceRate}%`, MARGIN + 36, y);
    y += 6;
  }

  if (!hasCertificates) {
    return y + SECTION_GAP + 4;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...SECTION_TITLE_COLOR);
  doc.text("RIWAYAT SERTIFIKAT", MARGIN + 6, y);
  doc.setTextColor(0, 0, 0);
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(certificateLines, MARGIN + 6, y);

  return y + certificateLines.length * 4.2 + SECTION_GAP;
}

export interface SignatureParam {
  assets?: RaporData["assets"];
  signers?: RaporData["signers"];
  printDate: Date;
}

export async function renderSignatureArea(doc: jsPDF, y: number, info: SignatureParam, addNewPage: () => void): Promise<number> {
  const { assets, signers, printDate } = info;
  const columnGap = 12;
  const columnWidth = (CONTENT_W - columnGap) / 2;
  const leftX = MARGIN;
  const rightX = MARGIN + columnWidth + columnGap;
  const blockHeight = 34;

  if (y + blockHeight > PAGE_H - 18) {
    addNewPage();
    y = MARGIN;
  }

  const dateStr = printDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Gandul, ${dateStr}`, PAGE_W - MARGIN, y, { align: "right" });
  y += 4;

  const renderSingle = async (url: string | undefined, x: number, yPos: number, width: number, height: number, isStamp = false) => {
    if (!url || url.toLowerCase().endsWith(".pdf")) return;

    try {
      const { data: b64, format } = await loadImageAsBase64(url);
      if (isStamp) {
        doc.addImage(b64, format, PAGE_W / 2 - STAMP_SIZE / 2, yPos + 1, STAMP_SIZE, STAMP_SIZE);
        return;
      }

      drawFitImage(doc, b64, format, x, yPos, width, height);
    } catch (error) {
      console.error("[PDF Gen] Error rendering signature asset:", error);
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...SECTION_TITLE_COLOR);
  doc.text("HEAD COACH", leftX + columnWidth / 2, y + 4, { align: "center" });
  doc.text("CEO ADORA BBC", rightX + columnWidth / 2, y + 4, { align: "center" });
  doc.setTextColor(0, 0, 0);

  await Promise.all([
    renderSingle(assets?.coachSignUrl, leftX + 8, y + 1, columnWidth - 16, SIG_BOX_H),
    renderSingle(assets?.ceoSignUrl, rightX + 8, y + 1, columnWidth - 16, SIG_BOX_H),
    renderSingle(assets?.stampUrl, 0, y + 1, STAMP_SIZE, STAMP_SIZE, true),
  ]);

  const lineY = y + 24;
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.3);
  doc.line(leftX, lineY, leftX + columnWidth, lineY);
  doc.line(rightX, lineY, rightX + columnWidth, lineY);
  doc.setDrawColor(0, 0, 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(signers?.coachName ?? "Head Coach", leftX + columnWidth / 2, lineY + 5, { align: "center" });
  doc.text(signers?.ceoName ?? "CEO", rightX + columnWidth / 2, lineY + 5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("ADORA Basketball Club", leftX + columnWidth / 2, lineY + 9, { align: "center" });
  doc.text("ADORA Basketball Club", rightX + columnWidth / 2, lineY + 9, { align: "center" });

  return lineY + 12;
}

export interface FinalizeParam {
  isPdfTemplate?: boolean;
  headerUrl?: string;
  playerName: string;
  periodName: string;
  action?: "download" | "preview";
}

export async function finalizePDF(doc: jsPDF, info: FinalizeParam) {
  const { isPdfTemplate, headerUrl, playerName, periodName, action = "download" } = info;
  const fileName = action === "preview"
    ? "Pratinjau_Rapor_Template.pdf"
    : `Rapor_${playerName.replace(/\s+/g, "_")}_${periodName.replace(/\s+/g, "_")}.pdf`;

  if (isPdfTemplate && headerUrl) {
    try {
      const pdfBytes = doc.output("arraybuffer");
      const contentPdf = await PDFDocument.load(pdfBytes);
      const fetchUrl = headerUrl.includes("?") ? `${headerUrl}&t=${Date.now()}` : `${headerUrl}?t=${Date.now()}`;
      const templateRes = await fetch(fetchUrl);

      if (!templateRes.ok) {
        throw new Error(`Gagal mengunduh template (HTTP ${templateRes.status})`);
      }

      const templatePdf = await PDFDocument.load(await templateRes.arrayBuffer());
      const [templatePage] = templatePdf.getPages();
      const contentPages = await templatePdf.embedPdf(contentPdf);

      const blankTemplates = [];
      if (contentPages.length > 1) {
        blankTemplates.push(...await templatePdf.copyPages(templatePdf, Array(contentPages.length - 1).fill(0)));
      }

      templatePage.drawPage(contentPages[0], {
        x: 0,
        y: 0,
        width: templatePage.getWidth(),
        height: templatePage.getHeight(),
      });

      for (let index = 1; index < contentPages.length; index++) {
        const newPage = blankTemplates[index - 1];
        templatePdf.addPage(newPage);
        newPage.drawPage(contentPages[index], {
          x: 0,
          y: 0,
          width: newPage.getWidth(),
          height: newPage.getHeight(),
        });
      }

      const merged = await templatePdf.save();
      const file = new File([merged.buffer as BlobPart], fileName, { type: "application/pdf" });

      if (action === "preview") {
        openPdfInNewTab(file);
        return;
      }

      const link = document.createElement("a");
      link.href = URL.createObjectURL(file);
      link.download = fileName;
      link.click();
      return;
    } catch (error) {
      console.error("[PDF Gen] PDF overlay failed, fallback to standard", error);
      toast.error(`Gagal menerapkan template latar belakang: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  if (action === "preview") {
    const blob = doc.output("blob");
    const file = new File([blob], fileName, { type: "application/pdf" });
    openPdfInNewTab(file);
    return;
  }

  doc.save(fileName);
}
