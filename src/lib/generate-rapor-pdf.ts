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
import { toast } from "sonner";

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
  signers?: {
    coachName?: string;
    ceoName?: string;
  };
  action?: "download" | "preview";
}

// ─── UTILITIES ──────────────────────────────────────────

const loadImageAsBase64 = async (url: string): Promise<{ data: string; format: string }> => {
  try {
    const fetchUrl = url.includes("?") ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;
    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const format = blob.type.split("/")[1]?.toUpperCase() || "PNG";
        resolve({ data: base64data, format });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`[PDF Gen] Failed to fetch image: ${url}`, error);
    throw error;
  }
};

// ─── GEOMETRY & CONSTANTS ────────────────────────────────

const PAGE_W  = 210;
const MARGIN  = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;

const HEADER_MAX_H       = 35;
const HEADER_BOTTOM_TRIM = 8;
const HEADER_SEP_GAP     = 4;
const PDF_TEMPLATE_SKIP  = 25;

const SIG_BOX_W  = 55;
const SIG_BOX_H  = 40;
const SIG_GAP    = 30;
const STAMP_SIZE = 30;

const sigLeftX  = MARGIN + 10;
const sigRightX = PAGE_W - MARGIN - SIG_BOX_W - 10;

// ─── RENDERING HELPERS ──────────────────────────────────

function drawHorizontalRule(doc: jsPDF, y: number, weight = 0.3, color = 0) {
  doc.setDrawColor(color);
  doc.setLineWidth(weight);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  doc.setDrawColor(0);
}

function drawFitImage(doc: jsPDF, base64: string, format: string, x: number, y: number, w: number, h: number) {
  const props = doc.getImageProperties(base64);
  let finalW = w;
  let finalH = (props.height * finalW) / props.width;
  if (finalH > h) { 
    finalH = h; 
    finalW = (props.width * finalH) / props.height; 
  }
  const dx = x + (w - finalW) / 2;
  const dy = y + h - finalH;
  doc.addImage(base64, format, dx, dy, finalW, finalH);
}

// ─── MAIN ENGINE ────────────────────────────────────────

export async function generateRaporPDF(data: RaporData): Promise<void> {
  const {
    playerName,
    groupName,
    schoolOrigin,
    periodName,
    metrics,
    printDate = new Date(),
    assets,
    signers,
  } = data;

  console.log("[PDF Gen] Starting with assets:", assets);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = MARGIN;

  // To support full-page PNG backgrounds across multiple pages
  let fullPageBg: { data: string; format: string } | null = null;
  const addNewPage = () => {
    doc.addPage();
    if (fullPageBg) {
      doc.addImage(fullPageBg.data, fullPageBg.format, 0, 0, PAGE_W, 297);
    }
  };

  // 1. HEADER
  const isPdfTemplate = assets?.headerUrl ? assets.headerUrl.split("?")[0].toLowerCase().endsWith(".pdf") : false;
  if (isPdfTemplate) {
    y += PDF_TEMPLATE_SKIP;
  } else if (assets?.headerUrl) {
    try {
      const img = await loadImageAsBase64(assets.headerUrl);
      const props = doc.getImageProperties(img.data);
      
      // Jika gambar portrait (tinggi > lebar), jadikan full-page background
      if (props.height > props.width) {
        fullPageBg = img;
        doc.addImage(img.data, img.format, 0, 0, PAGE_W, 297);
        y += PDF_TEMPLATE_SKIP;
      } else {
        // Jika landscape, jadikan Kop Surat kecil di atas
        let imgW = CONTENT_W;
        let imgH = (props.height * imgW) / props.width;
        if (imgH > HEADER_MAX_H) {
          imgH = HEADER_MAX_H;
          imgW = (props.width * imgH) / props.height;
        }
        const drawX = MARGIN + (CONTENT_W - imgW) / 2;
        doc.addImage(img.data, img.format, drawX, y, imgW, imgH);
        y += imgH - HEADER_BOTTOM_TRIM;
        drawHorizontalRule(doc, y, 0.3, 180);
        y += HEADER_SEP_GAP;
      }
    } catch {
      y = renderDefaultTitle(doc, y, periodName);
    }
  } else {
    y = renderDefaultTitle(doc, y, periodName);
  }

  // 2. PLAYER INFO
  y = renderPlayerInfo(doc, y, { playerName, groupName, periodName, schoolOrigin, printDate });

  // 3. ASSESSMENT TABLE
  y = renderAssessmentTable(doc, y, metrics);

  // 4. CONCLUSION & GRADES
  y = renderConclusionAndGrades(doc, y, { playerName, periodName, metrics });

  // 5. SIGNATURE AREA
  y = await renderSignatureArea(doc, y, { assets, signers, printDate }, addNewPage);

  // 6. DOWNLOAD / OVERLAY
  await finalizePDF(doc, { isPdfTemplate, headerUrl: assets?.headerUrl, playerName, periodName, action: data.action });
}

