import { Info } from "lucide-react";

export function BatchUploadGuide() {
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Info className="size-4 text-primary" />
        Petunjuk Pengisian Data Excel
      </div>
      <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal pl-5">
        <li>Unduh contoh file dan lengkapi data pemain sesuai format.</li>
        <li>Isi kolom Kelas agar sistem dapat membantu menentukan kategori kelompok secara otomatis.</li>
        <li>Gunakan kolom Kelompok jika Anda ingin menentukan sendiri grup pilihan untuk pemain tersebut.</li>
        <li>Pastikan seluruh informasi sudah akurat sebelum mengunggah berkas Excel.</li>
        <li>Klik tombol simpan untuk mendaftarkan seluruh pemain ke dalam sistem.</li>
      </ol>
    </div>
  );
}
