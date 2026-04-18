"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { useAddBatchPlayers } from "@/hooks/use-players";
import { useParents } from "@/hooks/use-family";
import { toast } from "sonner";
import { FileUp, Loader2, Info, FileSpreadsheet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function BatchPlayerUpload({ onDone }: { onDone: () => void }) {
  const { mutateAsync: addBatchPlayers } = useAddBatchPlayers();
  const { data: parents, isLoading: isParentsLoading } = useParents();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [defaultParentId, setDefaultParentId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "text/csv") {
      setSelectedFile(file);
    } else if (file) {
      toast.error("Hanya file .CSV yang diizinkan.");
    }
  };

  const startUpload = () => {
    if (!selectedFile) return toast.error("Pilih file CSV terlebih dahulu.");
    if (!defaultParentId) return toast.error("Pilih akun Orang Tua / Wali sebagai default.");

    setIsProcessing(true);
    setProgress(10);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setProgress(30);
        await processPayload(results.data as Record<string, string>[]);
      },
      error: (error) => {
        toast.error("Gagal membaca file: " + error.message);
        setIsProcessing(false);
      },
    });
  };

  const processPayload = async (rows: Record<string, string>[]) => {
    if (rows.length === 0) {
      setIsProcessing(false);
      return toast.error("File data kosong atau tidak terbaca.");
    }

    setProgress(60);

    // Transform rows to match backend schema
    const payload = rows.map((row, i) => ({
      name: row.name || row.Name || row.NAMA || `Athlete ${i}`,
      dateOfBirth: row.dateOfBirth || row.DOB || row.BIRTHDATE || "2010-01-01",
      schoolOrigin: row.schoolOrigin || row.SCHOOL || row.SEKOLAH || "Private Enrollment",
      groupId: row.groupId || row.GROUP_ID || row.GRUP || "",
      parentId: row.parentId || row.PARENT_ID || defaultParentId,
    }));

    try {
      const response = await addBatchPlayers(payload);
      setProgress(100);
      toast.success(`Berhasil! ${response?.count || payload.length} pemain telah diserap ke MySQL Adora.`);
      onDone();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Cek format kolom Anda.";
      toast.error("Gagal melakukan Bulk Insert: " + msg);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 flex gap-3 items-start">
        <Info className="size-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Panduan Format File</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pastikan file .csv memiliki header: <code className="text-primary font-bold">name, dateOfBirth, schoolOrigin, groupId</code>. Format tanggal: YYYY-MM-DD. Kolom parentId opsional.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">Default Orang Tua / Wali</label>
        <Select value={defaultParentId} onValueChange={(val) => setDefaultParentId(val || "")} disabled={isParentsLoading || isProcessing}>
          <SelectTrigger className="h-11 bg-background/50">
            <SelectValue placeholder={isParentsLoading ? "Memuat..." : "Pilih Akun Penanggung Jawab"} />
          </SelectTrigger>
          <SelectContent>
            {parents?.map((parent) => (
              <SelectItem key={parent.id} value={parent.id} className="font-medium text-sm">
                {parent.name || parent.username || parent.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {!selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border/40 rounded-lg p-12
            flex flex-col items-center justify-center gap-4 cursor-pointer
            transition-all hover:border-primary/50 hover:bg-primary/5"
          >
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileChange} />
            <div className="size-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FileUp className="size-8" />
            </div>
            <div className="text-center">
              <h4 className="font-heading text-sm uppercase tracking-widest text-foreground">Pilih File CSV</h4>
              <p className="text-xs font-medium text-muted-foreground uppercase opacity-60">Baris data tidak terbatas</p>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-lg border border-border/50 bg-card flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <FileSpreadsheet className="size-6" />
              </div>
              <div>
                <h4 className="font-heading text-sm font-bold truncate max-w-[200px]">{selectedFile.name}</h4>
                <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)} disabled={isProcessing} className="hover:text-destructive">
              <X className="size-4" />
            </Button>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-3">
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-center gap-2 text-primary">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-xs font-semibold uppercase tracking-widest">Sinkronisasi {progress}%</span>
            </div>
          </div>
        )}

        <Button
          className="w-full h-11 font-bold uppercase tracking-widest text-xs"
          onClick={startUpload}
          disabled={!selectedFile || isProcessing}
        >
          {isProcessing ? "Mohon Tunggu..." : "Mulai Unggah & Sinkron"}
        </Button>
      </div>
    </div>
  );
}
