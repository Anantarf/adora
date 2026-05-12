"use client";

import { useState, useEffect } from "react";
import { Settings, FileImage, Loader2, Info, Upload, CheckCircle2, UserCheck } from "lucide-react";
import { useClubSettings, useUpdateClubSetting } from "@/hooks/use-settings";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ASSET_KEYS = [
  { key: "rapor_header_url", label: "Header Rapor (Kop Surat)", description: "Upload Kop Surat Klub (Format: PNG, JPG, atau PDF).", accept: ".png,.jpg,.jpeg,.pdf" },
  { key: "rapor_ceo_sign_url", label: "Tanda Tangan CEO", description: "Upload Tanda Tangan CEO (Format: PNG Transparan).", accept: ".png" },
  { key: "rapor_coach_sign_url", label: "Tanda Tangan Head Coach", description: "Upload Tanda Tangan Head Coach (Format: PNG Transparan).", accept: ".png" },
  { key: "rapor_stamp_url", label: "Stempel Digital", description: "Upload Stempel Resmi ADORA BBC (Format: PNG Transparan).", accept: ".png" },
];

const SIGNER_KEYS = [
  { key: "rapor_coach_name", label: "Nama Head Coach", placeholder: "Contoh: Danuri Akbar" },
  { key: "rapor_ceo_name",   label: "Nama CEO",        placeholder: "Contoh: M. Arief, S.Ak" },
];

export default function SettingsPage() {
  const { data: settings } = useClubSettings();
  const updateSetting = useUpdateClubSetting();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (settings) {
      setLocalValues(settings);
    }
  }, [settings]);

  const handleTextSave = async (key: string, label: string) => {
    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      await updateSetting.mutateAsync({ key, value: localValues[key] ?? "" });
      toast.success(`${label} berhasil disimpan.`);
    } catch {
      toast.error("Gagal menyimpan. Coba lagi.");
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleFileUpload = async (key: string, file: File, label: string) => {
    setUploading((prev) => ({ ...prev, [key]: true }));
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `Upload gagal (${res.status})`);
      }

      setLocalValues((prev) => ({ ...prev, [key]: data.url }));
      await updateSetting.mutateAsync({ key, value: data.url });
      toast.success(`${label} berhasil diunggah.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal mengunggah file.";
      toast.error(msg);
      console.error("[Upload Error]", error);
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
        <p className="text-muted-foreground text-sm font-medium tracking-wide">Kelola aset dan template dokumen resmi ADORA BBC.</p>
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
                          if (file) handleFileUpload(asset.key, file, asset.label);
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
                            {uploading[asset.key] ? "Mengunggah..." : localValues[asset.key] ? "File sudah diunggah" : "Belum ada file dipilih"}
                          </span>
                        </div>
                        <span className="text-micro text-primary px-3 py-1 rounded-lg bg-primary/10">
                          Pilih File
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
                        <div className="size-10 rounded border border-border/50 overflow-hidden bg-white/5 relative flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={`${localValues[asset.key]}?t=${new Date().getTime()}`} 
                            alt="Preview" 
                            crossOrigin="anonymous"
                            className="max-h-full max-w-full object-contain" 
                          />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-foreground truncate max-w-[120px]">Digunakan di Rapor</span>
                        <a href={localValues[asset.key]} target="_blank" className="text-[10px] text-primary hover:underline">Lihat File</a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <UserCheck className="size-5" />
              <CardTitle className="font-heading text-xl uppercase tracking-wider">Nama Penandatangan Rapor</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Nama yang tercantum di bawah tanda tangan pada Rapor PDF.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {SIGNER_KEYS.map(({ key, label, placeholder }) => (
              <div key={key} className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-foreground">{label}</label>
                <div className="flex gap-3">
                  <Input
                    value={localValues[key] ?? ""}
                    onChange={(e) => setLocalValues((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="flex-1"
                  />
                  <button
                    onClick={() => handleTextSave(key, label)}
                    disabled={saving[key]}
                    className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-widest hover:bg-primary/80 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {saving[key] ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                    Simpan
                  </button>
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
              Aset yang belum diunggah tidak akan muncul di Rapor PDF — bagian tersebut akan dikosongkan secara otomatis.
              Pastikan semua aset sudah terunggah sebelum mencetak rapor pemain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
