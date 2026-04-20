"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BatchUploadFilePicker } from "@/components/features/batch-upload/file-picker";
import { BatchUploadPreviewSummary } from "@/components/features/batch-upload/preview-summary";
import { BatchUploadGuide } from "@/components/features/batch-upload/upload-guide";
import { BatchUploadProgress } from "@/components/features/batch-upload/upload-progress";
import { useBatchPlayerUpload } from "@/components/features/batch-upload/use-batch-player-upload";

export function BatchPlayerUpload({ onDone }: { onDone: () => void }) {
  const { acceptedFileFormats, fileInputRef, isGroupsLoading, isProcessing, progress, selectedFile, previewStats, previewErrors, downloadTemplateExcel, handleFileChange, clearSelectedFile, startUpload } = useBatchPlayerUpload(onDone);

  return (
    <div className="space-y-5">
      <BatchUploadGuide />

      <Button type="button" variant="outline" className="w-full h-10 font-medium border-border/60" onClick={downloadTemplateExcel} disabled={isProcessing}>
        <Download className="size-4 mr-2" />
        Unduh Contoh File
      </Button>

      <div className="space-y-3">
        <BatchUploadFilePicker selectedFile={selectedFile} fileInputRef={fileInputRef} acceptedFileFormats={acceptedFileFormats} isProcessing={isProcessing} onFileChange={handleFileChange} onClear={clearSelectedFile} />

        <BatchUploadPreviewSummary previewStats={previewStats} previewErrors={previewErrors} />

        <BatchUploadProgress isProcessing={isProcessing} progress={progress} />

        <Button className="w-full h-11 font-semibold text-sm" onClick={startUpload} disabled={!selectedFile || isProcessing || isGroupsLoading}>
          {isProcessing ? "Sedang Mengunggah..." : "Unggah Data Pemain"}
        </Button>
      </div>
    </div>
  );
}
