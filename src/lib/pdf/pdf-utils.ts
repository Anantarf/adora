import jsPDF from "jspdf";

export const PAGE_W = 210;
export const PAGE_H = 297;
export const MARGIN = 20;
export const CONTENT_W = PAGE_W - MARGIN * 2;

export const HEADER_MAX_H = 35;
export const HEADER_BOTTOM_TRIM = 6;
export const HEADER_SEP_GAP = 5;
export const PDF_TEMPLATE_SKIP = 25;

export const SIG_BOX_H = 22;
export const STAMP_SIZE = 24;
export const SECTION_GAP = 6;

export const SECTION_TITLE_COLOR: [number, number, number] = [203, 93, 24];
export const PANEL_FILL: [number, number, number] = [250, 246, 241];
export const PANEL_BORDER: [number, number, number] = [225, 214, 203];
export const TABLE_HEAD_FILL: [number, number, number] = [243, 232, 222];
export const TABLE_ACCENT_FILL: [number, number, number] = [252, 244, 236];

export const loadImageAsBase64 = async (url: string): Promise<{ data: string; format: string }> => {
  try {
    const fetchUrl = url.includes("?") ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;
    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();

    return await new Promise((resolve, reject) => {
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

export function openPdfInNewTab(file: File) {
  const url = URL.createObjectURL(file);
  const openedWindow = window.open(url, "_blank", "noopener,noreferrer");

  if (!openedWindow) {
    const fallbackLink = document.createElement("a");
    fallbackLink.href = url;
    fallbackLink.target = "_blank";
    fallbackLink.rel = "noopener noreferrer";
    fallbackLink.click();
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function drawHorizontalRule(doc: jsPDF, y: number, weight = 0.3, color = 0) {
  doc.setDrawColor(color);
  doc.setLineWidth(weight);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  doc.setDrawColor(0);
}

export function drawFitImage(doc: jsPDF, base64: string, format: string, x: number, y: number, w: number, h: number) {
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

export function drawSectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...SECTION_TITLE_COLOR);
  doc.text(title, MARGIN, y);
  doc.setTextColor(0, 0, 0);
}

export function drawPanel(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setFillColor(...PANEL_FILL);
  doc.setDrawColor(...PANEL_BORDER);
  doc.roundedRect(x, y, w, h, 3, 3, "FD");
  doc.setDrawColor(0, 0, 0);
}
