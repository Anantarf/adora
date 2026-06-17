import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TECHNICAL_ERROR_PATTERNS = [
  /prisma/i,
  /unique constraint/i,
  /\bP\d{4}\b/,
  /database/i,
  /sql/i,
  /failed to fetch/i,
  /network ?error/i,
  /cannot read/i,
  /undefined is not/i,
  /timeout/i,
  /UPLOAD_STORAGE_/i,
  /STORAGE_PROXY_/i,
  /EXPORT_WRITE_TIMEOUT/i,
  /Cannot destructure property/i,
];

function extractErrorMessage(error: unknown): string | null {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return null;
}

export function toUserErrorMessage(error: unknown, fallback: string): string {
  const message = extractErrorMessage(error)?.trim();
  if (!message) {
    return fallback;
  }

  if (message.length > 220) {
    return fallback;
  }

  if (TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(message))) {
    return fallback;
  }

  return message;
}

/**
 * Build update data object by filtering out undefined values.
 * Useful for conditional updates where only provided fields should be updated.
 */
export function buildUpdateData<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/**
 * Standardize catching Soft-Errors from Server Actions.
 * Converts { success: false, error: "..." } into thrown Errors
 * so TanStack Query triggers its onError/isError flows cleanly.
 */
export function unwrapAction<T>(result: T): Exclude<T, { success: false; error: string }> {
  if (result && typeof result === "object" && "success" in result && result.success === false) {
    const actionError = "error" in result ? result.error : "Terjadi kesalahan pada aksi.";
    throw new Error(typeof actionError === "string" ? actionError : "Terjadi kesalahan pada aksi.");
  }
  return result as Exclude<T, { success: false; error: string }>;
}

/**
 * Strips non-digit characters from a phone number string.
 * Useful for constructing WhatsApp links (wa.me).
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}
/**
 * Mengembalikan string `"YYYY/YYYY`".
 * Tahun ajaran berjalan: bulan 8 (September) adalah batas naik tahun ajaran baru.
 */
export function getAcademicYear(): string {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  // < 8 artinya sebelum September, masih tahun ajaran yang sedang berjalan.

  const startYear = currentDate.getMonth() < 8 ? currentYear - 1 : currentYear;
  return `${startYear}/${startYear + 1}`;
}
