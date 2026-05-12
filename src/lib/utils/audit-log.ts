/**
 * UTILITIES & CONSTANTS FOR AUDIT LOG MODULE
 * Senior Developer Quality Refactor
 */

export const TARGET_TABLE_DICT: Record<string, string> = {
  user: "Pengguna",
  parent: "Orang Tua",
  player: "Pemain",
  group: "Kelompok",
  attendance: "Kehadiran",
  statistic: "Statistik",
  evaluationperiod: "Periode Evaluasi",
  auditlog: "Log System",
  clubsetting: "Pengaturan Klub",
};

export const FIELD_LABELS: Record<string, string> = {
  username: "Username",
  name: "Nama Lengkap",
  email: "Email",
  role: "Peran",
  groupId: "Kelompok",
  parentId: "Orang Tua",
  dateOfBirth: "Tanggal Lahir",
  homebaseId: "Lokasi Latihan",
  description: "Keterangan",
  startDate: "Tanggal Mulai",
  endDate: "Tanggal Selesai",
  isActive: "Status Aktif",
  count: "Jumlah Ditambahkan",
  submitted: "Data Dikirim",
  deduped: "Data Tidak Duplikat",
  resetTo: "Sandi Diatur Ulang Ke",
  key: "Kunci Pengaturan",
  value: "Nilai Pengaturan",
};

export const ROLE_LABELS: Record<string, string> = {
  PARENT: "Orang Tua",
  ADMIN: "Admin",
};

export const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "Asia/Jakarta",
});

/**
 * Strategy pattern for human-readable actions
 */
const ACTION_TRANSLATIONS: Record<string, string> = {
  CREATE: "Mendaftarkan {t} baru",
  UPDATE: "Memperbarui informasi {t}",
  DELETE: "Menghapus {t} dari sistem",
  RESET_PASSWORD: "Mengatur ulang sandi {t}",
  UPDATE_SELF: "Memperbarui profil {t}",
  CREATE_STATS: "Memasukkan data {t} baru",
  UPDATE_STATS: "Memperbarui dan menyelesaikan {t}",
  SET_ACTIVE: "Mengaktifkan {t}",
};

export function getHumanReadableTable(table: string): string {
  return TARGET_TABLE_DICT[table.toLowerCase()] || table;
}

export function getHumanReadableText(action: string, table: string): string {
  const t = getHumanReadableTable(table).toLowerCase();
  const template = ACTION_TRANSLATIONS[action.toUpperCase()];
  
  if (template) {
    return template.replace("{t}", t);
  }
  
  // Fallback for partial matches or generic
  if (action.includes("CREATE")) return `Memasukkan data ${t} baru`;
  if (action.includes("UPDATE")) return `Memperbarui ${t}`;
  
  return `Perubahan pada data ${t}`;
}

export function extractTargetName(details: any): string | null {
  if (!details || typeof details !== "object" || Array.isArray(details)) return null;
  const d = details;
  if (typeof d.name === "string") return d.name;
  if (d.after?.name) return d.after.name;
  if (d.before?.name) return d.before.name;
  return null;
}

export function formatValue(key: string, value: any): string {
  if (value === null || value === undefined) return "—";
  if (key === "role") return ROLE_LABELS[value as string] ?? String(value);
  if (key === "resetTo") return value === "default" ? "Sandi awal (adora123)" : "Sandi kustom";
  if (key === "isActive") return value ? "Aktif" : "Tidak aktif";
  if (key.toLowerCase().includes("date") && typeof value === "string") {
    try {
      return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return value;
    }
  }
  return String(value);
}
