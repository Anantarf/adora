"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  FileImage,
  FileText,
  Info,
  Loader2,
  Upload,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import { useClubSettings, useUpdateClubSetting } from "@/hooks/use-settings";
import { Input } from "@/components/ui/input";
import { ReportArchiveManager } from "@/components/features/settings/ReportArchiveManager";
import { toUserErrorMessage } from "@/lib/utils";
import { ASSET_KEYS, SIGNER_KEYS, getAssetPreviewMeta, type AssetKey } from "./constants";

export default function SettingsPage() {
  const { data: settings } = useClubSettings();
  const updateSetting = useUpdateClubSetting();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [assetVersions, setAssetVersions] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalValues(settings);
    }
  }, [settings]);

  const getPreviewUrl = (key: AssetKey, url: string) => {
    const version = assetVersions[key];
    return version ? `${url}?v=${version}` : url;
  };

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
          notes:
            "Arya menunjukkan performa dribble yang sangat solid dan konsisten selama sesi latihan. Kerja sama tim dan akurasi passing juga sangat baik.",
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
    setSaving((previous) => ({ ...previous, [key]: true }));
    try {
      await updateSetting.mutateAsync({ key, value: localValues[key] ?? "" });
      toast.success(`${label} berhasil disimpan.`);
    } catch {
      toast.error("Gagal menyimpan. Coba lagi.");
    } finally {
      setSaving((previous) => ({ ...previous, [key]: false }));
    }
  };

  const handleFileUpload = async (key: AssetKey, file: File, label: string) => {
    const maxSizeBytes = key === "rapor_header_url" ? 2 * 1024 * 1024 : 1 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(
        `Ukuran file ${label} terlalu besar. Batas maksimal ${key === "rapor_header_url" ? "2MB" : "1MB"}.`,
      );
      return;
    }

    setUploading((previous) => ({ ...previous, [key]: true }));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("assetKey", key);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || `Upload gagal (${response.status})`);
      }

      setLocalValues((previous) => ({ ...previous, [key]: data.url }));
      setAssetVersions((previous) => ({ ...previous, [key]: Date.now() }));
      setFailedImages((previous) => ({ ...previous, [key]: false }));
      await updateSetting.mutateAsync({ key, value: data.url });
      toast.success(`${label} berhasil diunggah.`);
    } catch (error) {
      toast.error(toUserErrorMessage(error, "Gagal menyimpan pengaturan."));
      console.error("[Upload Error]", error);
    } finally {
      setUploading((previous) => ({ ...previous, [key]: false }));
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-12">
      <div className="border-b border-border/50 pb-6 md:pb-8">
        <p className="text-sm text-muted-foreground">
          Kelola aset rapor PDF dan nama penandatangan tanpa mengubah alur dokumen.
        </p>
      </div>

      <section className="rounded-xl border border-border/50 bg-card shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-border/50 px-5 py-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileImage className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Aset Rapor PDF</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Unggah aset yang dipakai di header, tanda tangan, dan stempel rapor.
            </p>
          </div>
          <button
            type="button"
            onClick={handlePreviewPdf}
            disabled={isPreviewLoading}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isPreviewLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileText className="size-3.5" />
            )}
            Pratinjau Rapor
          </button>
        </div>

        <div className="space-y-6 px-5 py-4">
          {ASSET_KEYS.map((asset) => {
            const previewMeta = getAssetPreviewMeta(asset.key);
            const assetUrl = localValues[asset.key];
            const isPdfAsset = assetUrl?.toLowerCase().endsWith(".pdf");

            return (
              <div key={asset.key} className="space-y-3 border-b border-border/40 pb-6 last:border-0 last:pb-0">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      htmlFor={`file-${asset.key}`}
                      className="text-xs font-medium text-foreground"
                    >
                      {asset.label}
                    </label>
                    <span className="rounded-md border border-border/50 bg-background px-2 py-1 text-[11px] text-muted-foreground">
                      Maks. {asset.maxSizeLabel}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{asset.description}</p>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept={asset.accept}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          handleFileUpload(asset.key, file, asset.label);
                        }
                      }}
                      className="hidden"
                      id={`file-${asset.key}`}
                    />
                    <label
                      htmlFor={`file-${asset.key}`}
                      className="flex h-11 cursor-pointer items-center justify-between rounded-lg border border-dashed border-border/50 bg-background/50 px-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {uploading[asset.key] ? (
                          <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                        ) : assetUrl ? (
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                        ) : (
                          <Upload className="size-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="truncate text-xs text-muted-foreground">
                          {uploading[asset.key]
                            ? "Mengunggah file..."
                            : assetUrl
                              ? "File sudah diunggah"
                              : "Pilih file untuk diunggah"}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-primary">Pilih File</span>
                    </label>
                  </div>

                  {assetUrl ? (
                    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border/50 bg-background/40 px-3 py-2 lg:min-w-[18rem]">
                      {isPdfAsset ? (
                        <div className="flex size-12 items-center justify-center rounded-lg border border-border/50 bg-background text-xs font-semibold text-muted-foreground">
                          PDF
                        </div>
                      ) : (
                        <div className={`relative flex size-12 items-center justify-center overflow-hidden rounded-lg border border-border/50 ${previewMeta.frameClass}`}>
                          {failedImages[asset.key] ? (
                            <div className={`flex size-full items-center justify-center ${previewMeta.fallbackClass}`}>
                              <span className="text-[10px] font-semibold">PNG</span>
                            </div>
                          ) : (
                            <Image
                              src={getPreviewUrl(asset.key, assetUrl)}
                              alt={`Preview ${asset.label}`}
                              width={48}
                              height={48}
                              unoptimized
                              className="max-h-full max-w-full object-contain"
                              onError={() =>
                                setFailedImages((previous) => ({ ...previous, [asset.key]: true }))
                              }
                            />
                          )}
                        </div>
                      )}

                      <div className="min-w-0 space-y-0.5">
                        <p className="truncate text-xs font-medium text-foreground">
                          {previewMeta.badge}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {previewMeta.helperText}
                        </p>
                        <a
                          href={assetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-medium text-primary hover:underline"
                        >
                          Lihat File
                        </a>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-border/50 bg-card shadow-sm">
        <div className="border-b border-border/50 px-5 py-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <UserCheck className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Nama Penandatangan</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Nama ini akan dipakai di bagian tanda tangan rapor.
            </p>
          </div>
        </div>

        <div className="space-y-5 px-5 py-4">
          {SIGNER_KEYS.map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-2">
              <label htmlFor={`input-${key}`} className="text-xs font-medium text-foreground">
                {label}
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  id={`input-${key}`}
                  value={localValues[key] ?? ""}
                  onChange={(event) =>
                    setLocalValues((previous) => ({
                      ...previous,
                      [key]: event.target.value,
                    }))
                  }
                  placeholder={placeholder}
                  className="h-10 flex-1 border-border/50 bg-background/50"
                />
                <button
                  onClick={() => handleTextSave(key, label)}
                  disabled={saving[key]}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving[key] ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-3.5" />
                  )}
                  Simpan
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ReportArchiveManager />

      <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/40 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">Catatan</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Jika aset belum diunggah, bagian tersebut akan dikosongkan otomatis di rapor.
            Thumbnail transparan seperti tanda tangan atau stempel bisa terlihat samar,
            tetapi file aslinya tetap dipakai saat rapor dicetak.
          </p>
        </div>
      </div>
    </div>
  );
}
