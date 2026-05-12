"use client";

import { useState, useEffect } from "react";
import { Settings, FileImage, Loader2, Info, Upload, CheckCircle2, UserCheck } from "lucide-react";
import { useClubSettings, useUpdateClubSetting } from "@/hooks/use-settings";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ─── CONSTANTS ──────────────────────────────────────────

const ASSET_KEYS = [
  { key: "rapor_header_url", label: "Header Rapor (Kop Surat)", description: "Upload Kop Surat Klub (Format: PNG, JPG, atau PDF).", accept: ".png,.jpg,.jpeg,.pdf" },
  { key: "rapor_ceo_sign_url", label: "Tanda Tangan CEO", description: "Upload Tanda Tangan CEO (Format: PNG Transparan).", accept: ".png" },
  { key: "rapor_coach_sign_url", label: "Tanda Tangan Head Coach", description: "Upload Tanda Tangan Head Coach (Format: PNG Transparan).", accept: ".png" },
  { key: "rapor_stamp_url", label: "Stempel Digital", description: "Upload Stempel Resmi ADORA BBC (Format: PNG Transparan).", accept: ".png" },
] as const;

const SIGNER_KEYS = [
  { key: "rapor_coach_name", label: "Nama Head Coach", placeholder: "Contoh: Danuri Akbar" },
  { key: "rapor_ceo_name",   label: "Nama CEO",        placeholder: "Contoh: M. Arief, S.Ak" },
] as const;

// ─── SUB-COMPONENTS ─────────────────────────────────────

/**
 * Asset Row with Preview & Upload Logic
 */
