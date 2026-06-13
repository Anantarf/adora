"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, MapPinned, Upload, Users2 } from "lucide-react";
import { toast } from "sonner";

import { useHomebases } from "@/hooks/use-homebases";
import {
  useReportSignerCoachOptions,
  useReportSignerHomebaseMappings,
  useUpdateReportSignerCoachSignature,
  useUpdateReportSignerHomebaseMappings,
} from "@/hooks/use-report-signers";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toUserErrorMessage } from "@/lib/utils";

export function ReportSignerAutomationManager() {
  const NO_HOMEBASE_FALLBACK = "__none__";
  const { data: homebases } = useHomebases();
  const { data: coachOptions, isLoading: coachOptionsLoading } = useReportSignerCoachOptions();
  const { data: mappings, isLoading: mappingsLoading } = useReportSignerHomebaseMappings();
  const { mutateAsync: saveMappings, isPending } = useUpdateReportSignerHomebaseMappings();
  const { mutateAsync: updateCoachSignature, isPending: isSavingSignature } = useUpdateReportSignerCoachSignature();
  const [uploadingCoachId, setUploadingCoachId] = useState<string | null>(null);
  const [failedPhotoIds, setFailedPhotoIds] = useState<Record<string, boolean>>({});

  const derivedMappings = useMemo<Record<string, string>>(() => {
    if (!homebases) {
      return {};
    }

    const result: Record<string, string> = {};
    for (const homebase of homebases) {
      result[homebase.id] =
        mappings?.find((mapping) => mapping.homebaseId === homebase.id)?.coachProfileId ?? "";
    }

    return result;
  }, [homebases, mappings]);

  const [localMappings, setLocalMappings] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocalMappings(derivedMappings);
  }, [derivedMappings]);

  const coachOptionsById = useMemo(
    () => new Map((coachOptions ?? []).map((coach) => [coach.id, coach])),
    [coachOptions],
  );

  const isLoading = coachOptionsLoading || mappingsLoading;

  const handleSignatureUpload = async (coachProfile: { id: string; userId: string; fullName: string }, file: File) => {
    if (file.size > 300 * 1024) {
      toast.error("Ukuran file tanda tangan maksimal 300KB.");
      return;
    }

    setUploadingCoachId(coachProfile.id);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("assetKey", `coach_signature_${coachProfile.userId}_${Date.now()}`);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Upload tanda tangan gagal.");
      }

      await updateCoachSignature({
        coachProfileId: coachProfile.id,
        signatureUrl: data.url,
      });
    } catch (error) {
      toast.error(toUserErrorMessage(error, "Gagal mengunggah tanda tangan coach."));
    } finally {
      setUploadingCoachId(null);
    }
  };

  return (
    <section className="rounded-xl border border-border/50 bg-card shadow-sm">
      <div className="border-b border-border/50 px-5 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MapPinned className="size-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Tanda Tangan Coach per Lokasi</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Pilih coach yang tanda tangannya dipakai untuk ADORA Gandul dan ADORA Cibubur.
          </p>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-background/30 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            Memuat pilihan tanda tangan...
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {(homebases ?? []).map((homebase) => {
              const selectedCoachId = localMappings[homebase.id] ?? "";
              const selectedCoach = selectedCoachId
                ? coachOptionsById.get(selectedCoachId)
                : null;
              const relevantCoachOptions = (coachOptions ?? []).filter((coach) =>
                coach.assignments.some((assignment) => assignment.group.homebase?.id === homebase.id),
              );
              const orderedCoachOptions = [
                ...relevantCoachOptions,
                ...(coachOptions ?? []).filter(
                  (coach) =>
                    !relevantCoachOptions.some((relevantCoach) => relevantCoach.id === coach.id),
                ),
              ];

              return (
                <div
                  key={homebase.id}
                  className="flex flex-col gap-4 rounded-xl border border-border/50 bg-background/30 p-4"
                >
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Users2 className="size-4 text-primary" />
                        <p className="text-sm font-semibold text-foreground">{homebase.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Coach yang tanda tangannya dipakai untuk lokasi ini.
                      </p>
                    </div>

                    <div className="w-full">
                      <Select
                        value={selectedCoachId || NO_HOMEBASE_FALLBACK}
                        onValueChange={(value) =>
                          setLocalMappings((previous) => ({
                            ...previous,
                            [homebase.id]: value === NO_HOMEBASE_FALLBACK ? "" : (value ?? ""),
                          }))
                        }
                      >
                        <SelectTrigger className="h-11 border-border/50 bg-background/50">
                          <SelectValue placeholder="Pilih coach">
                            {selectedCoach ? selectedCoach.fullName : "Belum dipilih"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_HOMEBASE_FALLBACK}>Belum dipilih</SelectItem>
                          {orderedCoachOptions.map((coach) => (
                            <SelectItem key={coach.id} value={coach.id}>
                              {coach.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Simpan setelah memilih coach.
                      </p>
                    </div>
                  </div>

                  {selectedCoach ? (
                    <div className="mt-3 w-full min-w-0 rounded-lg border border-border/50 bg-card p-3 shadow-xs">
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/50 bg-muted/30">
                          {selectedCoach.photoUrl && !failedPhotoIds[selectedCoach.id] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={selectedCoach.photoUrl}
                              alt={selectedCoach.fullName}
                              className="size-full object-cover"
                              onError={() =>
                                setFailedPhotoIds((previous) => ({
                                  ...previous,
                                  [selectedCoach.id]: true,
                                }))
                              }
                            />
                          ) : (
                            <span className="text-xs font-bold text-muted-foreground">
                              {selectedCoach.fullName.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="truncate text-xs font-semibold text-foreground">
                            {selectedCoach.fullName}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px]">
                            {selectedCoach.signatureUrl ? (
                              <span className="flex items-center gap-1 text-emerald-500">
                                <CheckCircle2 className="size-3" /> Tanda tangan siap
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 rounded-sm bg-amber-500/10 px-1.5 py-0.5 text-amber-500">
                                <span className="text-[10px] font-bold">!</span> Belum unggah tanda tangan
                              </span>
                            )}
                            <span className="text-muted-foreground/40">/</span>
                            <span className="text-muted-foreground">
                              {selectedCoach.assignments.length} kelompok terhubung
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-3 border-t border-border/40 pt-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-medium text-foreground">File tanda tangan</p>
                            <span className="rounded-md border border-border/50 bg-background px-2 py-1 text-[11px] text-muted-foreground">
                              PNG, maks. 300KB
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Gunakan latar transparan atau putih polos agar jelas di rapor.
                          </p>
                        </div>

                        <div className="flex w-full min-w-0 flex-col gap-3">
                          <div className="flex-1">
                            <input
                              id={`signature-${selectedCoach.id}`}
                              type="file"
                              accept=".png"
                              className="hidden"
                              disabled={uploadingCoachId === selectedCoach.id || isSavingSignature}
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) {
                                  void handleSignatureUpload(selectedCoach, file);
                                }
                                event.target.value = "";
                              }}
                            />
                            <label
                              htmlFor={`signature-${selectedCoach.id}`}
                              className="flex h-11 cursor-pointer items-center justify-between rounded-lg border border-dashed border-border/50 bg-background/50 px-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-3">
                                {uploadingCoachId === selectedCoach.id ? (
                                  <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                                ) : selectedCoach.signatureUrl ? (
                                  <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                                ) : (
                                  <Upload className="size-4 shrink-0 text-muted-foreground" />
                                )}
                                <span className="min-w-0 truncate text-xs text-muted-foreground">
                                  {uploadingCoachId === selectedCoach.id
                                    ? "Mengunggah file..."
                                    : selectedCoach.signatureUrl
                                      ? "File tanda tangan sudah diunggah"
                                      : "Pilih file tanda tangan"}
                                </span>
                              </div>
                              <span className="ml-3 shrink-0 text-xs font-medium text-primary">
                                {selectedCoach.signatureUrl ? "Ganti File" : "Pilih File"}
                              </span>
                            </label>
                          </div>

                          {selectedCoach.signatureUrl ? (
                            <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border/50 bg-background/40 px-3 py-2">
                              <div className="flex size-12 items-center justify-center rounded-lg border border-border/50 bg-background text-xs font-semibold text-muted-foreground">
                                PNG
                              </div>
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <p className="truncate text-xs font-medium text-foreground">Tanda Tangan</p>
                                <p className="text-[11px] text-muted-foreground">Dipakai untuk rapor lokasi ini</p>
                                <a
                                  href={selectedCoach.signatureUrl}
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
                    </div>
                  ) : (
                    <div className="mt-3 rounded-lg border border-dashed border-border/50 bg-card/60 px-3 py-4 text-center text-xs font-medium text-muted-foreground">
                      Pilih coach untuk lokasi ini.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            disabled={isPending || isLoading}
            onClick={() =>
              void saveMappings(
                Object.entries(localMappings)
                  .filter(([, coachProfileId]) => coachProfileId.trim())
                  .map(([homebaseId, coachProfileId]) => ({
                    homebaseId,
                    coachProfileId,
                  })),
              )
            }
            size="xl"
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="size-3.5" />
            )}
            Simpan Tanda Tangan Lokasi
          </Button>
        </div>
      </div>
    </section>
  );
}
