import { Info } from "lucide-react";

export function BatchUploadGuide() {
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Info className="size-4 text-primary" />
        Upload Data Pemain dari Excel
      </div>
      <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal pl-5">
        <li>Unduh contoh file, lalu isi data pemain.</li>
        <li>Template ini tidak memakai kolom ID orang tua.</li>
        <li>Pastikan nama kelompok sama seperti di sistem.</li>
        <li>Upload file Excel, lalu simpan.</li>
      </ol>
    </div>
  );
}
