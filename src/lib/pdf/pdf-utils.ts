import jsPDF from "jspdf";

export const PAGE_W = 210;
export const PAGE_H = 297;
export const MARGIN = 20;
export const CONTENT_W = PAGE_W - MARGIN * 2;

export const HEADER_MAX_H = 35;
export const HEADER_BOTTOM_TRIM = 6;
export const HEADER_SEP_GAP = 5;
export const PDF_TEMPLATE_SKIP = 35; // 35mm skip + 20mm base margin = 55mm total top margin

export const SIG_BOX_H = 32;
export const STAMP_SIZE = 34;
export const SECTION_GAP = 5;

export const SECTION_TITLE_COLOR: [number, number, number] = [203, 93, 24];
export const PANEL_BORDER: [number, number, number] = [225, 214, 203];
export const TABLE_HEAD_FILL: [number, number, number] = [243, 232, 222];

type PdfImageLoadOptions = {
  maxWidthPx?: number;
  maxHeightPx?: number;
  quality?: number;
  forceRasterize?: boolean;
  outputMimeType?: string;
  signatureMask?: boolean;
};

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("IMAGE_LOAD_FAILED"));
    image.src = src;
  });
}

async function normalizeImageForPdf(blob: Blob, options: PdfImageLoadOptions) {
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await loadImageElement(objectUrl);
    const maxWidthPx = options.maxWidthPx ?? image.width;
    const maxHeightPx = options.maxHeightPx ?? image.height;
    const scale = Math.min(1, maxWidthPx / image.width, maxHeightPx / image.height);
    const targetWidth = Math.max(1, Math.round(image.width * scale));
    const targetHeight = Math.max(1, Math.round(image.height * scale));

    if (!options.forceRasterize && targetWidth === image.width && targetHeight === image.height) {
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("PDF_IMAGE_CANVAS_CONTEXT_UNAVAILABLE");
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    if (options.signatureMask) {
      const imageData = context.getImageData(0, 0, targetWidth, targetHeight);
      const pixels = imageData.data;
      const cornerIndexes = [
        0,
        (targetWidth - 1) * 4,
        (targetWidth * (targetHeight - 1)) * 4,
        (targetWidth * targetHeight - 1) * 4,
      ];
      const cornerLuma =
        cornerIndexes.reduce((sum, index) => {
          return sum + (pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114);
        }, 0) / cornerIndexes.length;
      const hasDarkBackground = cornerLuma < 32;

      if (hasDarkBackground) {
        for (let index = 0; index < pixels.length; index += 4) {
          const luma = pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114;
          const alpha = Math.max(0, Math.min(255, (luma - cornerLuma - 10) * 3.2));
          pixels[index] = 0;
          pixels[index + 1] = 0;
          pixels[index + 2] = 0;
          pixels[index + 3] = alpha;
        }

        context.putImageData(imageData, 0, 0);
      }
    }

    const mimeType = options.outputMimeType || blob.type || "image/png";
    const quality = options.quality ?? 0.82;
    return {
      data: canvas.toDataURL(mimeType, quality),
      format: mimeType.split("/")[1]?.toUpperCase() || "PNG",
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export const loadImageAsBase64 = async (
  url: string,
  options: PdfImageLoadOptions = {},
): Promise<{ data: string; format: string }> => {
  try {
    const fetchUrl = url.includes("?") ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;
    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();

    const normalizedImage = await normalizeImageForPdf(blob, options);
    if (normalizedImage) {
      return normalizedImage;
    }

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

export function drawFitImage(
  doc: jsPDF,
  base64: string,
  format: string,
  x: number,
  y: number,
  w: number,
  h: number,
  scale = 1,
) {
  const props = doc.getImageProperties(base64);
  let finalW = w * Math.max(0.1, scale);
  let finalH = (props.height * finalW) / props.width;

  if (finalH > h) {
    finalH = h;
    finalW = (props.width * finalH) / props.height;
  }

  const dx = x + (w - finalW) / 2;
  const dy = y + (h - finalH) / 2;
  doc.addImage(base64, format, dx, dy, finalW, finalH, undefined, "FAST");
}

export function drawSectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...SECTION_TITLE_COLOR);
  doc.text(title, MARGIN, y);
  doc.setTextColor(0, 0, 0);
}

export function drawPanel(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setDrawColor(...PANEL_BORDER);
  doc.setLineWidth(0.35);
  doc.roundedRect(x, y, w, h, 2.5, 2.5, "S");
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
}
