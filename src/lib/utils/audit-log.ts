/**
 * UTILITIES & CONSTANTS FOR AUDIT LOG MODULE
 * Senior Developer Quality Refactor
 */

export const TARGET_TABLE_DICT: Record<string, string> = {
  user: "Akun Admin",
  parent: "Data Orang Tua",
  player: "Data Pemain",
  group: "Kelompok Latihan",
  attendance: "Absensi/Presensi",
  statistic: "Nilai Rapor",
  evaluationperiod: "Periode Evaluasi",
  auditlog: "Rekam Aktivitas",
  clubsetting: "Profil & Dokumen Klub",
  attendance_batch: "Presensi Massal",
};

export const FIELD_LABELS: Record<string, string> = {
  username: "ID Login",
  name: "Nama Lengkap",
  email: "Alamat Email",
  role: "Hak Akses",
  groupId: "Kelompok Latihan",
  parentId: "Orang Tua/Wali",
  dateOfBirth: "Tanggal Lahir",
  homebaseId: "Lokasi Latihan",
  description: "Keterangan Tambahan",
  startDate: "Mulai Berlaku",
  endDate: "Selesai Berlaku",
  isActive: "Status Keanggotaan",
  count: "Jumlah Data",
  submitted: "Waktu Pengiriman",
  deduped: "Pembersihan Duplikat",
  resetTo: "Sandi Baru",
  key: "Bagian yang Diubah",
  value: "Isi Perubahan",
  rapor_header_url: "Kop Surat",
  rapor_ceo_sign_url: "Tanda Tangan CEO",
  rapor_coach_sign_url: "Tanda Tangan Pelatih",
  rapor_stamp_url: "Stempel Klub",
  rapor_coach_name: "Nama Pelatih di Rapor",
  rapor_ceo_name: "Nama CEO di Rapor",
};

export const ROLE_LABELS: Record<string, string> = {
  PARENT: "Orang Tua",
  ADMIN: "Administrator Utama",
};

export const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Jakarta",
});

/**
 * Strategy pattern for human-readable actions
 */
const ACTION_TRANSLATIONS: Record<string, string> = {
  CREATE: "Menambahkan {t} baru",
  UPDATE: "Mengubah informasi {t}",
  DELETE: "Menghapus {t}",
  RESET_PASSWORD: "Mengganti kata sandi {t}",
  UPDATE_SELF: "Memperbarui profil diri {t}",
  CREATE_STATS: "Mengisi {t} baru",
  UPDATE_STATS: "Menyelesaikan input {t}",
  SET_ACTIVE: "Mengaktifkan status {t}",
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
