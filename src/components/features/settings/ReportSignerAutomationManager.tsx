"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, MapPinned, Users2 } from "lucide-react";
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
      toast.error(toUserErrorMessage(error, "Gagal mengunggah tanda tangan pelatih."));
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
            <h3 className="text-base font-semibold text-foreground">Tanda Tangan Rapor per Lokasi</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Pilih tanda tangan pelatih yang dipakai untuk rapor di ADORA Gandul dan ADORA Cibubur.
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
                        Tanda tangan rapor untuk lokasi ini.
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
                          <SelectValue placeholder="Pilih pelatih">
                            {selectedCoach ? selectedCoach.fullName : "Belum dipilih"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_HOMEBASE_FALLBACK}>Belum dipilih</SelectItem>
                          {orderedCoachOptions.map((coach) => {
                            const isRelevantCoach = relevantCoachOptions.some(
                              (relevantCoach) => relevantCoach.id === coach.id,
                            );

                            return (
                              <SelectItem key={coach.id} value={coach.id}>
                                {coach.fullName}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {relevantCoachOptions.length > 0
                          ? "Pelatih di lokasi ini ditampilkan lebih dulu."
                          : "Pilih pelatih yang tanda tangannya ingin dipakai."}
                      </p>
                    </div>
                  </div>

                  {selectedCoach ? (
                    <div className="mt-3 flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3 shadow-xs">
                      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/50 bg-muted/30">
                        {selectedCoach.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={selectedCoach.photoUrl} alt={selectedCoach.fullName} className="size-full object-cover" />
                        ) : (
                          <Users2 className="size-5 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
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
                      {!selectedCoach.signatureUrl ? (
                        <div className="shrink-0">
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
                            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-primary/30 bg-primary/10 px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
                          >
                            {uploadingCoachId === selectedCoach.id ? "Mengunggah..." : "Upload TTD"}
                          </label>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
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
