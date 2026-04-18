import ExcelJS from "exceljs";
import { SCHOOL_CLASS_TO_GROUP_NAME } from "@/lib/config/player-import";

export type RawCsvRow = Record<string, unknown>;

export type UploadRowError = {
  rowNumber: number;
  message: string;
};

export type NormalizedPlayerPayload = {
  name: string;
  dateOfBirth: string;
  placeOfBirth?: string;
  gender?: string;
  weight?: string;
  height?: string;
  schoolOrigin?: string;
  address?: string;
  email?: string;
  phoneNumber?: string;
  medicalHistory?: string;
  parentName?: string;
  parentAddress?: string;
  parentPhoneNumber?: string;
  groupId: string;
};

export type PreflightResult = {
  validRows: NormalizedPlayerPayload[];
  errors: UploadRowError[];
};

export const XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const ACCEPTED_EXCEL_FILE_FORMATS = `.xlsx,${XLSX_MIME_TYPE}`;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EXCEL_DATE_EPOCH_UTC = Date.UTC(1899, 11, 30);
const HEADER_SCAN_ROW_LIMIT = 12;
const TEMPLATE_FONT = "Poppins";
const BRAND_PURPLE_DARK = "FF6B46C1";
const BRAND_PURPLE = "FF8B5CF6";
const BRAND_PURPLE_SOFT = "FFF5F0FF";
const BRAND_ORANGE = "FFF4B183";
const BRAND_ORANGE_SOFT = "FFFFF4E8";
const BRAND_WHITE = "FFFFFFFF";
const BRAND_TEXT_DARK = "FF1F2937";
const BRAND_BORDER = "FFD6D3D1";
const BRAND_BORDER_SOFT = "FFE7E5E4";

const KNOWN_HEADER_KEYS = new Set([
  "no",
  "nomor",
  "nama",
  "namalengkap",
  "name",
  "tanggallahir",
  "tanggallahiryyyymmdd",
  "dateofbirth",
  "dob",
  "birthdate",
  "asalsekolah",
  "schoolorigin",
  "sekolah",
  "notelf",
  "nohp",
  "telepon",
  "phonenumber",
  "phone",
  "hp",
  "kelompok",
  "kelompokumur",
  "kelompokumurganjil",
  "groupname",
  "namakelompok",
  "groupid",
  "kelas",
  "tempatlahir",
  "jeniskelamin",
  "beratbadan",
  "tinggibadan",
  "alamatrumah",
  "email",
  "riwayatpenyakitbawaan",
  "namaorangtua",
  "alamatorangtua",
  "nomortelforangtua",
]);

export const isSupportedExcelFile = (file: File): boolean => {
  const lowerName = file.name.toLowerCase();
  return lowerName.endsWith(".xlsx") || file.type === XLSX_MIME_TYPE;
};

const normalizeHeaderKey = (key: string) =>
  key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const excelSerialToDate = (excelSerial: number): Date => new Date(EXCEL_DATE_EPOCH_UTC + Math.round(excelSerial * 24 * 60 * 60 * 1000));

const normalizePhoneNumber = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const digitsOnly = trimmed.replace(/[^\d+]/g, "");
  return digitsOnly || undefined;
};

const normalizeText = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed || undefined;
};

const parseDate = (value: unknown): string | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDateToISO(value);
  }

  if (typeof value === "number") {
    return formatDateToISO(excelSerialToDate(value));
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!DATE_REGEX.test(trimmed)) {
    return null;
  }

  const [year, month, day] = trimmed.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  const isSameDate = parsed.getUTCFullYear() === year && parsed.getUTCMonth() + 1 === month && parsed.getUTCDate() === day;

  return isSameDate ? trimmed : null;
};

const normalizeRow = (row: RawCsvRow): Record<string, string> =>
  Object.entries(row).reduce<Record<string, string>>((acc, [key, value]) => {
    const normalizedKey = normalizeHeaderKey(key);

    if (!normalizedKey || normalizedKey === "__parsed_extra") {
      return acc;
    }

    if (value instanceof Date || typeof value === "number") {
      acc[normalizedKey] = String(value);
      return acc;
    }

    acc[normalizedKey] = typeof value === "string" ? value.trim() : "";
    return acc;
  }, {});

