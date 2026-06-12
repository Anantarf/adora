"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, MapPinned, PenSquare, Users2 } from "lucide-react";

import { useHomebases } from "@/hooks/use-homebases";
import {
  useReportSignerCoachOptions,
  useReportSignerHomebaseMappings,
  useUpdateReportSignerHomebaseMappings,
} from "@/hooks/use-report-signers";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ReportSignerAutomationManager() {
  const NO_HOMEBASE_FALLBACK = "__none__";
  const { data: homebases } = useHomebases();
  const { data: coachOptions, isLoading: coachOptionsLoading } = useReportSignerCoachOptions();
  const { data: mappings, isLoading: mappingsLoading } = useReportSignerHomebaseMappings();
  const { mutateAsync: saveMappings, isPending } = useUpdateReportSignerHomebaseMappings();

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

  return (
    <section className="rounded-xl border border-border/50 bg-card shadow-sm">
      <div className="border-b border-border/50 px-5 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MapPinned className="size-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Coach Cadangan per Region</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Atur coach cadangan per region. Sistem tetap memprioritaskan coach yang memang
            terpasang di kelompok latihan pemain.
          </p>
        </div>
      </div>

      <div className="space-y-5 px-5 py-4">
        <div className="rounded-xl border border-border/50 bg-background/40 p-4 text-xs leading-relaxed text-muted-foreground">
          Gunakan bagian ini sebagai pengaman. Jika satu kelompok sudah punya coach aktif, rapor
          tetap memakai coach tersebut. Coach cadangan region baru dipakai saat kelompok belum
          punya penanggung jawab yang jelas.
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-background/30 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            Memuat aturan coach cadangan...
          </div>
        ) : (
          <div className="space-y-4">
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
                  className="rounded-xl border border-border/50 bg-background/30 p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Users2 className="size-4 text-primary" />
                        <p className="text-sm font-semibold text-foreground">{homebase.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Dipakai hanya jika kelompok di region ini belum punya coach aktif untuk
                        rapor.
                      </p>
                    </div>

                    <div className="w-full lg:max-w-sm">
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
                          <SelectValue placeholder="Pilih coach cadangan">
                            {selectedCoach ? selectedCoach.fullName : "Tanpa coach cadangan"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_HOMEBASE_FALLBACK}>Tanpa pelatih cadangan</SelectItem>
                          {orderedCoachOptions.map((coach) => {
                            const isRelevantCoach = relevantCoachOptions.some(
                              (relevantCoach) => relevantCoach.id === coach.id,
                            );

                            return (
                              <SelectItem key={coach.id} value={coach.id}>
                                {coach.fullName}
                                {isRelevantCoach ? " - region ini" : ""}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {relevantCoachOptions.length > 0
                          ? `${relevantCoachOptions.length} coach terhubung ke region ini dan ditampilkan lebih dulu.`
                          : "Belum ada coach yang terhubung langsung ke region ini. Anda tetap bisa memilih coach aktif lain sebagai cadangan."}
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
                              <CheckCircle2 className="size-3" /> Tanda tangan siap dipakai
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
            Simpan Coach Cadangan Region
          </Button>
        </div>

        <div className="rounded-xl border border-dashed border-border/50 bg-background/30 p-4 text-xs text-muted-foreground">
          <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
            <PenSquare className="size-4 text-primary" />
            Urutan pemakaian tanda tangan
          </div>
          <p>1. Pelatih aktif di kelompok latihan.</p>
          <p>2. Pelatih cadangan region.</p>
          <p>3. Pelatih umum rapor sebagai cadangan terakhir.</p>
        </div>
      </div>
    </section>
  );
}
