"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileImage,
  FileText,
  Loader2,
  ShieldCheck,
  Upload,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import { useClubSettings, useUpdateClubSetting } from "@/hooks/use-settings";
import { useReportSignerCoachOptions } from "@/hooks/use-report-signers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReportSignerAutomationManager } from "@/components/features/settings/ReportSignerAutomationManager";
import { toUserErrorMessage } from "@/lib/utils";
import { ASSET_KEYS, SIGNER_KEYS, getAssetPreviewMeta, type AssetKey } from "./constants";

export default function SettingsPage() {
  const { data: settings } = useClubSettings();
  const { data: coachOptions, isLoading: coachOptionsLoading } = useReportSignerCoachOptions();
  const updateSetting = useUpdateClubSetting();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [assetVersions, setAssetVersions] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const selectedGlobalCoachId = localValues.report_signer_global_coach_profile_id ?? "";
  const selectedGlobalCoach =
    coachOptions?.find((coach) => coach.id === selectedGlobalCoachId) ?? null;
  const previewCoachName = selectedGlobalCoach?.fullName || localValues.rapor_coach_name || "Pelatih Umum";
  const previewCoachSignUrl =
    selectedGlobalCoach?.signatureUrl || localValues.rapor_coach_sign_url || undefined;
  const hasSelectedGlobalCoachSignature = Boolean(selectedGlobalCoach?.signatureUrl?.trim());
  const hasManualCoachSignFallback = Boolean(localValues.rapor_coach_sign_url?.trim());
  const readinessItems = [
    {
      label: "Template",
      ready: Boolean(localValues.rapor_header_url?.trim()),
      helper: localValues.rapor_header_url?.trim() ? "Siap dipakai" : "Belum diunggah",
    },
    {
      label: "CEO",
      ready: Boolean(localValues.rapor_ceo_name?.trim() && localValues.rapor_ceo_sign_url?.trim()),
      helper:
        localValues.rapor_ceo_name?.trim() && localValues.rapor_ceo_sign_url?.trim()
          ? "Nama dan tanda tangan siap"
          : "Lengkapi nama dan tanda tangan",
    },
    {
      label: "Pelatih",
      ready: Boolean(
        selectedGlobalCoach?.signatureUrl?.trim() ||
          localValues.rapor_coach_sign_url?.trim(),
      ),
      helper:
        selectedGlobalCoach?.signatureUrl?.trim() || localValues.rapor_coach_sign_url?.trim()
          ? "Tanda tangan siap"
          : "Butuh tanda tangan cadangan",
    },
    {
      label: "Stempel",
      ready: Boolean(localValues.rapor_stamp_url?.trim()),
      helper: localValues.rapor_stamp_url?.trim() ? "Siap dipakai" : "Opsional",
    },
  ];

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
          coachSignUrl: previewCoachSignUrl,
          stampUrl: localValues.rapor_stamp_url || undefined,
        },
        signers: {
          coachName: previewCoachName,
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
    const maxSizeBytes = key === "rapor_header_url" ? 1 * 1024 * 1024 : 300 * 1024;
    if (file.size > maxSizeBytes) {
      const maxSizeLabel = key === "rapor_header_url" ? "1MB" : "300KB";
      toast.error(
        `Ukuran file ${label} terlalu besar. Batas maksimal ${maxSizeLabel}.`,
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 pb-12">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border/50 pb-5 md:flex-row md:items-end">
        <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
          Pengaturan
        </p>
        <h1 className="font-heading text-2xl tracking-[0.08em] text-foreground md:text-[2rem]">
          Aset dan Tanda Tangan Rapor
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Lengkapi template, nama, dan tanda tangan yang dipakai saat rapor diterbitkan.
        </p>
        </div>
        <Button onClick={handlePreviewPdf} disabled={isPreviewLoading} size="xl">
          {isPreviewLoading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <FileText className="size-3.5" />
          )}
          Pratinjau Rapor
        </Button>
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        {readinessItems.map((item) => (
          <div key={item.label} className="rounded-xl border border-border/50 bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {item.label}
              </p>
              {item.ready ? (
                <CheckCircle2 className="size-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="size-4 text-amber-500" />
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{item.helper}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-border/50 bg-card shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-border/50 px-5 py-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileImage className="size-4 text-primary" />
              <h3 className="text-base font-semibold text-foreground">File Rapor</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Unggah template, tanda tangan, dan stempel yang tampil di PDF rapor.
            </p>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          {ASSET_KEYS.map((asset) => {
            const previewMeta = getAssetPreviewMeta(asset.key);
            const assetUrl = localValues[asset.key];
            const isPdfAsset = assetUrl?.toLowerCase().endsWith(".pdf");

            return (
              <div key={asset.key} className="space-y-3 border-b border-border/40 pb-4 last:border-0 last:pb-0">
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

                <div className="flex flex-col gap-3 xl:flex-row xl:items-start">
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
                    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border/50 bg-background/40 px-3 py-2 xl:min-w-[18rem]">
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
              <h3 className="text-base font-semibold text-foreground">Nama Penandatangan</h3>
            </div>
            <p className="text-sm text-muted-foreground">Atur nama CEO dan pelatih cadangan untuk rapor.</p>
          </div>
        </div>

        <div className="space-y-5 px-5 py-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Pelatih Umum Rapor</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <Select
                  value={selectedGlobalCoachId || "__none__"}
                  onValueChange={(value) =>
                    setLocalValues((previous) => ({
                      ...previous,
                      report_signer_global_coach_profile_id:
                        value === "__none__" ? "" : (value ?? ""),
                    }))
                  }
                  disabled={coachOptionsLoading}
                >
                  <SelectTrigger className="h-10 border-border/50 bg-background/50">
                    <SelectValue placeholder="Pilih pelatih umum">
                      {selectedGlobalCoach ? selectedGlobalCoach.fullName : "Tanpa pelatih umum terpilih"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Tanpa pelatih umum terpilih</SelectItem>
                    {(coachOptions ?? []).map((coach) => (
                      <SelectItem key={coach.id} value={coach.id}>
                        {coach.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => handleTextSave("report_signer_global_coach_profile_id", "Pelatih umum rapor")}
                disabled={saving.report_signer_global_coach_profile_id}
                size="xl"
              >
                {saving.report_signer_global_coach_profile_id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-3.5" />
                )}
                Simpan
              </Button>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/40 p-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Pelatih cadangan aktif</p>
                  <p>
                    {selectedGlobalCoach
                      ? `Nama dan tanda tangan akan mengikuti profil ${selectedGlobalCoach.fullName}.`
                      : "Belum ada pelatih cadangan terpilih. Sistem akan memakai file manual jika tersedia."}
                  </p>
                </div>
              </div>
            </div>
            {selectedGlobalCoach && !hasSelectedGlobalCoachSignature ? (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-100">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
                  <div className="space-y-1">
                    <p className="font-medium text-amber-300">Pelatih terpilih belum punya tanda tangan</p>
                    <p className="text-amber-100/90">
                      Rapor akan memakai file tanda tangan pelatih cadangan jika tersedia.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            {!selectedGlobalCoach && !hasManualCoachSignFallback ? (
              <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs text-rose-100">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-400" />
                  <div className="space-y-1">
                    <p className="font-medium text-rose-300">Tanda tangan pelatih belum siap</p>
                    <p className="text-rose-100/90">
                      Pilih pelatih cadangan atau unggah tanda tangan manual.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

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
                <Button
                  onClick={() => handleTextSave(key, label)}
                  disabled={saving[key]}
                  size="xl"
                >
                  {saving[key] ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-3.5" />
                  )}
                  Simpan
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ReportSignerAutomationManager />
    </div>
  );
}
