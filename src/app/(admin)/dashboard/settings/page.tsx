"use client";

import { useState, useEffect, useRef } from "react";
import { Settings, FileImage, Save, Loader2, Info, Upload, CheckCircle2, XCircle } from "lucide-react";
import { useClubSettings, useUpdateClubSetting } from "@/hooks/use-settings";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ASSET_KEYS = [
  { key: "rapor_header_url", label: "Header Rapor (Kop Surat)", description: "Upload Kop Surat Klub (Format: PNG, JPG, atau PDF).", accept: ".png,.jpg,.jpeg,.pdf" },
  { key: "rapor_ceo_sign_url", label: "Tanda Tangan CEO", description: "Upload Tanda Tangan CEO (Format: PNG Transparan).", accept: ".png" },
  { key: "rapor_coach_sign_url", label: "Tanda Tangan Head Coach", description: "Upload Tanda Tangan Head Coach (Format: PNG Transparan).", accept: ".png" },
  { key: "rapor_stamp_url", label: "Stempel Digital", description: "Upload Stempel Resmi Adora Basketball Club (Format: PNG Transparan).", accept: ".png" },
];

export default function SettingsPage() {
  const { data: settings, isLoading } = useClubSettings();
  const updateSetting = useUpdateClubSetting();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (settings) {
      setLocalValues(settings);
    }
  }, [settings]);

  const handleFileUpload = async (key: string, file: File) => {
    setUploading((prev) => ({ ...prev, [key]: true }));
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setLocalValues((prev) => ({ ...prev, [key]: data.url }));
      await updateSetting.mutateAsync({ key, value: data.url });
      toast.success(`${key.replace(/_/g, " ")} berhasil diunggah!`);
    } catch (error) {
      toast.error("Gagal mengunggah file.");
      console.error(error);
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <Settings className="size-8 text-primary" />
          <h1 className="font-heading text-4xl text-foreground tracking-widest uppercase">Pengaturan Klub</h1>
        </div>
        <p className="text-muted-foreground text-sm font-medium tracking-wide">Kelola aset dan template dokumen resmi ADORA Basketball Club.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <FileImage className="size-5" />
              <CardTitle className="font-heading text-xl uppercase tracking-wider">Template Rapor PDF</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Unggah aset visual untuk Rapor PDF. File akan disimpan secara aman di server.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-8">
            {ASSET_KEYS.map((asset) => (
              <div key={asset.key} className="flex flex-col gap-3 group">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">
                    {asset.label}
                  </label>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{asset.description}</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative group/input">
                      <Input
                        type="file"
                        accept={asset.accept}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(asset.key, file);
                        }}
                        className="hidden"
                        id={`file-${asset.key}`}
                      />
                      <label
                        htmlFor={`file-${asset.key}`}
                        className="flex items-center justify-between px-4 h-12 rounded-xl border border-dashed border-border/50 bg-background/50 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {uploading[asset.key] ? (
                            <Loader2 className="size-4 animate-spin text-primary" />
                          ) : localValues[asset.key] ? (
                            <CheckCircle2 className="size-4 text-emerald-500" />
                          ) : (
                            <Upload className="size-4 text-muted-foreground" />
                          )}
                          <span className="text-xs font-medium text-muted-foreground truncate max-w-[200px]">
                            {uploading[asset.key] ? "Mengunggah..." : localValues[asset.key] ? localValues[asset.key].split("-").pop() : "Pilih file..."}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-3 py-1 rounded-lg bg-primary/10">
                          Browse
                        </span>
                      </label>
                    </div>
                  </div>

                  {localValues[asset.key] && (
                    <div className="flex items-center gap-3 p-2 rounded-xl border border-border/50 bg-background/50 min-w-[200px]">
                      {localValues[asset.key].endsWith(".pdf") ? (
                        <div className="size-10 rounded bg-red-500/10 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-red-500">PDF</span>
                        </div>
                      ) : (
                        <div className="size-10 rounded border border-border/50 overflow-hidden bg-white/5">
                          <img src={localValues[asset.key]} alt="Preview" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-foreground truncate max-w-[120px]">File Aktif</span>
                        <a href={localValues[asset.key]} target="_blank" className="text-[9px] text-primary hover:underline">Lihat Full</a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
          <Info className="size-5 text-primary shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold text-primary uppercase tracking-widest">Informasi Penting</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Jika URL dikosongkan, Rapor PDF akan menggunakan template default (teks biasa) tanpa gambar aset. 
              Pastikan URL gambar dapat diakses secara publik dan menggunakan format yang didukung (PNG/JPG).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