export const extractCellValue = (cellValue: ExcelJS.CellValue): unknown => {
  if (cellValue === null || cellValue === undefined) {
    return "";
  }

  if (cellValue instanceof Date || typeof cellValue === "number" || typeof cellValue === "string") {
    return cellValue;
  }

  if (typeof cellValue === "object") {
    if ("result" in cellValue && cellValue.result !== null && cellValue.result !== undefined) {
      return extractCellValue(cellValue.result as ExcelJS.CellValue);
    }

    if ("text" in cellValue && typeof cellValue.text === "string") {
      return cellValue.text;
    }

    if ("hyperlink" in cellValue && typeof cellValue.hyperlink === "string") {
      return cellValue.hyperlink;
    }

    if ("richText" in cellValue && Array.isArray(cellValue.richText)) {
      return cellValue.richText.map((part) => part.text).join("");
    }
  }

  return "";
};

export const readWorksheetRows = (worksheet: ExcelJS.Worksheet): RawCsvRow[] => {
  const maxScanRow = Math.min(Math.max(worksheet.rowCount, 1), HEADER_SCAN_ROW_LIMIT);

  const resolveHeader = () => {
    for (let rowNumber = 1; rowNumber <= maxScanRow; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      const headers: Array<{ col: number; header: string }> = [];
      let matchedKnownHeader = 0;

      for (let col = 1; col <= worksheet.columnCount; col += 1) {
        const header = String(extractCellValue(row.getCell(col).value) || "").trim();
        if (!header) continue;

        headers.push({ col, header });
        if (KNOWN_HEADER_KEYS.has(normalizeHeaderKey(header))) {
          matchedKnownHeader += 1;
        }
      }

      if (headers.length > 0 && matchedKnownHeader >= 2) {
        return { headerRowNumber: rowNumber, headers };
      }
    }

    return { headerRowNumber: 1, headers: [] as Array<{ col: number; header: string }> };
  };

  const { headerRowNumber, headers } = resolveHeader();

  if (headers.length === 0) {
    return [];
  }

  const rows: RawCsvRow[] = [];
  for (let rowNumber = headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const record: RawCsvRow = {};
    let hasAnyValue = false;

    headers.forEach(({ col, header }) => {
      const value = extractCellValue(row.getCell(col).value);
      record[header] = value;

      if (String(value ?? "").trim() !== "") {
        hasAnyValue = true;
      }
    });

    if (hasAnyValue) {
      rows.push(record);
    }
  }

  return rows;
};

