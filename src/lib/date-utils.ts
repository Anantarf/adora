/**
 * ADORA Basketball - Date Service
 * Centralizing Jakarta Timezone (WIB) for consistency.
 */

export function toJakartaDate(date?: string | Date): Date {
  const d = date ? new Date(date) : new Date();
  
  // Set to local Jakarta midnight (UTC+7)
  // Clean logic: Menghilangkan noise menit/detik agar grouping & unique constraint DB aman.
  const jakartaDate = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  jakartaDate.setHours(0, 0, 0, 0);
  
  return jakartaDate;
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
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
