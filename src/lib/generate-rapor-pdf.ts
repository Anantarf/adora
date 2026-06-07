import jsPDF from "jspdf";
import type { MetricsJson } from "@/types/dashboard";
import { isMetricsJsonV2, type MetricsJsonV2 } from "@/lib/evaluation-rules";
import {
  PAGE_W, PAGE_H, MARGIN, CONTENT_W,
  HEADER_MAX_H, HEADER_BOTTOM_TRIM, HEADER_SEP_GAP, PDF_TEMPLATE_SKIP,
  loadImageAsBase64, drawHorizontalRule
} from "./pdf/pdf-utils";
import {
  renderMainTitle,
  renderPlayerInfo,
  renderAssessmentTable,
  renderConclusionAndGrades,
  renderAchievements,
  renderSignatureArea,
  finalizePDF
} from "./pdf/pdf-render";

export interface RaporData {
  playerName: string;
  groupName: string;
  schoolOrigin?: string | null;
  periodName: string;
  metrics: MetricsJson | MetricsJsonV2;
  attendanceRate?: number | null;
  certificates?: Array<{
    title: string;
    uploadedAt?: Date | string | null;
  }>;
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

export async function generateRaporPDF(data: RaporData): Promise<void> {
  const {
    playerName,
    groupName,
    schoolOrigin,
    periodName,
    metrics,
    attendanceRate,
    certificates,
    printDate = new Date(),
    assets,
    signers,
  } = data;


  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = MARGIN;

  let fullPageBg: { data: string; format: string } | null = null;
  const addNewPage = () => {
    doc.addPage();
    if (fullPageBg) {
      doc.addImage(fullPageBg.data, fullPageBg.format, 0, 0, PAGE_W, PAGE_H, undefined, "FAST");
    }
    return (isPdfTemplate || fullPageBg) ? MARGIN + PDF_TEMPLATE_SKIP : MARGIN + 10;
  };

  const isPdfTemplate = assets?.headerUrl ? assets.headerUrl.split("?")[0].toLowerCase().endsWith(".pdf") : false;

  if (isPdfTemplate) {
    y += PDF_TEMPLATE_SKIP;
  } else if (assets?.headerUrl) {
    try {
      const img = await loadImageAsBase64(assets.headerUrl, {
        maxWidthPx: 1400,
        maxHeightPx: 2000,
        quality: 0.72,
      });
      const props = doc.getImageProperties(img.data);

      if (props.height > props.width) {
        fullPageBg = img;
        doc.addImage(img.data, img.format, 0, 0, PAGE_W, PAGE_H, undefined, "FAST");
        y += PDF_TEMPLATE_SKIP;
      } else {
        let imgW = CONTENT_W;
        let imgH = (props.height * imgW) / props.width;

        if (imgH > HEADER_MAX_H) {
          imgH = HEADER_MAX_H;
          imgW = (props.width * imgH) / props.height;
        }

        const drawX = MARGIN + (CONTENT_W - imgW) / 2;
        doc.addImage(img.data, img.format, drawX, y, imgW, imgH, undefined, "FAST");
        y += imgH - HEADER_BOTTOM_TRIM;
        drawHorizontalRule(doc, y, 0.3, 180);
        y += HEADER_SEP_GAP;
      }
    } catch {
      console.error("[PDF Gen] Error rendering custom header image");
    }
  }

  y = renderMainTitle(doc, y, periodName);

  const effectiveAttendanceRate = typeof attendanceRate === "number"
    ? attendanceRate
    : (isMetricsJsonV2(metrics) && metrics.attendance)
      ? metrics.attendance.score
      : null;

  y = renderPlayerInfo(doc, y, { playerName, groupName, periodName, schoolOrigin, printDate });
  y = renderAssessmentTable(doc, y, metrics);
  y = renderConclusionAndGrades(doc, y, { playerName, periodName, metrics }, addNewPage);
  y = renderAchievements(doc, y, { attendanceRate: effectiveAttendanceRate, certificates }, addNewPage);
  await renderSignatureArea(doc, y, { assets, signers, printDate }, addNewPage);

  await finalizePDF(doc, {
    isPdfTemplate,
    headerUrl: assets?.headerUrl,
    playerName,
    periodName,
    action: data.action,
  });
}