export const normalizeAndValidateRows = (rows: RawCsvRow[], groupsById: Set<string>, groupsByName: Map<string, string>): PreflightResult => {
  const validRows: NormalizedPlayerPayload[] = [];
  const errors: UploadRowError[] = [];

  rows.forEach((row, index) => {
    const normalized = normalizeRow(row);
    const rowNumber = index + 2;

    const name = normalized.namalengkap ?? normalized.nama ?? normalized.playername ?? normalized.name ?? "";
    const dateOfBirthInput = normalized.tanggallahiryyyymmdd ?? normalized.tanggallahir ?? normalized.dateofbirth ?? normalized.dob ?? normalized.birthdate ?? "";
    const placeOfBirth = normalized.tempatlahir ?? "";
    const gender = normalized.jeniskelamin ?? "";
    const weight = normalized.beratbadan ?? "";
    const height = normalized.tinggibadan ?? "";
    const schoolOrigin = normalized.asalsekolah ?? normalized.sekolahasal ?? normalized.schoolorigin ?? normalized.school ?? normalized.sekolah ?? "";
    const address = normalized.alamatrumah ?? "";
    const email = normalized.email ?? "";
    const groupIdInput = normalized.groupid ?? normalized.idkelompok ?? normalized.grupid ?? "";
    const groupNameInput = normalized.kelompok ?? normalized.kelompokumur ?? normalized.kelompokumurganjil ?? normalized.namakelompok ?? normalized.groupname ?? "";
    const schoolClassInput = normalized.kelas ?? "";
    const phoneNumber = normalized.notelf ?? normalized.nohp ?? normalized.telepon ?? normalized.phonenumber ?? normalized.phone ?? normalized.hp ?? "";
    const medicalHistory = normalized.riwayatpenyakitbawaan ?? "";
    const parentName = normalized.namaorangtua ?? "";
    const parentAddress = normalized.alamatorangtua ?? "";
    const parentPhoneNumber = normalized.nomortelforangtua ?? "";

    if (name.length < 2) {
      errors.push({ rowNumber, message: "Nama pemain belum diisi dengan benar." });
      return;
    }

    const dateOfBirth = parseDate(dateOfBirthInput);
    if (!dateOfBirth) {
      errors.push({ rowNumber, message: "Tanggal lahir belum benar. Gunakan format YYYY-MM-DD." });
      return;
    }

    const normalizedParentName = normalizeText(parentName);
    if (!normalizedParentName || normalizedParentName.length < 2) {
      errors.push({ rowNumber, message: "Nama orang tua wajib diisi minimal 2 karakter." });
      return;
    }

    const normalizedEmail = normalizeText(email);
    if (normalizedEmail && !SIMPLE_EMAIL_REGEX.test(normalizedEmail)) {
      errors.push({ rowNumber, message: "Format email belum valid." });
      return;
    }

    const mappedGroupNameFromClass = schoolClassInput ? SCHOOL_CLASS_TO_GROUP_NAME[schoolClassInput.trim()] : undefined;

    if (!schoolClassInput.trim() && !groupIdInput.trim() && !groupNameInput.trim()) {
      errors.push({ rowNumber, message: "Kelas kosong. Isi kolom Kelas atau isi kolom Kelompok secara manual." });
      return;
    }

    const resolvedGroupId =
      (groupIdInput && groupsById.has(groupIdInput) ? groupIdInput : undefined) ||
      (groupNameInput ? groupsByName.get(groupNameInput.toLowerCase()) : undefined) ||
      (mappedGroupNameFromClass ? groupsByName.get(mappedGroupNameFromClass.trim().toLowerCase()) : undefined);

    if (!resolvedGroupId) {
      if (schoolClassInput) {
        errors.push({ rowNumber, message: `Kelas \"${schoolClassInput}\" belum dipetakan ke kelompok sistem.` });
      } else {
        errors.push({ rowNumber, message: "Kelompok tidak ditemukan. Cek nama kelompoknya." });
      }
      return;
    }

    validRows.push({
      name,
      dateOfBirth,
      placeOfBirth: normalizeText(placeOfBirth),
      gender: normalizeText(gender),
      weight: normalizeText(weight),
      height: normalizeText(height),
      schoolOrigin: normalizeText(schoolOrigin),
      address: normalizeText(address),
      email: normalizedEmail,
      phoneNumber: normalizePhoneNumber(phoneNumber),
      medicalHistory: normalizeText(medicalHistory),
      parentName: normalizedParentName,
      parentAddress: normalizeText(parentAddress),
      parentPhoneNumber: normalizePhoneNumber(parentPhoneNumber),
      groupId: resolvedGroupId,
    });
  });

  return { validRows, errors };
};

