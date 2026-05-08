/**
 * Generic discriminated union untuk hasil Server Action.
 * Gunakan ServerActionResult<T> bila action mengembalikan data,
 * atau ServerActionResult<void> / tanpa generic bila hanya sinyal sukses/gagal.
 */
export type ServerActionResult<T = void> = T extends void
  ? { success: true } | { success: false; error: string }
  : { success: true; data: T } | { success: false; error: string };