// ─── SUB-RENDERERS ──────────────────────────────────────

function renderDefaultTitle(doc: jsPDF, y: number, periodName: string): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("RAPOR PENILAIAN PEMAIN", PAGE_W / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(11);
  doc.text(periodName.toUpperCase(), PAGE_W / 2, y, { align: "center" });
  y += 5;
  drawHorizontalRule(doc, y, 0.8);
  drawHorizontalRule(doc, y + 0.8, 0.3);
  return y + 6;
}

interface PlayerInfoParam {
  playerName: string;
  groupName: string;
  periodName: string;
  schoolOrigin?: string | null;
  printDate: Date;
}

function renderPlayerInfo(doc: jsPDF, y: number, info: PlayerInfoParam): number {
  const { playerName, groupName, periodName, schoolOrigin, printDate } = info;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  const rows: [string, string][] = [
    ["Nama", playerName],
    ["Kelompok", groupName],
    ["Periode Evaluasi", periodName],
  ];
  if (schoolOrigin) rows.push(["Sekolah Asal", schoolOrigin]);
  rows.push(["Tanggal Cetak", printDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })]);

  const LABEL_W = 35;
  rows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.text(`: ${value}`, MARGIN + LABEL_W, y);
    y += 5;
  });
  return y + 3;
}

function renderAssessmentTable(doc: jsPDF, y: number, metrics: MetricsJson): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("POIN PENILAIAN", MARGIN, y);
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
      [{ content: "Lay Up", styles: { halign: "center", fontStyle: "bold" } }, "Lay Up", { content: metrics.layUp, styles: { halign: "center" } }, { content: metrics.layUp, styles: { halign: "center", fontStyle: "bold", fontSize: 11 } }],
      [{ content: "Shooting", styles: { halign: "center", fontStyle: "bold" } }, "Shooting", { content: metrics.shooting, styles: { halign: "center" } }, { content: metrics.shooting, styles: { halign: "center", fontStyle: "bold", fontSize: 11 } }],
    ],
    columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 80 }, 2: { cellWidth: 25 }, 3: { cellWidth: CONTENT_W - 135 } },
    styles: { fontSize: 9, cellPadding: 2.5, lineColor: [0, 0, 0], lineWidth: 0.2 },
    headStyles: { fillColor: [210, 210, 210], textColor: 0, fontStyle: "bold", lineColor: [0, 0, 0], lineWidth: 0.2 },
    theme: "grid",
  });

  return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
}

interface ConclusionParam {
  playerName: string;
  periodName: string;
  metrics: MetricsJson;
}

