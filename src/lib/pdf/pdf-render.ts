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

export function renderMainTitle(doc: jsPDF, y: number, periodName: string): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text(`RAPOR ${periodName.toUpperCase()}`, PAGE_W / 2, y, { align: "center" });
  return y + 10;
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
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(75, 85, 99);
  doc.text("IDENTITAS PEMAIN", MARGIN, y);
  y += 6;

  const rows: { label: string; value: string; bold?: boolean }[] = [
    { label: "Nama Pemain", value: playerName.toUpperCase(), bold: true },
    { label: "Kelompok / Kelas", value: groupName.toUpperCase() },
    { label: "Sekolah Asal", value: schoolOrigin || "-" },
    { label: "Tanggal Cetak", value: printDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) },
  ];

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  rows.forEach((row) => {
    doc.setFont("helvetica", "normal");
    doc.text(`- ${row.label}: `, MARGIN, y);
    if (row.bold) doc.setFont("helvetica", "bold");
    doc.text(row.value, MARGIN + 35, y);
    y += 5;
  });

  return y + 4; // micro spacing
}

export function renderAssessmentTable(doc: jsPDF, y: number, metrics: MetricsJson): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(75, 85, 99);
  doc.text("POIN PENILAIAN", MARGIN, y);
  y += 4;

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
      [{ content: "Lay Up", styles: { halign: "center", fontStyle: "bold" } }, "Lay Up", { content: metrics.layUp, styles: { halign: "center" } }, { content: metrics.layUp, styles: { halign: "center", fontStyle: "bold", fontSize: 11 } }],
      [{ content: "Shooting", styles: { halign: "center", fontStyle: "bold" } }, "Shooting", { content: metrics.shooting, styles: { halign: "center" } }, { content: metrics.shooting, styles: { halign: "center", fontStyle: "bold", fontSize: 11 } }],
    ],
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 75 },
      2: { cellWidth: 25 },
      3: { cellWidth: CONTENT_W - 135 },
    },
    styles: {
      fontSize: 10,
      cellPadding: 3, // 6pt to 8pt equivalent
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    bodyStyles: {
      fillColor: false,
    },
    headStyles: {
      fillColor: false,
      textColor: 0,
      fontStyle: "bold",
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    theme: "plain", // removes vertical lines and borders
    didDrawCell: (data) => {
      // Draw horizontal line at bottom of each row
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.1);
      doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      if (data.row.index === 0 && data.section === 'head') {
        doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
      }
    }
  });

  return ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 12;
}

export function renderConclusionAndGrades(
  doc: jsPDF,
  y: number,
  info: { playerName: string; periodName: string; metrics: MetricsJson },
  addNewPage: () => number,
): number {
  const { playerName, periodName, metrics } = info;
  const score = averageScore(metrics);
  const grade = letterGrade(score);
  const notesText = metrics.notes?.trim() || `${playerName} telah menyelesaikan evaluasi pada periode ${periodName}. Nilai rata-rata menunjukkan performa ${grade.label.toLowerCase()} dengan skor akhir ${score}.`;
  if (y + 40 > PAGE_H - 45) {
    y = addNewPage();
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`HASIL PENILAIAN: ${grade.letter} (${grade.label.toUpperCase()})`, MARGIN, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("(A=Sangat Baik | B=Baik | C=Cukup Baik | D=Kurang Baik)", MARGIN, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(75, 85, 99);
  doc.text("KESIMPULAN PENILAIAN", MARGIN, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const splitNotes = doc.splitTextToSize(notesText, CONTENT_W);
  doc.text(splitNotes, MARGIN, y, { lineHeightFactor: 1.5 });

  return y + splitNotes.length * 5 + 8;
}

export function renderAchievements(
  doc: jsPDF,
  y: number,
  info: { attendanceRate?: number | null; certificates?: RaporData["certificates"] },
  addNewPage: () => number,
): number {
  const { attendanceRate, certificates } = info;
  const hasAttendance = typeof attendanceRate === "number";
  const certificateLines = certificates ?? [];

  if (!hasAttendance && certificateLines.length === 0) {
    return y;
  }

  if (y + 40 > PAGE_H - 45) {
    y = addNewPage();
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(75, 85, 99);
  doc.text("RINGKASAN PEMAIN", MARGIN, y);
  y += 6;

  if (hasAttendance) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Tingkat kehadiran: ${attendanceRate}%`, MARGIN, y);
    y += 6;
  }

  if (certificateLines.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Sertifikat:", MARGIN, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    certificateLines.forEach((c, i) => {
      doc.text(`${i + 1}. ${c.title}`, MARGIN + 4, y);
      y += 5;
    });
  }

  return y + 4;
}

export interface SignatureParam {
  assets?: RaporData["assets"];
  signers?: RaporData["signers"];
  printDate: Date;
}

export async function renderSignatureArea(doc: jsPDF, y: number, info: SignatureParam, addNewPage: () => number): Promise<number> {
  const { assets, signers, printDate } = info;
  const columnGap = 12;
  const columnWidth = (CONTENT_W - columnGap) / 2;
  const leftX = MARGIN;
  const rightX = MARGIN + columnWidth + columnGap;
  const blockHeight = 40;

  if (y + blockHeight > PAGE_H - 25) {
    y = addNewPage();
  }

  const dateStr = `Gandul, ${info.printDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(dateStr, MARGIN + CONTENT_W / 2, y, { align: "center" });
  y += 8;

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
  doc.setFontSize(10);
  doc.text("HEAD COACH", leftX + columnWidth / 2, y, { align: "center" });
  doc.text("CEO ADORA BBC", rightX + columnWidth / 2, y, { align: "center" });


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
  doc.setFontSize(10);
  doc.text(signers?.coachName ?? "Head Coach", leftX + columnWidth / 2, lineY, { align: "center" });
  const ceoName = signers?.ceoName ?? "CEO";
  doc.text(ceoName, rightX + columnWidth / 2, lineY, { align: "center" });
  
  // Footer text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text("PT ADORA INDONESIA JUARA", MARGIN + CONTENT_W / 2, PAGE_H - 10, { align: "center" });

  return PAGE_H;
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
      const contentPages = await templatePdf.embedPdf(contentPdf, contentPdf.getPageIndices());

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
