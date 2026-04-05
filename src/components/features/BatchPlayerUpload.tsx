"use client";

import { useState } from "react";
import Papa from "papaparse";
import { useAddBatchPlayers } from "@/hooks/use-players";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, UploadCloud, FileType2 } from "lucide-react";
import { useSession } from "next-auth/react";

export function BatchPlayerUpload({ onDone }: { onDone: () => void }) {
  const { data: session } = useSession();
  const { mutateAsync: addBatchPlayers } = useAddBatchPlayers();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      return toast.error("Format file harus CSV");
    }

    setIsProcessing(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        
        if (rows.length === 0) {
           setIsProcessing(false);
           return toast.error("File CSV kosong.");
        }

        setProgress(50); // Parsing selesai
        
        // Membungkus semuanya menjadi satu payload Bulk Insert (Lean Architecture)
        const payload = rows.map((row, i) => ({
           name: row.name || `Athlete ${i}`,
           dateOfBirth: row.dateOfBirth || "2010-01-01",
           schoolOrigin: row.schoolOrigin || "Private Enrollment",
           groupId: row.groupId || "", 
           parentId: (session?.user as any)?.id ?? "",
        }));

        try {
          // Melakukan tembakan 1 kali saja (*Single HTTP Request for Batch Data*)
          const response = await addBatchPlayers(payload);
          setProgress(100);
          toast.success(`Sistem MySQL berhasil menyerap ${response?.count || payload.length} profil atlet sekaligus!`);
          onDone();
        } catch (error) {
          toast.error("Gagal melakukan Bulk Insert. Format data mungkin bermasalah.");
        } finally {
          setIsProcessing(false);
          setProgress(0);
        }
      },
      error: () => {
        toast.error("Gagal membaca file CSV");
        setIsProcessing(false);
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-xl p-8 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition-colors">
      <div className="size-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4">
        {isProcessing ? <Loader2 className="animate-spin size-8" /> : <UploadCloud className="size-8" />}
      </div>
      <h3 className="text-foreground font-bold uppercase tracking-widest text-xs mb-2">
        {isProcessing ? `Memproses Data... ${progress}%` : "Drop File CSV Batch"}
      </h3>
      <p className="text-[10px] text-muted-foreground text-center max-w-xs mb-6 uppercase tracking-widest font-medium">
        Harap gunakan Header: <strong className="text-foreground font-bold tracking-tighter">name, dateOfBirth, schoolOrigin, groupId</strong>.
      </p>
      
      <div className="relative">
        <Button variant="outline" className="w-full relative z-10 pointer-events-none gap-2">
           <FileType2 className="size-4 text-primary" /> Pilih File CSV
        </Button>
        <input 
          type="file" 
          accept=".csv"
          disabled={isProcessing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
}