function renderConclusionAndGrades(doc: jsPDF, y: number, info: ConclusionParam): number {
  const { playerName, periodName, metrics } = info;
  const score = averageScore(metrics);
  const grade = letterGrade(score);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("KESIMPULAN PENILAIAN", MARGIN, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const notesText = metrics.notes?.trim() || `${playerName} telah menyelesaikan evaluasi pada periode ${periodName}. Nilai rata-rata menunjukkan performa ${grade.label.toLowerCase()} dengan skor akhir ${score}.`;
  const splitNotes = doc.splitTextToSize(notesText, CONTENT_W);
  
  if (y + splitNotes.length * 4.5 > 275) {
    addNewPage();
    y = MARGIN;
  }

  doc.text(splitNotes, MARGIN, y);
  y += splitNotes.length * 4.5 + 6;

  const colLeft  = MARGIN;
  const colRight = PAGE_W / 2 + 10;
  doc.setFont("helvetica", "bold");
  doc.text("KETERANGAN", colLeft, y);
  doc.text("HASIL PENILAIAN", colRight, y);
  y += 5;

  const scales = [{ l: "A", d: "SANGAT BAIK" }, { l: "B", d: "BAIK" }, { l: "C", d: "CUKUP BAIK" }, { l: "D", d: "KURANG BAIK" }];
  scales.forEach((s, i) => {
    doc.setFont("helvetica", s.l === grade.letter ? "bold" : "normal");
    doc.text(`${s.l}  =  ${s.d}`, colLeft, y + i * 5);
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(40);
  doc.text(grade.letter, colRight + 15, y + 10, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`(${grade.label})`, colRight + 15, y + 17, { align: "center" });

  return y + 20;
}

interface SignatureParam {
  assets?: RaporData["assets"];
  signers?: RaporData["signers"];
  printDate: Date;
}

async function renderSignatureArea(doc: jsPDF, y: number, info: SignatureParam, addNewPage: () => void): Promise<number> {
  const { assets, signers, printDate } = info;
  
  if (y + SIG_BOX_H + 20 > 285) {
    addNewPage();
    y = MARGIN;
  }

  drawHorizontalRule(doc, y, 0.3);
  y += 5;

  const dateStr = printDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Gandul, ${dateStr}`, PAGE_W / 2, y, { align: "center" });
  y += 5;

  const renderSingle = async (url: string | undefined, x: number, yPos: number, isStamp = false) => {
    if (!url || url.toLowerCase().endsWith(".pdf")) return;
    try {
      const { data: b64, format } = await loadImageAsBase64(url);
      if (isStamp) {
        doc.addImage(b64, format, PAGE_W / 2 - STAMP_SIZE / 2, yPos + 5, STAMP_SIZE, STAMP_SIZE);
      } else {
        drawFitImage(doc, b64, format, x, yPos, SIG_BOX_W, SIG_BOX_H);
      }
    } catch (e) {
      console.error("[PDF Gen] Error rendering signature asset:", e);
    }
  };

  await Promise.all([
    renderSingle(assets?.coachSignUrl, sigLeftX, y),
    renderSingle(assets?.ceoSignUrl, sigRightX, y),
    renderSingle(assets?.stampUrl, 0, y, true),
  ]);

  y += SIG_GAP;
  drawHorizontalRule(doc, y, 0.3, 100); // reuse rule but limited width? better line
  doc.line(sigLeftX, y, sigLeftX + SIG_BOX_W, y);
  doc.line(sigRightX, y, sigRightX + SIG_BOX_W, y);

  doc.setFont("helvetica", "bold");
  doc.text(signers?.coachName ?? "Head Coach", sigLeftX, y + 5);
  doc.text(signers?.ceoName ?? "CEO", sigRightX, y + 5);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Head Coach", sigLeftX, y + 9);
  doc.text("CEO ADORA BBC", sigRightX, y + 9);

  return y;
}

interface FinalizeParam {
  isPdfTemplate?: boolean;
  headerUrl?: string;
  playerName: string;
  periodName: string;
  action?: "download" | "preview";
}

async function finalizePDF(doc: jsPDF, info: FinalizeParam) {
  const { isPdfTemplate, headerUrl, playerName, periodName, action = "download" } = info;
  const fileName = action === "preview" ? "Pratinjau_Rapor_Template.pdf" : `Rapor_${playerName.replace(/\s+/g, "_")}_${periodName.replace(/\s+/g, "_")}.pdf`;

  if (isPdfTemplate && headerUrl) {
    try {
      const pdfBytes = doc.output("arraybuffer");
      const contentPdf = await PDFDocument.load(pdfBytes);
      const fetchUrl = headerUrl.includes("?") ? `${headerUrl}&t=${Date.now()}` : `${headerUrl}?t=${Date.now()}`;
      const templateRes = await fetch(fetchUrl);
      if (!templateRes.ok) throw new Error(`Gagal mengunduh template (HTTP ${templateRes.status})`);
      
      const templatePdf = await PDFDocument.load(await templateRes.arrayBuffer());

      const [templatePage] = templatePdf.getPages();
      const contentPages = await templatePdf.embedPdf(contentPdf);
      
      const blankTemplates = [];
      if (contentPages.length > 1) {
        blankTemplates.push(...await templatePdf.copyPages(templatePdf, Array(contentPages.length - 1).fill(0)));
      }

      templatePage.drawPage(contentPages[0], { x: 0, y: 0, width: templatePage.getWidth(), height: templatePage.getHeight() });

      for (let i = 1; i < contentPages.length; i++) {
        const newPage = blankTemplates[i - 1];
        templatePdf.addPage(newPage);
        newPage.drawPage(contentPages[i], { x: 0, y: 0, width: newPage.getWidth(), height: newPage.getHeight() });
      }

      const merged = await templatePdf.save();
      const file = new File([merged.buffer as BlobPart], fileName, { type: "application/pdf" });

      if (action === "preview") {
        const url = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.click();
        return;
      }

      const link = document.createElement("a");
      link.href = URL.createObjectURL(file);
      link.download = fileName;
      link.click();
      return;
    } catch (e) {
      console.error("[PDF Gen] PDF Overlay failed, fallback to standard", e);
      toast.error("Gagal menerapkan template latar belakang: " + (e instanceof Error ? e.message : "Unknown error"));
      
      // DEBUG: Tulis error langsung ke PDF agar terlihat oleh user
      doc.setFontSize(10);
      doc.setTextColor(255, 0, 0);
      doc.text("ERROR LOADING TEMPLATE: " + (e instanceof Error ? e.message : String(e)), 10, 10);
      doc.setTextColor(0, 0, 0);
    }
  }

  if (action === "preview") {
    const blob = doc.output("blob");
    const file = new File([blob], fileName, { type: "application/pdf" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.click();
    return;
  }

  doc.save(fileName);
}
