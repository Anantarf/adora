/**
 * ADORA Basketball - Global Date Service (WIB Focus)
 * Ensures consistent time handling between Node.js server and Browser.
 * All dates stored as midnight Jakarta (00:00:00+07:00) for cross-server consistency.
 */

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DISPLAY_DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;

/**
 * Returns a normalized Date object set to 00:00:00 Jakarta time (WIB).
 * Uses explicit +07:00 offset to guarantee consistency across server timezones.
 */
export function getJakartaToday(): Date {
  const todayWIB = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
  return new Date(`${todayWIB}T00:00:00+07:00`);
}

/**
 * Robust conversion to Jakarta Date at Midnight (00:00:00+07:00).
 * Uses sv-SE locale to get YYYY-MM-DD in Jakarta timezone, then
 * constructs an explicit offset string to avoid local-TZ ambiguity.
 */
export function toJakartaDate(date?: string | Date | number): Date {
  if (!date) return getJakartaToday();
  const d = parseFlexibleDateInput(date);

  if (isNaN(d.getTime())) {
    throw new Error("Format tanggal tidak valid.");
  }

  const jakartaDateStr = d.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
  return new Date(`${jakartaDateStr}T00:00:00+07:00`);
}
/**
 * Convert Date to YYYY-MM-DD string adjusted for Jakarta Timezeone,
 * preventing UTC boundary shifting.
 */
export function toYYYYMMDD(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
}

export function parseFlexibleDateInput(date: string | Date | number): Date {
  if (date instanceof Date) {
    return date;
  }

  if (typeof date === "number") {
    return new Date(date);
  }

  const trimmedDate = date.trim();

  if (DISPLAY_DATE_REGEX.test(trimmedDate)) {
    const [day, month, year] = trimmedDate.split("/").map(Number);
    return new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+07:00`);
  }

  if (ISO_DATE_REGEX.test(trimmedDate)) {
    return new Date(`${trimmedDate}T00:00:00+07:00`);
  }

  return new Date(trimmedDate);
}

export function normalizeDateInputToISO(date: string): string {
  const parsedDate = parseFlexibleDateInput(date);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Format tanggal tidak valid.");
  }

  return parsedDate.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
}

export function formatDateForInput(date: Date | string): string {
  const isoDate = typeof date === "string" ? normalizeDateInputToISO(date) : toYYYYMMDD(date);
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export function isSupportedDateInput(date: string): boolean {
  return DISPLAY_DATE_REGEX.test(date.trim()) || ISO_DATE_REGEX.test(date.trim());
}

/**
 * Generates human-friendly relative dates (Today, Tomorrow, X days left).
 */
export function getCountdownLabel(targetDate: Date | string): string {
  const today = getJakartaToday();
  const evDate = toJakartaDate(targetDate);

  const diffTime = evDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hari Ini";
  if (diffDays === 1) return "Besok";
  if (diffDays < 0) return "Lampau";
  return `${diffDays} hari lagi`;
}

export function formatFullDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getAge(dateOfBirth: Date | string): number {
  const today = getJakartaToday();
  const birthDate = toJakartaDate(dateOfBirth);

  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Combine a Date object and a time string (HH:mm) into a ISO string.
 * Resulting string is in Jakarta offset (+07:00).
 */
export function combineDateAndTime(date: Date, time: string): string {
  const yyyymmdd = date.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
  return `${yyyymmdd}T${time}:00+07:00`;
}
