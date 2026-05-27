"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CheckCircle2, FileImage, FileText, Info, Loader2, Settings, Upload, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useClubSettings, useUpdateClubSetting } from "@/hooks/use-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { ASSET_KEYS, SIGNER_KEYS, getAssetPreviewMeta, type AssetKey } from "./constants";

export default function SettingsPage() {
  const { data: settings } = useClubSettings();
  const updateSetting = useUpdateClubSetting();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalValues(settings);
    }
  }, [settings]);

  const handlePreviewPdf = async () => {
    setIsPreviewLoading(true);
    try {
      const { generateRaporPDF } = await import("@/lib/generate-rapor-pdf");
      await generateRaporPDF({
        playerName: "Muhammad Arya Putra",
        groupName: "KU-12 Depok",
        schoolOrigin: "SD Sukamaju",
        periodName: "Evaluasi Mei 2026",
        metrics: {
          dribble: {
            inAndOut: 85,
            crossover: 80,
            vLeft: 75,
            vRight: 80,
            betweenLegsLeft: 70,
            betweenLegsRight: 75,
          },
          passing: {
            chestPass: 85,
            bouncePass: 80,
            overheadPass: 75,
          },
          layUp: 80,
          shooting: 75,
          notes: "Arya menunjukkan performa dribble yang sangat solid dan konsisten selama sesi latihan. Kerjasama tim dan akurasi passing juga sangat baik. Pertahankan fokus saat melakukan shooting.",
        },
        assets: {
          headerUrl: localValues.rapor_header_url || undefined,
          ceoSignUrl: localValues.rapor_ceo_sign_url || undefined,
          coachSignUrl: localValues.rapor_coach_sign_url || undefined,
          stampUrl: localValues.rapor_stamp_url || undefined,
        },
        signers: {
          coachName: localValues.rapor_coach_name || "Head Coach",
          ceoName: localValues.rapor_ceo_name || "CEO ADORA BBC",
        },
        printDate: new Date(),
        action: "preview",
      });
      toast.success("Pratinjau rapor berhasil dibuka di tab baru.");
    } catch (error) {
      console.error("[PDF Preview Error]", error);
      toast.error("Gagal membuat pratinjau PDF.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

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

  const handleFileUpload = async (key: AssetKey, file: File, label: string) => {
    const maxSizeBytes = key === "rapor_header_url" ? 2 * 1024 * 1024 : 1 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`Ukuran file ${label} terlalu besar. Batas maksimal adalah ${key === "rapor_header_url" ? "2MB" : "1MB"}.`);
      return;
    }

    setUploading((prev) => ({ ...prev, [key]: true }));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("assetKey", key);

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
      setFailedImages((prev) => ({ ...prev, [key]: false }));
      await updateSetting.mutateAsync({ key, value: data.url });
      toast.success(`${label} berhasil diunggah.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal mengunggah file.";
      const errorMsg = msg?.includes("Prisma") || msg?.includes("Unique constraint")
        ? "Terjadi kesalahan pada sistem. Silakan coba kembali."
        : msg;
      toast.error(errorMsg || "Gagal menyimpan pengaturan.");
      console.error("[Upload Error]", error);
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-12">
      <div className="flex flex-col gap-1 border-b border-border/50 pb-6 md:pb-8">
        <div className="flex items-center gap-3">
          <Settings className="size-8 text-primary" />
          <h1 className="font-heading text-2xl md:text-4xl text-foreground tracking-widest uppercase">Pengaturan Klub</h1>
        </div>
        <p className="text-muted-foreground text-sm font-medium tracking-wide">Kelola aset dan template dokumen resmi ADORA BBC.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-primary">
                <FileImage className="size-5" />
                <CardTitle className="font-heading text-xl uppercase tracking-wider">Template Rapor PDF</CardTitle>
              </div>
              <CardDescription className="text-xs">Unggah aset visual untuk rapor PDF. File akan disimpan secara aman di server.</CardDescription>
            </div>
            <button
              type="button"
              onClick={handlePreviewPdf}
              disabled={isPreviewLoading}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-widest hover:bg-primary/80 disabled:opacity-50 transition-colors shrink-0"
            >
              {isPreviewLoading ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />}
              Pratinjau Rapor
            </button>
          </CardHeader>
          <CardContent className="flex flex-col gap-8">
            {ASSET_KEYS.map((asset) => {
              const previewMeta = getAssetPreviewMeta(asset.key);
              const assetUrl = localValues[asset.key];
              const isPdfAsset = assetUrl?.toLowerCase().endsWith(".pdf");

              return (
                <div key={asset.key} className="flex flex-col gap-3 group">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2.5">
                      <label htmlFor={`file-${asset.key}`} className="text-xs font-bold uppercase tracking-widest text-foreground group-hover:text-primary transition-colors cursor-pointer">{asset.label}</label>
                      <span className="text-[9px] font-bold text-amber-500/80 px-1.5 py-0.5 rounded bg-amber-500/10 uppercase tracking-wider select-none shrink-0">{asset.maxSizeLabel}</span>
                    </div>
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
                            ) : assetUrl ? (
                              <CheckCircle2 className="size-4 text-emerald-500" />
                            ) : (
                              <Upload className="size-4 text-muted-foreground" />
                            )}
                            <span className="text-xs font-medium text-muted-foreground truncate max-w-50">
                              {uploading[asset.key] ? "Mengunggah..." : assetUrl ? "File sudah diunggah" : "Belum ada file dipilih"}
                            </span>
                          </div>
                          <span className="text-micro text-primary px-3 py-1 rounded-lg bg-primary/10">Pilih File</span>
                        </label>
                      </div>
                    </div>

                    {assetUrl && (
                      <div className="flex items-center gap-3 p-2.5 rounded-xl border border-border/50 bg-background/50 min-w-56">
                        {isPdfAsset ? (
                          <div className="size-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-red-500">PDF</span>
                          </div>
                        ) : (
                          <div className={`size-12 rounded-lg border border-border/50 overflow-hidden relative flex items-center justify-center ${previewMeta.frameClass}`}>
                            {failedImages[asset.key] ? (
                              <div className={`size-full flex items-center justify-center ${previewMeta.fallbackClass}`}>
                                <span className="text-[10px] font-bold">PNG</span>
                              </div>
                            ) : (
                              <Image
                                src={`${assetUrl}?t=${Date.now()}`}
                                alt={`Preview ${asset.label}`}
                                width={48}
                                height={48}
                                unoptimized
                                className="max-h-full max-w-full object-contain"
                                onError={() => setFailedImages((prev) => ({ ...prev, [asset.key]: true }))}
                              />
                            )}
                          </div>
                        )}

                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-foreground truncate max-w-32">{previewMeta.badge}</span>
                          <span className="text-[10px] text-muted-foreground">{previewMeta.helperText}</span>
                          <a href={assetUrl} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline">
                            Lihat File
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <UserCheck className="size-5" />
              <CardTitle className="font-heading text-xl uppercase tracking-wider">Nama Penandatangan Rapor</CardTitle>
            </div>
            <CardDescription className="text-xs">Nama yang tercantum di bawah tanda tangan pada rapor PDF.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {SIGNER_KEYS.map(({ key, label, placeholder }) => (
              <div key={key} className="flex flex-col gap-2">
                <label htmlFor={`input-${key}`} className="text-xs font-bold uppercase tracking-widest text-foreground">{label}</label>
                <div className="flex gap-3">
                  <Input
                    id={`input-${key}`}
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
              Aset yang belum diunggah tidak akan muncul di rapor PDF, dan bagian tersebut akan dikosongkan secara otomatis. Aset transparan seperti tanda tangan atau stempel bisa terlihat samar di thumbnail gelap, tetapi tetap dipakai saat rapor dicetak.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
