export const TARGET_TABLE_DICT: Record<string, string> = {
  user: "Akun Admin",
  parent: "Akun Orang Tua",
  player: "Data Pemain",
  player_batch: "Impor Pemain",
  player_link: "Tautan Pemain ke Orang Tua",
  player_unlink: "Pelepasan Tautan Pemain",
  group: "Kelompok Latihan",
  attendance: "Presensi Pemain",
  statistic: "Penilaian Pemain",
  evaluationperiod: "Periode Penilaian",
  auditlog: "Audit Log",
  clubsetting: "Pengaturan Klub",
  attendance_batch: "Presensi Massal",
  certificate: "Sertifikat Pemain",
  reportarchive: "Arsip Rapor",
  coachprofile: "Profil Pelatih",
};

export const FIELD_LABELS: Record<string, string> = {
  username: "ID Login",
  name: "Nama Lengkap",
  email: "Alamat Email",
  role: "Hak Akses",
  groupId: "Kelompok Latihan",
  parentId: "Orang Tua/Wali",
  playerId: "Pemain",
  dateOfBirth: "Tanggal Lahir",
  homebaseId: "Lokasi Latihan",
  description: "Keterangan Tambahan",
  category: "Kategori",
  targetKu: "Target KU",
  schoolLevel: "Jenjang Sekolah",
  startDate: "Mulai Berlaku",
  endDate: "Selesai Berlaku",
  isActive: "Status Keanggotaan",
  count: "Jumlah Data",
  submitted: "Waktu Pengiriman",
  deduped: "Pembersihan Duplikat",
  resetTo: "Sandi Baru",
  key: "Bagian yang Diubah",
  value: "Isi Perubahan",
  title: "Judul Sertifikat",
  fileUrl: "File Sertifikat",
  rapor_header_url: "Template Kertas Rapor",
  rapor_ceo_sign_url: "Tanda Tangan CEO",
  rapor_coach_sign_url: "Tanda Tangan Pelatih",
  rapor_stamp_url: "Stempel Klub",
  rapor_coach_name: "Nama Pelatih di Rapor",
  rapor_ceo_name: "Nama CEO di Rapor",
  report_signer_homebase_json: "Aturan Fallback Signer Homebase",
  signatureUrl: "Tanda Tangan Coach",
};

const FIELD_TOKEN_LABELS: Record<string, string> = {
  ceo: "CEO",
  id: "ID",
  url: "URL",
};

export const ROLE_LABELS: Record<string, string> = {
  PARENT: "Orang Tua",
  ADMIN: "Administrator Utama",
};

export type AuditValueLookups = Partial<{
  homebaseId: Record<string, string>;
  groupId: Record<string, string>;
  parentId: Record<string, string>;
  playerId: Record<string, string>;
}>;

export const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Jakarta",
});

export function getHumanReadableText(action: string, table: string): string {
  const normalizedAction = action.toUpperCase();
  const normalizedTable = table.toLowerCase();
  const tableLabel = (TARGET_TABLE_DICT[normalizedTable] || table).toLowerCase();

  if (normalizedTable === "statistic") {
    if (normalizedAction.includes("CREATE")) return "Mengisi rapor baru untuk pemain";
    if (normalizedAction.includes("UPDATE")) return "Memperbarui nilai rapor pemain";
  }

  if (normalizedTable === "attendance" || normalizedTable === "attendance_batch") {
    if (normalizedAction.includes("CREATE")) return "Mencatat presensi pemain";
    if (normalizedAction.includes("UPDATE")) return "Mengubah data presensi pemain";
    if (normalizedAction.includes("SUBMIT")) return "Mengirim presensi massal pemain";
  }

  if (normalizedTable === "reportarchive") {
    if (normalizedAction.includes("UPSERT")) return "Menyimpan draf arsip rapor";
    if (normalizedAction.includes("RELEASE")) return "Merilis arsip rapor ke parent";
  }

  if (normalizedAction === "RESET_PASSWORD") return `Mengatur ulang kata sandi ${tableLabel}`;
  if (normalizedAction === "CHANGE_FORCED_PASSWORD") return "Mengganti kata sandi wajib akun";
  if (normalizedAction === "UPDATE_SELF") return "Memperbarui profil akun sendiri";
  if (normalizedAction === "SET_ACTIVE") return `Mengaktifkan ${tableLabel}`;
  if (normalizedAction === "UPSERT") return `Menyimpan perubahan ${tableLabel}`;
  if (normalizedAction === "SUBMIT_ATTENDANCE") return "Mengirim presensi massal pemain";
  if (normalizedAction === "RELEASE") return `Merilis ${tableLabel}`;

  if (normalizedAction === "CREATE") return `Menambahkan ${tableLabel} ke sistem`;
  if (normalizedAction === "UPDATE") return `Mengubah informasi ${tableLabel}`;
  if (normalizedAction === "DELETE") return `Menghapus ${tableLabel} dari sistem`;

  if (normalizedAction.includes("CREATE")) return `Menambahkan ${tableLabel}`;
  if (normalizedAction.includes("UPDATE")) return `Mengubah ${tableLabel}`;
  if (normalizedAction.includes("UPSERT")) return `Menyimpan ${tableLabel}`;
  if (normalizedAction.includes("RELEASE")) return `Merilis ${tableLabel}`;

  return `Melakukan perubahan pada ${tableLabel}`;
}

