
import { useMemo, useRef, useState, type ChangeEvent, type RefObject } from "react";
import ExcelJS from "exceljs";
import { toast } from "sonner";
import { useAddBatchPlayers } from "@/hooks/use-players";
import { useGroups } from "@/hooks/use-groups";
import { ACCEPTED_EXCEL_FILE_FORMATS, XLSX_MIME_TYPE, buildTemplateWorkbook, isSupportedExcelFile, normalizeAndValidateRows, readWorksheetRows, type RawCsvRow, type UploadRowError } from "@/components/features/batch-upload/excel-utils";
import { downloadBlobFile } from "@/components/features/batch-upload/download-file";

type PreviewStats = { total: number; valid: number; invalid: number } | null;

type PreviewState = {
  stats: PreviewStats;
  errors: UploadRowError[];
};

const EMPTY_PREVIEW: PreviewState = {
  stats: null,
  errors: [],
};

// Public contract for batch upload flow used by the view component.
export type UseBatchPlayerUploadResult = {
  acceptedFileFormats: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isGroupsLoading: boolean;
  isProcessing: boolean;
  progress: number;
  selectedFile: File | null;
  previewStats: PreviewStats;
  previewErrors: UploadRowError[];
  downloadTemplateExcel: () => Promise<void>;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  clearSelectedFile: () => void;
  startUpload: () => Promise<void>;
};

// Handles batch-upload orchestration: file validation, Excel parsing, preflight checks, and submission.
export function useBatchPlayerUpload(onDone: () => void): UseBatchPlayerUploadResult {
  const { mutateAsync: addBatchPlayers } = useAddBatchPlayers();
  const { data: groups, isLoading: isGroupsLoading } = useGroups();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewState>(EMPTY_PREVIEW);

  const groupsById = useMemo(() => new Set((groups ?? []).map((group) => group.id)), [groups]);
  const groupsByName = useMemo(() => new Map((groups ?? []).map((group) => [group.name.trim().toLowerCase(), group.id])), [groups]);

  const clearPreview = () => {
    setPreview(EMPTY_PREVIEW);
  };

  const resetProcessingState = () => {
    setIsProcessing(false);
    setProgress(0);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    clearPreview();
  };

  const notifyError = (message: string) => {
    toast.error(message);
  };

  const downloadTemplateExcel = async () => {
    try {
      const availableGroups = (groups ?? []).map((group) => group.name);
      const buffer = await buildTemplateWorkbook(availableGroups);
      const blob = new Blob([buffer], {
        type: XLSX_MIME_TYPE,
      });
      downloadBlobFile(blob, "template-upload-pemain.xlsx");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan saat membuat template.";
      toast.error(`Gagal membuat template: ${message}`);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (isSupportedExcelFile(file)) {
      setSelectedFile(file);
      clearPreview();
      return;
    }

    clearSelectedFile();
    toast.error("Silakan pilih file Excel .xlsx.");
  };

  const processPayload = async (rows: RawCsvRow[]) => {
    if (rows.length === 0) {
      resetProcessingState();
      notifyError("Data di file belum terbaca. Cek isi file Anda.");
      return;
    }

    setProgress(55);
    const preflight = normalizeAndValidateRows(rows, groupsById, groupsByName);
    setPreview({
      stats: {
        total: rows.length,
        valid: preflight.validRows.length,
        invalid: preflight.errors.length,
      },
      errors: preflight.errors.slice(0, 8),
    });

    if (preflight.validRows.length === 0) {
      resetProcessingState();
      notifyError("Belum ada data yang bisa disimpan. Periksa lagi isinya.");
      return;
    }

    if (preflight.errors.length > 0) {
      resetProcessingState();
      notifyError(`Ada ${preflight.errors.length} baris yang perlu diperbaiki dulu.`);
      return;
    }

    setProgress(80);

    try {
      const response = await addBatchPlayers(preflight.validRows);
      setProgress(100);

      const insertedCount = response?.count ?? preflight.validRows.length;
      const submittedCount = response?.submitted ?? preflight.validRows.length;
      const duplicateOrSkippedCount = Math.max(0, submittedCount - insertedCount);

      toast.success(duplicateOrSkippedCount > 0 ? `Upload selesai. Masuk: ${insertedCount}, dilewati: ${duplicateOrSkippedCount}.` : `Berhasil! ${insertedCount} pemain berhasil diunggah.`);
      onDone();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Silakan cek lagi isi file Anda.";
      toast.error("Gagal menyimpan data: " + message);
    } finally {
      resetProcessingState();
    }
  };

  const startUpload = async () => {
    if (!selectedFile) {
      notifyError("Pilih file Excel terlebih dahulu.");
      return;
    }

    if (isGroupsLoading) {
      notifyError("Daftar kelompok masih dimuat. Coba lagi sebentar.");
      return;
    }

    setIsProcessing(true);
    setProgress(15);
    clearPreview();

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const firstSheet = workbook.worksheets[0];

      if (!firstSheet) {
        throw new Error("File tidak punya lembar data.");
      }

      setProgress(35);
      const rows = readWorksheetRows(firstSheet);
      await processPayload(rows);
    } catch (error) {
      const message = error instanceof Error ? error.message : "File tidak bisa dibaca.";
      toast.error("Gagal membaca file Excel: " + message);
      resetProcessingState();
    }
  };

  return {
    acceptedFileFormats: ACCEPTED_EXCEL_FILE_FORMATS,
    fileInputRef,
    isGroupsLoading,
    isProcessing,
    progress,
    selectedFile,
    previewStats: preview.stats,
    previewErrors: preview.errors,
    downloadTemplateExcel,
    handleFileChange,
    clearSelectedFile,
    startUpload,
  };
}
