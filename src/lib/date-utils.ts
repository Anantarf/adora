/**
 * ADORA Basketball - Global Date Service (WIB Focus)
 * Ensures consistent time handling between Node.js server and Browser.
 */

// WIB is UTC+7
const WIB_OFFSET = 7;

/**
 * Returns a normalized Date object set to 00:00:00 Jakarta time (WIB).
 */
export function getJakartaToday(): Date {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const wib = new Date(utc + (3600000 * WIB_OFFSET));
  wib.setHours(0, 0, 0, 0);
  return wib;
}

/**
 * Robust conversion to Jakarta Date at Midnight.
 */
export function toJakartaDate(date?: string | Date | number): Date {
  if (!date) return getJakartaToday();
  const d = new Date(date);
  
  // Use toLocaleString for safe TZ conversion then reset time
  const jakartaStr = d.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
  const jakartaDate = new Date(jakartaStr);
  jakartaDate.setHours(0, 0, 0, 0);
  
  return jakartaDate;
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
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getAge(dateOfBirth: Date | string): number {
  const today = getJakartaToday();
  const birthDate = new Date(dateOfBirth);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
