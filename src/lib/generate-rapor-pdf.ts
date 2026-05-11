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
  signers?: {
    coachName?: string;
    ceoName?: string;
  };
}

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

  const score = averageScore(metrics);
  const grade = letterGrade(score);
  const dribTotal = dribbleTotal(metrics.dribble);
  const passTotal = passingTotal(metrics.passing);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // ─── Page geometry ────────────────────────────────────
  const PAGE_W  = 210;
  const MARGIN  = 20;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  let y = MARGIN;

  // ─── Layout constants — sesuaikan di sini saat aset berubah ──
  const HEADER_MAX_H       = 35;  // tinggi max kop surat PNG (mm)
  const HEADER_BOTTOM_TRIM =  8;  // potong transparan bawah PNG kop (mm) — sesuaikan per gambar
  const HEADER_SEP_GAP     =  4;  // jarak garis pemisah ke baris info pertama (mm)
  const PDF_TEMPLATE_SKIP  = 25;  // Y offset saat header berupa PDF template (mm)

  const SIG_BOX_W  = 55;  // lebar box gambar TTD (mm)
  const SIG_BOX_H  = 40;  // tinggi box gambar TTD (mm)
  const SIG_GAP    = 30;  // jarak dari awal area TTD ke garis nama (mm)
  const STAMP_SIZE = 30;  // ukuran gambar stempel (mm, persegi)

  // Posisi X kiri/kanan TTD — derived dari margin, bukan hardcode tersebar
  const sigLeftX  = MARGIN + 10;
  const sigRightX = PAGE_W - MARGIN - SIG_BOX_W - 10;

  // ─── Helper: load image ───────────────────────────────
  const loadImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
    });

  // ─── Helper: draw horizontal rule ─────────────────────
  function rule(yPos: number, weight = 0.3, color = 0) {
    doc.setDrawColor(color);
    doc.setLineWidth(weight);
    doc.line(MARGIN, yPos, PAGE_W - MARGIN, yPos);
    doc.setDrawColor(0);
  }

  // ─── Helper: fallback title (no header image) ─────────
  function renderDefaultTitle(yPos: number): number {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("RAPOR PENILAIAN PEMAIN", PAGE_W / 2, yPos, { align: "center" });
    yPos += 6;
    doc.setFontSize(11);
    doc.text(periodName.toUpperCase(), PAGE_W / 2, yPos, { align: "center" });
    yPos += 5;
    rule(yPos, 0.8);
    rule(yPos + 0.8, 0.3);
    return yPos + 6;
  }

  // ─── Helper: fit-and-bottom-align image in box ────────
  function drawFitImage(
    img: HTMLImageElement,
    boxX: number, boxY: number,
    boxW: number, boxH: number,
  ) {
    const props = doc.getImageProperties(img);
    let w = boxW;
    let h = (props.height * w) / props.width;
    if (h > boxH) { h = boxH; w = (props.width * h) / props.height; }
    // Horizontally centered, vertically bottom-aligned agar TTD menempel ke garis nama
    const dx = boxX + (boxW - w) / 2;
    const dy = boxY + boxH - h;
    const format = props.fileType || "PNG";
    doc.addImage(img, format, dx, dy, w, h);
  }

  // ─── HEADER BLOCK ─────────────────────────────────────
  const isPdfTemplate = assets?.headerUrl?.toLowerCase().endsWith(".pdf");

  if (isPdfTemplate) {
    y += PDF_TEMPLATE_SKIP;
  } else if (assets?.headerUrl) {
    try {
      const headerImg = await loadImage(assets.headerUrl);
      const imgProps  = doc.getImageProperties(headerImg);
      let imgW = CONTENT_W;
      let imgH = (imgProps.height * imgW) / imgProps.width;
      if (imgH > HEADER_MAX_H) {
        imgH = HEADER_MAX_H;
        imgW = (imgProps.width * imgH) / imgProps.height;
      }
      const drawX = MARGIN + (CONTENT_W - imgW) / 2;
      const format = imgProps.fileType || "PNG";
      doc.addImage(headerImg, format, drawX, y, imgW, imgH);
      // HEADER_BOTTOM_TRIM memotong area transparan bawah PNG kop surat.
      // Jika header baru terlalu rapat/jauh dari garis, sesuaikan konstanta ini.
      y += imgH - HEADER_BOTTOM_TRIM;
      rule(y, 0.3, 180);
      y += HEADER_SEP_GAP;
    } catch (e) {
      console.error("Failed to load header image", e);
      y = renderDefaultTitle(y);
    }
  } else {
    y = renderDefaultTitle(y);
  }

  // ─── INFO PEMAIN ──────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const infoRows: [string, string][] = [
    ["Nama",             playerName],
    ["Kelompok",         groupName],
    ["Periode Evaluasi", periodName],
  ];
  if (schoolOrigin) infoRows.push(["Sekolah Asal", schoolOrigin]);
  infoRows.push([
    "Tanggal Cetak",
    printDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
  ]);

  const LABEL_W = 35;
  infoRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.text(`: ${value}`, MARGIN + LABEL_W, y);
    y += 5;
  });
  y += 3;

  // ─── POIN PENILAIAN ───────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("POIN PENILAIAN", MARGIN, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: CONTENT_W,
    head: [[
      { content: "Kategori",       styles: { halign: "center" } },
      { content: "Jenis Penilaian",styles: { halign: "center" } },
      { content: "Nilai",          styles: { halign: "center" } },
      { content: "Total Kategori", styles: { halign: "center" } },
    ]],
    body: [
      [
        { content: "Dribble", rowSpan: 6, styles: { valign: "middle", halign: "center", fontStyle: "bold" } },
        "In & Out Dribble",
        { content: metrics.dribble.inAndOut,       styles: { halign: "center" } },
        { content: dribTotal, rowSpan: 6, styles: { valign: "middle", halign: "center", fontStyle: "bold", fontSize: 11 } },
      ],
      ["Crossover",             { content: metrics.dribble.crossover,        styles: { halign: "center" } }],
      ["V Dribble (Kiri)",      { content: metrics.dribble.vLeft,            styles: { halign: "center" } }],
      ["V Dribble (Kanan)",     { content: metrics.dribble.vRight,           styles: { halign: "center" } }],
      ["Between Legs (Kiri)",   { content: metrics.dribble.betweenLegsLeft,  styles: { halign: "center" } }],
      ["Between Legs (Kanan)",  { content: metrics.dribble.betweenLegsRight, styles: { halign: "center" } }],
      [
        { content: "Passing", rowSpan: 3, styles: { valign: "middle", halign: "center", fontStyle: "bold" } },
        "Chest Pass",
        { content: metrics.passing.chestPass, styles: { halign: "center" } },
        { content: passTotal, rowSpan: 3, styles: { valign: "middle", halign: "center", fontStyle: "bold", fontSize: 11 } },
      ],
      ["Bounce Pass",   { content: metrics.passing.bouncePass,   styles: { halign: "center" } }],
      ["Overhead Pass", { content: metrics.passing.overheadPass, styles: { halign: "center" } }],
      [
        { content: "Lay Up",   styles: { halign: "center", fontStyle: "bold" } },
        { content: "Lay Up",   styles: { halign: "center" } },
        { content: metrics.layUp,   styles: { halign: "center" } },
        { content: metrics.layUp,   styles: { halign: "center", fontStyle: "bold", fontSize: 11 } },
      ],
      [
        { content: "Shooting", styles: { halign: "center", fontStyle: "bold" } },
        { content: "Shooting", styles: { halign: "center" } },
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
    styles:     { fontSize: 9, cellPadding: 2.5, lineColor: [0, 0, 0], lineWidth: 0.2 },
    headStyles: { fillColor: [210, 210, 210], textColor: 0, fontStyle: "bold", lineColor: [0, 0, 0], lineWidth: 0.2 },
    theme: "grid",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 7;

  // ─── KESIMPULAN ───────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("KESIMPULAN PENILAIAN", MARGIN, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const notesText = metrics.notes?.trim() ||
    `${playerName} telah menyelesaikan evaluasi pada periode ${periodName}. ` +
    `Nilai rata-rata yang diperoleh menunjukkan performa ${grade.label.toLowerCase()} ` +
    `dengan skor akhir ${score} dari 100.`;

  const splitNotes = doc.splitTextToSize(notesText, CONTENT_W);
  doc.text(splitNotes, MARGIN, y);
  y += splitNotes.length * 4.5 + 6;

  // ─── KETERANGAN + HASIL ───────────────────────────────
  const colLeft  = MARGIN;
  const colRight = PAGE_W / 2 + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("KETERANGAN",     colLeft,  y);
  doc.text("HASIL PENILAIAN", colRight, y);
  y += 5;

  const gradeScale = [
    { letter: "A", label: "SANGAT BAIK"  },
    { letter: "B", label: "BAIK"         },
    { letter: "C", label: "CUKUP BAIK"   },
    { letter: "D", label: "KURANG BAIK"  },
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

  y += 20;

  // ─── TANDA TANGAN ─────────────────────────────────────
  rule(y, 0.3);
  y += 5;

  const dateStr = printDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Gandul, ${dateStr}`, PAGE_W / 2, y, { align: "center" });
  y += 5;

  // Render signatures independently so one failure doesn't block others
  const renderAsset = async (url: string | undefined, x: number, yPos: number, w: number, h: number, isStamp = false) => {
    if (!url || url.toLowerCase().endsWith(".pdf")) return;
    try {
      const img = await loadImage(url);
      if (isStamp) {
        const sx = PAGE_W / 2 - w / 2;
        const props = doc.getImageProperties(img);
        const format = props.fileType || "PNG";
        doc.addImage(img, format, sx, yPos + 5, w, h);
      } else {
        drawFitImage(img, x, yPos, w, h);
      }
    } catch (e) {
      console.error(`Failed to load asset: ${url}`, e);
    }
  };

  await Promise.all([
    renderAsset(assets?.coachSignUrl, sigLeftX, y, SIG_BOX_W, SIG_BOX_H),
    renderAsset(assets?.ceoSignUrl, sigRightX, y, SIG_BOX_W, SIG_BOX_H),
    renderAsset(assets?.stampUrl, 0, y, STAMP_SIZE, STAMP_SIZE, true),
  ]);

  y += SIG_GAP;

  // Garis nama — lebar sama dengan box gambar, mulai dari posisi yang sama
  doc.setDrawColor(100);
  doc.setLineWidth(0.3);
  doc.line(sigLeftX,  y, sigLeftX  + SIG_BOX_W, y);
  doc.line(sigRightX, y, sigRightX + SIG_BOX_W, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(signers?.coachName ?? "Head Coach", sigLeftX,  y + 5);
  doc.text(signers?.ceoName  ?? "CEO",         sigRightX, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Head Coach",    sigLeftX,  y + 9);
  doc.text("CEO ADORA BBC", sigRightX, y + 9);

  // ─── DOWNLOAD ─────────────────────────────────────────
  const safePeriod = periodName.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_");
  const safeName   = playerName.replace(/\s+/g, "_");
  const fileName   = `Rapor_${safeName}_${safePeriod}.pdf`;

  if (isPdfTemplate) {
    try {
      const pdfBytes = doc.output("arraybuffer");
      const contentPdf = await PDFDocument.load(pdfBytes);

      const templateRes   = await fetch(assets!.headerUrl!);
      const templateBytes = await templateRes.arrayBuffer();
      const templatePdf   = await PDFDocument.load(templateBytes);

      const [templatePage] = templatePdf.getPages();
      const [contentPage]  = await templatePdf.embedPdf(contentPdf);
      templatePage.drawPage(contentPage, {
        x: 0, y: 0,
        width:  templatePage.getWidth(),
        height: templatePage.getHeight(),
      });

      const mergedBytes = await templatePdf.save();
      const blob = new Blob([mergedBytes as BlobPart], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      return;
    } catch (e) {
      console.error("Failed to overlay PDF template, falling back to standard PDF", e);
    }
  }

  doc.save(fileName);
}
