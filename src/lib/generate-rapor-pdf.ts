import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDFDocument } from "pdf-lib";
import {
  averageScore,
  letterGrade,
  dribbleTotal,
  passingTotal,
} from "@/lib/metrics";
import type { MetricsJson } from "@/types/dashboard";

export interface RaporData {
  playerName: string;
  groupName: string;
  schoolOrigin?: string | null;
  periodName: string;
  metrics: MetricsJson;
  printDate?: Date;
  assets?: {
    headerUrl?: string;
    ceoSignUrl?: string;
    coachSignUrl?: string;
    stampUrl?: string;
  };
}

/**
 * Generates and downloads a PDF rapor (report card) for a single player.
 * Uses the custom ADORA assets if provided, otherwise falls back to default text.
 */
export async function generateRaporPDF(data: RaporData): Promise<void> {
  const {
    playerName,
    groupName,
    schoolOrigin,
    periodName,
    metrics,
    printDate = new Date(),
    assets,
  } = data;

  const score = averageScore(metrics);
  const grade = letterGrade(score);
  const dribTotal = dribbleTotal(metrics.dribble);
  const passTotal = passingTotal(metrics.passing);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PAGE_W = 210;
  const MARGIN = 20;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  let y = MARGIN;

  // ─── Helper: Load Image ───────────────────────────────
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
    });
  };

  // ─── HEADER BLOCK ─────────────────────────────────────
  const isPdfTemplate = assets?.headerUrl?.toLowerCase().endsWith(".pdf");

  if (isPdfTemplate) {
    // Skip header rendering in jsPDF, it will be overlaid later.
    // We just need to move Y down to avoid the template's header area.
    y += 45; 
  } else if (assets?.headerUrl) {
    try {
      const headerImg = await loadImage(assets.headerUrl);
      const imgProps = doc.getImageProperties(headerImg);
      const imgH = (imgProps.height * CONTENT_W) / imgProps.width;
      doc.addImage(headerImg, "PNG", MARGIN, y, CONTENT_W, imgH);
      y += imgH + 5;
    } catch (e) {
      console.error("Failed to load header image", e);
      y = renderDefaultTitle(doc, periodName, y, PAGE_W);
    }
  } else {
    y = renderDefaultTitle(doc, periodName, y, PAGE_W);
  }

  function renderDefaultTitle(pdf: jsPDF, pName: string, yPos: number, pW: number) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("RAPOR PENILAIAN PEMAIN", pW / 2, yPos, { align: "center" });
    yPos += 6;
    pdf.setFontSize(11);
    pdf.text(pName.toUpperCase(), pW / 2, yPos, { align: "center" });
    yPos += 5;
    line(pdf, yPos, 0.8);
    line(pdf, yPos + 0.8, 0.3);
    return yPos + 6;
  }

  function line(pdf: jsPDF, yPos: number, weight = 0.3) {
    pdf.setDrawColor(0);
    pdf.setLineWidth(weight);
    pdf.line(MARGIN, yPos, PAGE_W - MARGIN, yPos);
  }

  // ─── PLAYER INFO ──────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const infoRows: [string, string][] = [
    ["Nama", playerName],
    ["Kelompok", groupName],
  ];
  if (schoolOrigin) infoRows.push(["Sekolah Asal", schoolOrigin]);
  infoRows.push([
    "Tanggal Cetak",
    printDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  ]);

  const labelW = 32;
  infoRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.text(`: ${value}`, MARGIN + labelW, y);
    y += 5;
  });

  y += 3;

  // ─── SECTION: POIN PENILAIAN ──────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("POIN PENILAIAN", MARGIN, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: CONTENT_W,
    head: [
      [
        { content: "Kategori", styles: { halign: "center" } },
        { content: "Jenis Penilaian", styles: { halign: "center" } },
        { content: "Nilai", styles: { halign: "center" } },
        { content: "Total Kategori", styles: { halign: "center" } },
      ],
    ],
    body: [
      [
        { content: "Dribble", rowSpan: 6, styles: { valign: "middle", halign: "center", fontStyle: "bold" } },
        "In & Out Dribble",
        { content: metrics.dribble.inAndOut, styles: { halign: "center" } },
        { content: dribTotal, rowSpan: 6, styles: { valign: "middle", halign: "center", fontStyle: "bold", fontSize: 11 } },
      ],
      ["Crossover", { content: metrics.dribble.crossover, styles: { halign: "center" } }],
      ["V Dribble (Kiri)", { content: metrics.dribble.vLeft, styles: { halign: "center" } }],
      ["V Dribble (Kanan)", { content: metrics.dribble.vRight, styles: { halign: "center" } }],
      ["Between Legs (Kiri)", { content: metrics.dribble.betweenLegsLeft, styles: { halign: "center" } }],
      ["Between Legs (Kanan)", { content: metrics.dribble.betweenLegsRight, styles: { halign: "center" } }],
      [
        { content: "Passing", rowSpan: 3, styles: { valign: "middle", halign: "center", fontStyle: "bold" } },
        "Chest Pass",
        { content: metrics.passing.chestPass, styles: { halign: "center" } },
        { content: passTotal, rowSpan: 3, styles: { valign: "middle", halign: "center", fontStyle: "bold", fontSize: 11 } },
      ],
      ["Bounce Pass", { content: metrics.passing.bouncePass, styles: { halign: "center" } }],
      ["Overhead Pass", { content: metrics.passing.overheadPass, styles: { halign: "center" } }],
      [
        { content: "Lay Up", styles: { halign: "center", fontStyle: "bold" } },
        "—",
        { content: metrics.layUp, styles: { halign: "center" } },
        { content: metrics.layUp, styles: { halign: "center", fontStyle: "bold", fontSize: 11 } },
      ],
      [
        { content: "Shooting", styles: { halign: "center", fontStyle: "bold" } },
        "—",
        { content: metrics.shooting, styles: { halign: "center" } },
        { content: metrics.shooting, styles: { halign: "center", fontStyle: "bold", fontSize: 11 } },
      ],
    ],
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 80 },
      2: { cellWidth: 25 },
      3: { cellWidth: CONTENT_W - 135 },
    },
    styles: { fontSize: 9, cellPadding: 2.5, lineColor: [0, 0, 0], lineWidth: 0.2 },
    headStyles: { fillColor: [210, 210, 210], textColor: 0, fontStyle: "bold", lineColor: [0, 0, 0], lineWidth: 0.2 },
    theme: "grid",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 7;

  // ─── SECTION: KESIMPULAN ──────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("KESIMPULAN PENILAIAN", MARGIN, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const notesRaw = metrics.notes?.trim();
  const notesText =
    notesRaw ||
    `${playerName} telah menyelesaikan evaluasi pada periode ${periodName}. ` +
      `Nilai rata-rata yang diperoleh menunjukkan performa ${grade.label.toLowerCase()} ` +
      `dengan skor akhir ${score} dari 100.`;

  const splitNotes = doc.splitTextToSize(notesText, CONTENT_W);
  doc.text(splitNotes, MARGIN, y);
  y += splitNotes.length * 4.5 + 6;

  // ─── SECTION: KETERANGAN + HASIL ─────────────────────
  const colLeft = MARGIN;
  const colRight = PAGE_W / 2 + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("KETERANGAN", colLeft, y);
  doc.text("HASIL PENILAIAN", colRight, y);
  y += 5;

  const gradeScale = [
    { letter: "A", label: "SANGAT BAIK" },
    { letter: "B", label: "BAIK" },
    { letter: "C", label: "CUKUP BAIK" },
    { letter: "D", label: "KURANG BAIK" },
  ];
  gradeScale.forEach((g, i) => {
    doc.setFont("helvetica", g.letter === grade.letter ? "bold" : "normal");
    doc.setFontSize(9);
    doc.text(`${g.letter}  =  ${g.label}`, colLeft, y + i * 5);
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(40);
  doc.text(grade.letter, colRight + 15, y + 10, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`(${grade.label})`, colRight + 15, y + 17, { align: "center" });

  y += 30;

  // ─── SIGNATURE BLOCK ──────────────────────────────────
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 5;

  const dateStr = printDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Gandul, ${dateStr}`, PAGE_W / 2, y, { align: "center" });
  y += 5; // Start of signature area

  const sigLeft = MARGIN + 10;
  const sigRight = PAGE_W - MARGIN - 55;

  // Render Signatures and Stamp
  if (assets?.ceoSignUrl || assets?.coachSignUrl || assets?.stampUrl) {
    try {
      const [ceoImg, coachImg, stampImg] = await Promise.all([
        assets.ceoSignUrl ? loadImage(assets.ceoSignUrl) : null,
        assets.coachSignUrl ? loadImage(assets.coachSignUrl) : null,
        assets.stampUrl ? loadImage(assets.stampUrl) : null,
      ]);

      if (coachImg && !assets.coachSignUrl?.endsWith(".pdf")) doc.addImage(coachImg, "PNG", sigLeft + 5, y, 30, 15);
      if (ceoImg && !assets.ceoSignUrl?.endsWith(".pdf")) doc.addImage(ceoImg, "PNG", sigRight + 5, y, 30, 15);
      if (stampImg && !assets.stampUrl?.endsWith(".pdf")) doc.addImage(stampImg, "PNG", PAGE_W / 2 - 12.5, y - 5, 25, 25);
    } catch (e) {
      console.error("Failed to load signature/stamp assets", e);
    }
  }

  y += 18; // move to name lines

  doc.setDrawColor(100);
  doc.setLineWidth(0.3);
  doc.line(sigLeft, y, sigLeft + 45, y);
  doc.line(sigRight, y, sigRight + 45, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Danuri Akbar", sigLeft, y + 5);
  doc.text("M. Arief, S.Ak", sigRight, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Head Coach", sigLeft, y + 9);
  doc.text("CEO Adora Basketball Club", sigRight, y + 9);

  const safePeriod = periodName.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_");
  const safeName = playerName.replace(/\s+/g, "_");
  const fileName = `Rapor_${safeName}_${safePeriod}.pdf`;

  // ─── PDF OVERLAY LOGIC (FOR PDF TEMPLATES) ────────────
  if (assets?.headerUrl?.toLowerCase().endsWith(".pdf")) {
    try {
      const pdfBytes = doc.output("arraybuffer");
      const contentPdf = await PDFDocument.load(pdfBytes);
      
      const templateRes = await fetch(assets.headerUrl);
      const templateBytes = await templateRes.arrayBuffer();
      const templatePdf = await PDFDocument.load(templateBytes);

      // Embed the first page of the content (jsPDF) onto the first page of the template
      const [templatePage] = templatePdf.getPages();
      const [contentPage] = await templatePdf.embedPdf(contentPdf);
      
      // Draw content over template. 
      // We assume both are A4. jsPDF units are mm, pdf-lib are points (1mm = 2.83465 pts)
      templatePage.drawPage(contentPage, {
        x: 0,
        y: 0,
        width: templatePage.getWidth(),
        height: templatePage.getHeight(),
      });

      const mergedPdfBytes = await templatePdf.save();
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      return;
    } catch (e) {
      console.error("Failed to overlay PDF template, falling back to standard PDF", e);
    }
  }

  // Standard Download
  doc.save(fileName);
}