export function getHumanReadableTable(table: string): string {
  return TARGET_TABLE_DICT[table.toLowerCase()] || table;
}

export function getFieldLabel(key: string): string {
  const explicitLabel = FIELD_LABELS[key];
  if (explicitLabel) {
    return explicitLabel;
  }

  const normalizedKey = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();

  if (!normalizedKey) {
    return key;
  }

  return normalizedKey
    .split(/\s+/)
    .map((part) => {
      const tokenLabel = FIELD_TOKEN_LABELS[part.toLowerCase()];
      if (tokenLabel) {
        return tokenLabel;
      }

      const lower = part.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export function extractTargetName(details: unknown): string | null {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return null;
  }

  const detailRecord = details as Record<string, unknown>;

  if (typeof detailRecord.name === "string") return detailRecord.name;
  if (typeof detailRecord.title === "string") return detailRecord.title;
  if (typeof detailRecord.playerName === "string") return detailRecord.playerName;

  if (detailRecord.after && typeof detailRecord.after === "object" && !Array.isArray(detailRecord.after)) {
    const afterName = (detailRecord.after as Record<string, unknown>).name;
    if (typeof afterName === "string") return afterName;
  }

  if (detailRecord.before && typeof detailRecord.before === "object" && !Array.isArray(detailRecord.before)) {
    const beforeName = (detailRecord.before as Record<string, unknown>).name;
    if (typeof beforeName === "string") return beforeName;
  }

  return null;
}

function lookupValue(
  key: string,
  value: string,
  lookups?: AuditValueLookups,
): string | null {
  const lookupMap = lookups?.[key as keyof AuditValueLookups];
  if (!lookupMap) {
    return null;
  }

  return lookupMap[value] ?? null;
}

export function formatValue(
  key: string,
  value: unknown,
  lookups?: AuditValueLookups,
): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "string") {
    const mappedValue = lookupValue(key, value, lookups);
    if (mappedValue) {
      return mappedValue;
    }
  }

  if (key === "role") {
    return typeof value === "string" ? ROLE_LABELS[value] ?? value : String(value);
  }

  if (key === "resetTo") {
    return value === "default" ? "Sandi awal (adora123)" : "Sandi kustom";
  }

  if (key === "isActive") {
    return value ? "Aktif" : "Tidak aktif";
  }

  if (key === "category" && typeof value === "string") {
    if (value === "SEKOLAH") return "Sekolah";
    if (value === "KELOMPOK_UMUR") return "Kelompok Umur";
    return value;
  }

  if (key === "targetKu" && (typeof value === "number" || typeof value === "string")) {
    return `KU ${value}`;
  }

  if (key === "fileUrl" && typeof value === "string") {
    const fileName = value.split("/").filter(Boolean).pop();
    return fileName ?? value;
  }

  if (key.toLowerCase().includes("date") && typeof value === "string") {
    try {
      return new Date(value).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return value;
    }
  }

  return String(value);
}