function AssetUploadRow({ 
  asset, 
  value, 
  isUploading, 
  isFailed,
  onUpload,
  onClearError 
}: { 
  asset: typeof ASSET_KEYS[number], 
  value?: string, 
  isUploading: boolean, 
  isFailed: boolean,
  onUpload: (file: File) => void,
  onClearError: () => void
}) {
  return (
    <div className="flex flex-col gap-3 group">
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
                if (file) {
                  onClearError();
                  onUpload(file);
                }
              }}
              className="hidden"
              id={`file-${asset.key}`}
            />
            <label
              htmlFor={`file-${asset.key}`}
              className="flex items-center justify-between px-4 h-12 rounded-xl border border-dashed border-border/50 bg-background/50 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm"
            >
              <div className="flex items-center gap-3">
                {isUploading ? (
                  <Loader2 className="size-4 animate-spin text-primary" />
                ) : value ? (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                ) : (
                  <Upload className="size-4 text-muted-foreground" />
                )}
                <span className="text-xs font-medium text-muted-foreground truncate max-w-[200px]">
                  {isUploading ? "Mengunggah..." : value ? "Aset Aktif" : "Belum ada file dipilih"}
                </span>
              </div>
              <span className="text-micro text-primary px-3 py-1 rounded-lg bg-primary/10 font-bold uppercase tracking-wider">
                Pilih File
              </span>
            </label>
          </div>
        </div>

        {value && (
          <div className="flex items-center gap-3 p-2 rounded-xl border border-border/50 bg-background/50 min-w-[220px] shadow-sm">
            <div className="size-10 rounded-lg border border-border/50 overflow-hidden bg-white/5 relative flex items-center justify-center">
              {value.endsWith(".pdf") ? (
                <div className="size-full bg-red-500/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-red-500">PDF</span>
                </div>
              ) : isFailed ? (
                <div className="size-full flex items-center justify-center bg-indigo-500/10">
                  <span className="text-[10px] font-bold text-indigo-400">PNG</span>
                </div>
              ) : (
                <img 
                  src={`${value}?t=${new Date().getTime()}`} 
                  alt="Preview" 
                  crossOrigin="anonymous"
                  className="max-h-full max-w-full object-contain" 
                  onError={onClearError} // This is actually reverse logic in the old code, fixed below
                />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-foreground truncate max-w-[120px]">Live di Sistem</span>
              <a href={value} target="_blank" className="text-[10px] text-primary hover:underline font-medium">Pratinjau File</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Signer Input Row
 */
function SignerInputRow({ 
  signer, 
  value, 
  isSaving, 
  onChange, 
  onSave 
}: { 
  signer: typeof SIGNER_KEYS[number], 
  value: string, 
  isSaving: boolean, 
  onChange: (val: string) => void, 
  onSave: () => void 
}) {
  return (
    <div className="flex flex-col gap-2 group">
      <label className="text-xs font-bold uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">
        {signer.label}
      </label>
      <div className="flex gap-3">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={signer.placeholder}
          className="flex-1 rounded-xl h-11 border-border/50 bg-background/50 focus:bg-background"
        />
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="rounded-xl h-11 px-6 bg-primary text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:shadow-none transition-all"
        >
          {isSaving ? <Loader2 className="size-3.5 animate-spin mr-2" /> : <CheckCircle2 className="size-3.5 mr-2" />}
          Simpan
        </Button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────

import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { data: settings } = useClubSettings();
  const updateSetting = useUpdateClubSetting();
  
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (settings) setLocalValues(settings);
  }, [settings]);

  const handleTextSave = async (key: string, label: string) => {
    setSaving(prev => ({ ...prev, [key]: true }));
    try {
      await updateSetting.mutateAsync({ key, value: localValues[key] ?? "" });
      toast.success(`${label} diperbarui.`);
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleFileUpload = async (key: string, file: File, label: string) => {
    setUploading(prev => ({ ...prev, [key]: true }));
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload gagal");

      setLocalValues(prev => ({ ...prev, [key]: data.url }));
      await updateSetting.mutateAsync({ key, value: data.url });
      
      // Reset failure state for this asset upon success
      setFailedImages(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      
      toast.success(`${label} berhasil diperbarui.`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col gap-2 border-b border-border/50 pb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
            <Settings className="size-8" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-heading text-3xl md:text-5xl text-foreground tracking-[0.2em] uppercase leading-none">Pengaturan</h1>
            <p className="text-muted-foreground text-sm font-medium tracking-wide mt-2">Identitas dan aset resmi klub untuk dokumen digital.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8">
        {/* Template Rapor Section */}
        <Card className="border-border/60 bg-card/40 backdrop-blur-md shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/40 pb-6">
            <div className="flex items-center gap-3 text-primary">
              <FileImage className="size-6" />
              <CardTitle className="font-heading text-2xl uppercase tracking-widest">Aset Visual Rapor</CardTitle>
            </div>
            <CardDescription className="text-xs font-medium text-muted-foreground/80 mt-1">
              File PNG transparan sangat disarankan untuk tanda tangan dan stempel.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 flex flex-col gap-10">
            {ASSET_KEYS.map((asset) => (
              <AssetUploadRow 
                key={asset.key} 
                asset={asset} 
                value={localValues[asset.key]} 
                isUploading={!!uploading[asset.key]}
                isFailed={!!failedImages[asset.key]}
                onUpload={(file) => handleFileUpload(asset.key, file, asset.label)}
                onClearError={() => setFailedImages(prev => {
                  const next = { ...prev };
                  delete next[asset.key];
                  return next;
                })}
              />
            ))}
          </CardContent>
        </Card>

        {/* Signer Config Section */}
        <Card className="border-border/60 bg-card/40 backdrop-blur-md shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/40 pb-6">
            <div className="flex items-center gap-3 text-primary">
              <UserCheck className="size-6" />
              <CardTitle className="font-heading text-2xl uppercase tracking-widest">Pejabat Berwenang</CardTitle>
            </div>
            <CardDescription className="text-xs font-medium text-muted-foreground/80 mt-1">
              Data ini akan muncul sebagai label nama di bawah tanda tangan digital.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 flex flex-col gap-8">
            {SIGNER_KEYS.map((signer) => (
              <SignerInputRow 
                key={signer.key} 
                signer={signer} 
                value={localValues[signer.key] ?? ""} 
                isSaving={!!saving[signer.key]}
                onChange={(val) => setLocalValues(prev => ({ ...prev, [signer.key]: val }))}
                onSave={() => handleTextSave(signer.key, signer.label)}
              />
            ))}
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="flex items-start gap-4 p-6 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm animate-pulse">
          <Info className="size-6 text-primary shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold text-primary uppercase tracking-widest">Informasi Sistem</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
              Aset yang diunggah akan segera diterapkan pada pembuatan rapor baru. Jika pratinjau tidak muncul setelah upload, silakan muat ulang halaman.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