export const buildTemplateWorkbook = async (availableGroups: string[]): Promise<ArrayBuffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Adora Basketball";
  workbook.created = new Date();

  const dataSheet = workbook.addWorksheet("Template Pemain", {
    properties: { defaultRowHeight: 22 },
    views: [{ state: "frozen", ySplit: 4 }],
  });
  dataSheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: {
      left: 0.3,
      right: 0.3,
      top: 0.4,
      bottom: 0.4,
      header: 0.2,
      footer: 0.2,
    },
  };
  dataSheet.properties.tabColor = { argb: BRAND_PURPLE_DARK };

  dataSheet.columns = [
    { key: "no", width: 7 },
    { key: "name", width: 32 },
    { key: "placeOfBirth", width: 22 },
    { key: "dateOfBirth", width: 24 },
    { key: "gender", width: 16 },
    { key: "weight", width: 16 },
    { key: "height", width: 16 },
    { key: "schoolClass", width: 16 },
    { key: "schoolOrigin", width: 24 },
    { key: "address", width: 34 },
    { key: "phoneNumber", width: 24 },
    { key: "email", width: 28 },
    { key: "medicalHistory", width: 28 },
    { key: "parentName", width: 24 },
    { key: "parentAddress", width: 34 },
    { key: "parentPhoneNumber", width: 26 },
    { key: "groupName", width: 24 },
  ];

  dataSheet.mergeCells("A1:Q1");
  const titleRow = dataSheet.getRow(1);
  titleRow.height = 34;
  titleRow.getCell(1).value = "TEMPLATE UPLOAD PEMAIN - ADORA BASKETBALL";
  titleRow.getCell(1).font = { name: TEMPLATE_FONT, size: 14, bold: true, color: { argb: BRAND_WHITE } };
  titleRow.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: BRAND_PURPLE_DARK },
  };
  titleRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" };

  dataSheet.mergeCells("A2:Q2");
  const subtitleRow = dataSheet.getRow(2);
  subtitleRow.height = 26;
  subtitleRow.getCell(1).value = "Isi kolom sesuai contoh. Kolom bertanda (Opsional) boleh dikosongkan.";
  subtitleRow.getCell(1).font = { name: TEMPLATE_FONT, size: 10, color: { argb: BRAND_TEXT_DARK } };
  subtitleRow.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: BRAND_ORANGE_SOFT },
  };
  subtitleRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" };

  dataSheet.getRow(3).height = 10;

  const headerRow = dataSheet.getRow(4);
  headerRow.values = [
    "No.",
    "Nama Lengkap",
    "Tempat Lahir (Opsional)",
    "Tanggal Lahir (YYYY-MM-DD)",
    "Jenis Kelamin (Opsional)",
    "Berat Badan (Opsional)",
    "Tinggi Badan (Opsional)",
    "Kelas",
    "Asal Sekolah (Opsional)",
    "Alamat Rumah (Opsional)",
    "Nomor Telf. (Opsional)",
    "Email (Opsional)",
    "Riwayat Penyakit Bawaan (Opsional)",
    "Nama Orang Tua",
    "Alamat Orang Tua (Opsional)",
    "Nomor Telf. Orang Tua (Opsional)",
    "Kelompok (Opsional)",
  ];
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: BRAND_TEXT_DARK }, name: TEMPLATE_FONT, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: BRAND_ORANGE },
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: false };
    cell.border = {
      top: { style: "thin", color: { argb: BRAND_BORDER } },
      left: { style: "thin", color: { argb: BRAND_BORDER } },
      bottom: { style: "medium", color: { argb: BRAND_BORDER } },
      right: { style: "thin", color: { argb: BRAND_BORDER } },
    };
  });

  dataSheet.addRows([
    {
      no: 1,
      name: "Budi Santoso",
      placeOfBirth: "Depok",
      dateOfBirth: "2012-08-17",
      gender: "Laki-laki",
      weight: "18 kg",
      height: "118 cm",
      schoolClass: "1",
      schoolOrigin: "SDN Gandul 2",
      address: "Jl. Melati No. 10",
      phoneNumber: "081234567890",
      email: "",
      medicalHistory: "",
      parentName: "Devi",
      parentAddress: "Jl. Melati No. 10",
      parentPhoneNumber: "081212300838",
      groupName: "",
    },
    {
      no: 2,
      name: "Nadia Putri",
      placeOfBirth: "Jakarta",
      dateOfBirth: "2011-04-03",
      gender: "Perempuan",
      weight: "",
      height: "",
      schoolClass: "2",
      schoolOrigin: "SDN Gandul 2",
      address: "",
      phoneNumber: "",
      email: "",
      medicalHistory: "Asma ringan",
      parentName: "Suhartini",
      parentAddress: "Gandul, Cinere",
      parentPhoneNumber: "085159717735",
      groupName: "",
    },
  ]);

  dataSheet.autoFilter = {
    from: "A4",
    to: "Q4",
  };

  dataSheet.getColumn(1).numFmt = "0";
  dataSheet.getColumn(4).numFmt = "@";

  [5, 6].forEach((rowNumber) => {
    const row = dataSheet.getRow(rowNumber);
    row.height = 23;
    row.eachCell((cell) => {
      cell.font = { name: TEMPLATE_FONT, size: 11, color: { argb: BRAND_TEXT_DARK } };
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: false };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: rowNumber % 2 === 0 ? BRAND_PURPLE_SOFT : BRAND_WHITE },
      };
      cell.border = {
        top: { style: "thin", color: { argb: BRAND_BORDER_SOFT } },
        left: { style: "thin", color: { argb: BRAND_BORDER_SOFT } },
        bottom: { style: "thin", color: { argb: BRAND_BORDER_SOFT } },
        right: { style: "thin", color: { argb: BRAND_BORDER_SOFT } },
      };
    });

    row.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
    row.getCell(4).alignment = { vertical: "middle", horizontal: "center" };
  });

  const guideSheet = workbook.addWorksheet("Panduan");
  guideSheet.properties.tabColor = { argb: BRAND_PURPLE };
  guideSheet.columns = [{ header: "Panduan Upload", key: "guide", width: 100 }];

  const guideRows = [
    "1) Isi data pada sheet 'Template Pemain' mulai baris contoh.",
    "2) Kolom wajib: Nama Lengkap, Tanggal Lahir (YYYY-MM-DD), Nama Orang Tua.",
    "3) Isi Kelas untuk memakai mapping Kelas -> Kelompok. Jika Kelas kosong, kolom Kelompok wajib diisi.",
    "4) Gunakan format tanggal: YYYY-MM-DD (contoh: 2012-08-17).",
    "5) Nomor telepon gunakan angka saja (boleh diawali +62).",
    "6) Jika email diisi, formatnya harus valid (contoh: nama@email.com).",
    "7) Jika kelas belum terpetakan, data tidak akan tersimpan sampai mapping diperbarui.",
  ];

  guideRows.forEach((text) => {
    guideSheet.addRow({ guide: text });
  });

  guideSheet.getRow(1).font = { name: TEMPLATE_FONT, bold: true, color: { argb: BRAND_WHITE }, size: 12 };
  guideSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: BRAND_PURPLE },
  };

  for (let rowNumber = 2; rowNumber <= guideSheet.rowCount; rowNumber += 1) {
    const row = guideSheet.getRow(rowNumber);
    row.height = 22;
    row.eachCell((cell) => {
      cell.font = { name: TEMPLATE_FONT, size: 10, color: { argb: BRAND_TEXT_DARK } };
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: BRAND_BORDER_SOFT } },
        left: { style: "thin", color: { argb: BRAND_BORDER_SOFT } },
        bottom: { style: "thin", color: { argb: BRAND_BORDER_SOFT } },
        right: { style: "thin", color: { argb: BRAND_BORDER_SOFT } },
      };
    });
  }

  if (availableGroups.length > 0) {
    guideSheet.addRow({ guide: "" });
    const titleRow = guideSheet.addRow({ guide: "Daftar Kelompok yang Tersedia" });
    titleRow.font = { name: TEMPLATE_FONT, bold: true, color: { argb: BRAND_WHITE } };
    titleRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: BRAND_ORANGE },
    };

    availableGroups.forEach((groupName, index) => {
      guideSheet.addRow({ guide: `${index + 1}. ${groupName}` });
    });
  }

  return workbook.xlsx.writeBuffer();
};
