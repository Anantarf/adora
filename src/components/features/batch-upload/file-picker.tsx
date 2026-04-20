import type { ChangeEvent, RefObject } from "react";
import { FileSpreadsheet, FileUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BatchUploadFilePickerProps = {
  selectedFile: File | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  acceptedFileFormats: string;
  isProcessing: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
};

export function BatchUploadFilePicker({ selectedFile, fileInputRef, acceptedFileFormats, isProcessing, onFileChange, onClear }: BatchUploadFilePickerProps) {
  if (!selectedFile) {
    return (
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-border/50 rounded-xl p-8
            flex flex-col items-center justify-center gap-4 cursor-pointer
            transition-all hover:border-primary/50 hover:bg-primary/5"
      >
        <input type="file" ref={fileInputRef} className="hidden" accept={acceptedFileFormats} onChange={onFileChange} />
        <div className="size-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <FileUp className="size-8" />
        </div>
        <div className="text-center">
          <h4 className="font-heading text-lg text-foreground">Pilih Berkas Excel</h4>
          <p className="text-sm text-muted-foreground font-medium">Pilih atau tarik berkas .xlsx ke area ini</p>
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 mt-2">Kapasitas maksimal: 1.000 data pemain</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-border/50 bg-card flex items-center justify-between gap-3">
      <div className="flex items-center gap-4">
        <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <FileSpreadsheet className="size-6" />
        </div>
        <div className="min-w-0">
          <h4 className="font-heading text-sm font-bold truncate max-w-60">{selectedFile.name}</h4>
          <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB - siap diperiksa</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onClear} disabled={isProcessing} className="hover:text-destructive">
        <X className="size-4" />
      </Button>
    </div>
  );
}
