"use client";

import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useAddBatchPlayers } from "@/hooks/use-players";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, UploadCloud, FileSpreadsheet, FileType2 } from "lucide-react";
import { useSession } from "next-auth/react";

export function BatchPlayerUpload({ onDone }: { onDone: () => void }) {
  const { data: session } = useSession();
  const { mutateAsync: addBatchPlayers } = useAddBatchPlayers();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const processPayload = async (rows: any[]) => {
    if (rows.length === 0) {
      setIsProcessing(false);
      return toast.error("File data kosong atau tidak terbaca.");
    }

    setProgress(50);
    
    const payload = rows.map((row, i) => ({
      name: row.name || row.Name || row.NAMA || `Athlete ${i}`,
      dateOfBirth: row.dateOfBirth || row.DOB || row.BIRTHDATE || "2010-01-01",
      schoolOrigin: row.schoolOrigin || row.SCHOOL || row.SEKOLAH || "Private Enrollment",
      groupId: row.groupId || row.GROUP_ID || row.GRUP || "", 
      parentId: (session?.user as any)?.id ?? "",
    }));

    try {
      const response = await addBatchPlayers(payload);
      setProgress(100);
      toast.success(`Berhasil! ${response?.count || payload.length} atlet telah diserap ke MySQL Adora.`);
      onDone();
    } catch (error) {
      toast.error("Gagal melakukan Bulk Insert. Cek format kolom Anda.");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    setIsProcessing(true);

    if (extension === "csv") {
      // Logic Parsing CSV (Existing)
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => processPayload(results.data),
        error: () => {
          toast.error("Gagal membaca file CSV");
          setIsProcessing(false);
        }
      });
    } else if (extension === "xlsx" || extension === "xls") {
      // Logic Parsing Excel (New Feature)
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0]; // Ambil Sheet Pertama
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          processPayload(data);
        } catch (err) {
          toast.error("Format Excel tidak valid.");
          setIsProcessing(false);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      toast.error("Hanya file .xlsx atau .csv yang didukung.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-[2rem] p-10 bg-primary/[0.02] hover:bg-primary/[0.05] transition-all duration-500">
      <div className="size-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-inner ring-1 ring-primary/20">
        {isProcessing ? <Loader2 className="animate-spin size-10" /> : <FileSpreadsheet className="size-10" />}
      </div>
      
      <div className="text-center space-y-2 mb-8">
        <h3 className="text-foreground font-heading uppercase tracking-[0.3em] text-sm">
          {isProcessing ? `Menyerap Data... ${progress}%` : "Drop Excel / CSV Batch"}
        </h3>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">
          Gunakan Header: name, dateOfBirth, schoolOrigin, groupId
        </p>
      </div>
      
      <div className="relative group/input">
        <Button variant="outline" className="w-full relative z-10 pointer-events-none gap-3 h-14 px-8 rounded-2xl bg-background/50 border-primary/20 hover:border-primary group-hover/input:border-primary transition-all font-bold uppercase tracking-widest text-xs">
           <FileType2 className="size-5 text-primary" /> Pilih File Spreadsheet
        </Button>
        <input 
          type="file" 
          accept=".xlsx,.xls,.csv"
          disabled={isProcessing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          onChange={handleFileUpload}
        />
      </div>

      <div className="mt-8 p-4 rounded-xl bg-secondary/50 border border-white/5 flex gap-3 items-start">
         <div className="size-2 rounded-full bg-primary mt-1.5 animate-pulse" />
         <p className="text-[9px] text-white/40 leading-relaxed uppercase font-black tracking-widest text-left">
           Sistem akan mendeteksi otomatis data pada Sheet pertama dan melakukan pembersihan entitas sebelum disimpan ke MySQL.
         </p>
      </div>
    </div>
  );
}
