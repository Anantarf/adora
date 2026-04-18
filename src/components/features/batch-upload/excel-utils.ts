import ExcelJS from "exceljs";

export type RawCsvRow = Record<string, unknown>;

export type UploadRowError = {
  rowNumber: number;
  message: string;
};

export type NormalizedPlayerPayload = {
  name: string;
  dateOfBirth: string;
  schoolOrigin?: string;
  phoneNumber?: string;
  groupId: string;
};

export type PreflightResult = {
  validRows: NormalizedPlayerPayload[];
  errors: UploadRowError[];
};

export const XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const ACCEPTED_EXCEL_FILE_FORMATS = `.xlsx,${XLSX_MIME_TYPE}`;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
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
    const schoolOrigin = normalized.asalsekolah ?? normalized.sekolahasal ?? normalized.schoolorigin ?? normalized.school ?? normalized.sekolah ?? "";
    const groupIdInput = normalized.groupid ?? normalized.idkelompok ?? normalized.grupid ?? "";
    const groupNameInput = normalized.kelompok ?? normalized.kelompokumur ?? normalized.kelompokumurganjil ?? normalized.namakelompok ?? normalized.groupname ?? "";
    const phoneNumber = normalized.notelf ?? normalized.nohp ?? normalized.telepon ?? normalized.phonenumber ?? normalized.phone ?? normalized.hp ?? "";

    if (name.length < 2) {
      errors.push({ rowNumber, message: "Nama pemain belum diisi dengan benar." });
      return;
    }

    const dateOfBirth = parseDate(dateOfBirthInput);
    if (!dateOfBirth) {
      errors.push({ rowNumber, message: "Tanggal lahir belum benar. Gunakan format YYYY-MM-DD." });
      return;
    }

    const resolvedGroupId = groupIdInput && groupsById.has(groupIdInput) ? groupIdInput : groupNameInput ? groupsByName.get(groupNameInput.toLowerCase()) : undefined;

    if (!resolvedGroupId) {
      errors.push({ rowNumber, message: "Kelompok tidak ditemukan. Cek nama kelompoknya." });
      return;
    }

    validRows.push({
      name,
      dateOfBirth,
      schoolOrigin: schoolOrigin || undefined,
      phoneNumber: phoneNumber || undefined,
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
    { key: "dateOfBirth", width: 30 },
    { key: "schoolOrigin", width: 28 },
    { key: "phoneNumber", width: 24 },
    { key: "groupName", width: 28 },
  ];

  dataSheet.mergeCells("A1:F1");
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

  dataSheet.mergeCells("A2:F2");
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
  headerRow.values = ["No.", "Nama Lengkap", "Tanggal Lahir (YYYY-MM-DD)", "Asal Sekolah (Opsional)", "No. Telepon (Opsional)", "Kelompok"];
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
      dateOfBirth: "2012-08-17",
      schoolOrigin: "SMP Negeri 1",
      phoneNumber: "+6281234567890",
      groupName: "KU 16 Putra",
    },
    {
      no: 2,
      name: "Nadia Putri",
      dateOfBirth: "2011-04-03",
      schoolOrigin: "",
      phoneNumber: "",
      groupName: "KU 16 Putri",
    },
  ]);

  dataSheet.autoFilter = {
    from: "A4",
    to: "F4",
  };

  dataSheet.getColumn(1).numFmt = "0";
  dataSheet.getColumn(3).numFmt = "@";

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
    row.getCell(3).alignment = { vertical: "middle", horizontal: "center" };
  });

  const guideSheet = workbook.addWorksheet("Panduan");
  guideSheet.properties.tabColor = { argb: BRAND_PURPLE };
  guideSheet.columns = [{ header: "Panduan Upload", key: "guide", width: 100 }];

  const guideRows = [
    "1) Isi data pada sheet 'Template Pemain' mulai baris contoh.",
    "2) Kolom wajib: Nama Lengkap, Tanggal Lahir (YYYY-MM-DD), Kelompok.",
    "3) Kolom opsional: Asal Sekolah, No. Telepon — boleh dikosongkan.",
    "4) Gunakan format tanggal: YYYY-MM-DD (contoh: 2012-08-17).",
    "5) Kolom Kelompok wajib sesuai nama kelompok di sistem.",
    "6) Format No. Telepon bebas (contoh: +6281234567890 atau 081234567890).",
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
