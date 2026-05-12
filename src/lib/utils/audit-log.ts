/**
 * UTILITIES & CONSTANTS FOR AUDIT LOG MODULE
 * Senior Developer Quality Refactor - User Friendly Version
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
  certificate: "Sertifikat",
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
 * Context-aware action translations
 */
export function getHumanReadableText(action: string, table: string): string {
  const a = action.toUpperCase();
  const t = (TARGET_TABLE_DICT[table.toLowerCase()] || table).toLowerCase();

  // Special cases first
  if (table.toLowerCase() === "statistic") {
    if (a.includes("CREATE")) return "Mengisi rapor baru untuk pemain";
    if (a.includes("UPDATE")) return "Memperbarui nilai rapor pemain";
  }

  if (table.toLowerCase() === "attendance" || table.toLowerCase() === "attendance_batch") {
    if (a.includes("CREATE")) return "Mencatat absensi kehadiran";
    if (a.includes("UPDATE")) return "Mengubah data absensi";
  }

  if (a === "RESET_PASSWORD") return `Mengatur ulang kata sandi ${t}`;
  if (a === "UPDATE_SELF") return `Memperbarui profil akun sendiri`;
  if (a === "SET_ACTIVE") return `Mengaktifkan status ${t}`;

  // Standard templates
  if (a === "CREATE") return `Menambahkan ${t} ke sistem`;
  if (a === "UPDATE") return `Mengubah informasi ${t}`;
  if (a === "DELETE") return `Menghapus ${t} dari sistem`;

  // Fallbacks
  if (a.includes("CREATE")) return `Menambahkan ${t}`;
  if (a.includes("UPDATE")) return `Mengubah ${t}`;
  
  return `Melakukan perubahan pada ${t}`;
}

export function getHumanReadableTable(table: string): string {
  return TARGET_TABLE_DICT[table.toLowerCase()] || table;
}

export function extractTargetName(details: any): string | null {
  if (!details || typeof details !== "object" || Array.isArray(details)) return null;
  const d = details;
  if (typeof d.name === "string") return d.name;
  if (d.after?.name) return d.after.name;
  if (d.before?.name) return d.before.name;
  if (d.playerName) return d.playerName;
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
