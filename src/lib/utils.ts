import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Build update data object by filtering out undefined values.
 * Useful for conditional updates where only provided fields should be updated.
 */
export function buildUpdateData<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined)) as Partial<T>;
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
