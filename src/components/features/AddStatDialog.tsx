"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart, Loader2, LockKeyhole, Pencil, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { generateCoachNoteAction } from "@/actions/auto-notes";
import { useSubmitStatistic } from "@/hooks/use-statistics";
import {
  buildMetricFieldKey,
  buildMetricValuesFromConfig,
  FIXED_ASPECT_MAX_SCORE,
  getEvaluationSummary,
  normalizeEvaluationConfig,
  type MetricsJsonV2,
} from "@/lib/evaluation-rules";
import { FLAT_METRIC_DEFS, getLegacyCategoryScores, groupFlatMetricDefs } from "@/lib/metrics";
import type { MetricsJson, PlayerSummary } from "@/types/dashboard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ExistingStat = { id: string; metrics: MetricsJson | MetricsJsonV2; status: "Draft" | "Published" };
type StatPlayer = Pick<PlayerSummary, "id" | "name" | "group">;

const DEFAULT_LEGACY_METRICS: MetricsJson = {
  dribble: {
    inAndOut: 0,
    crossover: 0,
    vLeft: 0,
    vRight: 0,
    betweenLegsLeft: 0,
    betweenLegsRight: 0,
  },
  passing: {
    chestPass: 0,
    bouncePass: 0,
    overheadPass: 0,
  },
  layUp: 0,
  shooting: 0,
  notes: "",
};

function clampScore(value: number, maxScore: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(maxScore, Math.round(value)));
}

function parseScoreInput(nextValue: string, maxScore: number) {
  const digitsOnly = nextValue.replace(/[^\d]/g, "");
  return clampScore(Number(digitsOnly), maxScore);
}

function formatWeight(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.?0+$/, "");
}

function getLegacyMetricValue(metrics: MetricsJson, path: string) {
  const parts = path.split(".");
  let current: unknown = metrics;

  for (const part of parts) {
    current = (current as Record<string, unknown>)?.[part];
  }

  return typeof current === "number" ? current : 0;
}

function getCategoryStatusMeta(score: number) {
  if (score >= 80) {
    return {
      statusLabel: "Sangat Baik",
      className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    };
  }

  if (score >= 70) {
    return {
      statusLabel: "Baik",
      className: "border-sky-500/20 bg-sky-500/10 text-sky-400",
    };
  }

  if (score >= 60) {
    return {
      statusLabel: "Cukup",
      className: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    };
  }

  return {
    statusLabel: "Perhatian",
    className: "border-rose-500/20 bg-rose-500/10 text-rose-400",
  };
}

export function AddStatDialog({
  player,
  periodId,
  isPeriodActive = true,
  existingStat,
  triggerClassName,
  alwaysShowLabel = false,
  evaluationConfig,
}: {
  player: StatPlayer;
  periodId?: string;
  isPeriodActive?: boolean;
  existingStat?: ExistingStat;
  triggerClassName?: string;
  alwaysShowLabel?: boolean;
  evaluationConfig?: unknown;
}) {
  const { data: session } = useSession();
  const isCoach = session?.user?.role === "COACH";
  const [open, setOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"Draft" | "Published" | null>(null);
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);
  const scoreInputRefs = useRef<HTMLInputElement[]>([]);
  const [legacyMetrics, setLegacyMetrics] = useState<MetricsJson>(
    (existingStat?.metrics as MetricsJson) ?? DEFAULT_LEGACY_METRICS,
  );
  const dynamicConfig = useMemo(
    () => (evaluationConfig ? normalizeEvaluationConfig(evaluationConfig) : null),
    [evaluationConfig],
  );
  const [dynamicValues, setDynamicValues] = useState<Record<string, number>>(
    dynamicConfig
      ? buildMetricValuesFromConfig(dynamicConfig, existingStat?.metrics ?? null)
      : {},
  );
  const [notes, setNotes] = useState(
    existingStat?.metrics && "notes" in existingStat.metrics && typeof existingStat.metrics.notes === "string"
      ? existingStat.metrics.notes
      : "",
  );
  const { mutateAsync, isPending } = useSubmitStatistic();
  const isEdit = !!existingStat;
  const isPublishedStat = existingStat?.status === "Published";

  useEffect(() => {
    if (dynamicConfig) {
      setDynamicValues(buildMetricValuesFromConfig(dynamicConfig, existingStat?.metrics ?? null));
      setNotes(
        existingStat?.metrics && "notes" in existingStat.metrics && typeof existingStat.metrics.notes === "string"
          ? existingStat.metrics.notes
          : "",
      );
      return;
    }

    setLegacyMetrics((existingStat?.metrics as MetricsJson) ?? DEFAULT_LEGACY_METRICS);
    setNotes(
      existingStat?.metrics && "notes" in existingStat.metrics && typeof existingStat.metrics.notes === "string"
        ? existingStat.metrics.notes
        : "",
    );
  }, [dynamicConfig, existingStat]);

  const legacyGrandTotal = useMemo(() => {
    return FLAT_METRIC_DEFS.reduce(
      (sum, definition) => sum + getLegacyMetricValue(legacyMetrics, definition.path),
      0,
    );
  }, [legacyMetrics]);

  const dynamicGrandTotal = useMemo(() => {
    if (!dynamicConfig) {
      return 0;
    }

    return dynamicConfig.categories.reduce((sum, category) => {
      return (
        sum +
        category.items.reduce((itemSum, item) => {
          return itemSum + clampScore(dynamicValues[buildMetricFieldKey(category.id, item.id)] ?? 0, item.maxScore);
        }, 0)
      );
    }, 0);
  }, [dynamicConfig, dynamicValues]);

  const categoryStatusRows = useMemo(() => {
    if (dynamicConfig) {
      const summary = getEvaluationSummary(
        {
          version: "v2",
          categories: dynamicConfig.categories.map((category) => ({
            id: category.id,
            label: category.label,
            weight: category.weight,
            items: category.items.map((item) => ({
              ...item,
              score: clampScore(dynamicValues[buildMetricFieldKey(category.id, item.id)] ?? 0, item.maxScore),
            })),
          })),
          attendance: null,
          notes: "",
          grading: dynamicConfig.grading,
        } satisfies MetricsJsonV2,
      );

      return summary.categorySummaries.map((category) => ({
        id: category.id,
        categoryLabel: category.label,
        score: category.averageScore,
        ...getCategoryStatusMeta(category.averageScore),
      }));
    }

    const legacyCategoryRows = getLegacyCategoryScores(legacyMetrics);

    return legacyCategoryRows.map((category) => ({
      id: category.id,
      categoryLabel: category.label,
      score: category.score,
      ...getCategoryStatusMeta(category.score),
    }));
  }, [dynamicConfig, dynamicValues, legacyMetrics]);

  const handleLegacyChange = (path: string, maxScore: number, nextValue: string) => {
    const score = parseScoreInput(nextValue, maxScore);

    setLegacyMetrics((previous) => {
      const copy = structuredClone(previous);
      const parts = path.split(".");
      let current: Record<string, unknown> = copy as unknown as Record<string, unknown>;

      for (let index = 0; index < parts.length - 1; index += 1) {
        current = current[parts[index]] as Record<string, unknown>;
      }

      current[parts[parts.length - 1]] = score;
      return copy;
    });
  };

  const handleGenerateNote = async () => {
    setIsGeneratingNote(true);
    try {
      const result = await generateCoachNoteAction({
        playerName: player.name,
        metrics: dynamicConfig
          ? dynamicValues
          : {
              ...legacyMetrics,
              notes: notes.trim(),
            },
        evaluationConfig: dynamicConfig,
        values: dynamicConfig ? dynamicValues : undefined,
      });

      setNotes(result.note);
      toast.success("Catatan pelatih berhasil dibuat. Silakan cek dan sesuaikan bila perlu.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal membuat catatan pelatih otomatis.",
      );
    } finally {
      setIsGeneratingNote(false);
    }
  };

  const onSubmit = async (status: "Draft" | "Published") => {
    if (!periodId) {
      toast.error("Periode evaluasi belum dipilih.");
      return;
    }

    setPendingStatus(status);

    try {
      await mutateAsync({
        playerId: player.id,
        periodId,
        metrics: dynamicConfig
          ? dynamicValues
          : {
              ...legacyMetrics,
              notes: notes.trim(),
            },
        status,
        notes: notes.trim(),
      });

      toast.success(
        `Nilai ${player.name} berhasil ${status === "Draft" ? "disimpan sebagai draf" : "diterbitkan"}.`,
      );
      setOpen(false);

      if (!isEdit) {
        if (dynamicConfig) {
          setDynamicValues(buildMetricValuesFromConfig(dynamicConfig, null));
          setNotes("");
        } else {
          setLegacyMetrics(DEFAULT_LEGACY_METRICS);
          setNotes("");
        }
      }
    } catch (error: unknown) {
      toast.error((error instanceof Error ? error.message : null) || "Gagal menyimpan nilai.");
    } finally {
      setPendingStatus(null);
    }
  };

  const notesMaxLength = dynamicConfig?.notesMaxLength ?? 160;
  const legacyGroups = useMemo(() => groupFlatMetricDefs(), []);

  scoreInputRefs.current = [];

  const registerScoreInputRef = (node: HTMLInputElement | null) => {
    if (node && !scoreInputRefs.current.includes(node)) {
      scoreInputRefs.current.push(node);
    }
  };

  const handleScoreInputEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const currentIndex = scoreInputRefs.current.indexOf(event.currentTarget);
    const next = scoreInputRefs.current[currentIndex + 1];
    next?.focus();
    next?.select();
  };

  if (isCoach && isEdit && existingStat?.status === "Published") {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled
        title="Rapor sudah diterbitkan admin. Minta admin mengembalikan ke draf jika perlu revisi."
        className={`h-8 gap-1.5 text-xs font-semibold ${triggerClassName ?? ""}`}
      >
        <LockKeyhole className="size-3" />
        <span className={alwaysShowLabel ? "" : "hidden sm:inline"}>Terkunci</span>
      </Button>
    );
  }

  return (
    <>
      <Button
        size="sm"
        variant={isEdit ? "outline" : "default"}
        disabled={!periodId && !isEdit}
        className={`h-8 gap-1.5 text-xs font-semibold ${triggerClassName ?? ""}`}
        onClick={() => setOpen(true)}
      >
        {isEdit ? (
          <>
            <Pencil className="size-3" />
            <span className={alwaysShowLabel ? "" : "hidden sm:inline"}>Ubah</span>
          </>
        ) : (
          <>
            <Plus className="size-3" />
            <span className={alwaysShowLabel ? "" : "hidden sm:inline"}>Input Nilai</span>
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="custom-scrollbar max-h-dialog-lg overflow-y-auto border-border/50 bg-card sm:max-w-2xl">
          <div className="mb-2 flex items-center gap-4">
            <div className="shrink-0 rounded-xl bg-muted/60 p-3">
              <LineChart className="size-6 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-0.5">
              <DialogTitle className="text-xl font-semibold text-foreground">
                {isEdit ? "Perbarui" : "Input"} Nilai
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {player.name} <span className="mx-1.5 text-primary/50">-</span>{" "}
                {player.group?.name ?? "Tidak Memiliki Kelompok"}
              </DialogDescription>
            </div>
          </div>

          {!isPeriodActive ? (
            <div className="mb-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-xs font-medium tracking-wide text-destructive">
              Periode evaluasi ini sudah tidak aktif. Data nilai tidak dapat diubah.
            </div>
          ) : null}

          <div className="mt-1 flex flex-col gap-3">
            <fieldset disabled={!isPeriodActive} className="flex flex-col gap-3">
              {dynamicConfig ? (
                <div className="overflow-hidden rounded-lg border border-border/40 bg-muted/20">
                  <div className="flex items-center justify-between border-b border-border/30 bg-muted/40 px-3 py-2">
                    <span className="text-xs font-medium text-muted-foreground">Kategori Penilaian Dinamis</span>
                    <span className="text-sm font-bold tabular-nums text-primary">
                      Total: {dynamicGrandTotal}
                    </span>
                  </div>
                  <div className="space-y-4 p-3">
                    {dynamicConfig.categories.map((category) => (
                      <div key={category.id} className="space-y-2 rounded-xl border border-border/40 bg-background/40 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{category.label}</p>
                            <p className="text-xs text-muted-foreground">
                              Bobot {formatWeight(category.weight)}% | {category.items.length} aspek
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          {category.items.map((item) => {
                            const fieldKey = buildMetricFieldKey(category.id, item.id);
                            return (
                              <div key={fieldKey} className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">{item.label}</label>
                                <Input
                                  ref={registerScoreInputRef}
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={String(dynamicValues[fieldKey] ?? 0)}
                                  onChange={(event) =>
                                    setDynamicValues((previous) => ({
                                      ...previous,
                                      [fieldKey]: parseScoreInput(event.target.value, item.maxScore),
                                    }))
                                  }
                                  onKeyDown={handleScoreInputEnter}
                                  className="h-10 rounded-xl border-primary/10 bg-black/20 text-center font-bold tabular-nums shadow-inner transition-all focus:border-primary/40 focus:bg-black/30"
                                />
                                <p className="text-[10px] text-muted-foreground">Skala 0-{FIXED_ASPECT_MAX_SCORE}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-border/40 bg-muted/20">
                  <div className="flex items-center justify-between border-b border-border/30 bg-muted/40 px-3 py-2">
                    <span className="text-xs font-medium text-muted-foreground">Aspek Penilaian</span>
                    <span className="text-sm font-bold tabular-nums text-primary">
                      Total: {legacyGrandTotal}
                    </span>
                  </div>
                  <div className="space-y-4 p-3">
                    {legacyGroups.map((group) => (
                      <div key={group.label} className="space-y-2 rounded-xl border border-border/40 bg-background/40 p-3">
                        <div className="flex items-center gap-2 pb-0.5">
                          <span className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                            {group.label}
                          </span>
                          <span className="h-px flex-1 bg-border/40" />
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {group.definitions.length} aspek
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {group.definitions.map((definition) => {
                            return (
                              <div key={definition.key} className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">{definition.label}</label>
                                <Input
                                  ref={registerScoreInputRef}
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={String(getLegacyMetricValue(legacyMetrics, definition.path))}
                                  onChange={(event) =>
                                    handleLegacyChange(definition.path, definition.max, event.target.value)
                                  }
                                  onKeyDown={handleScoreInputEnter}
                                  className="h-10 rounded-xl border-primary/10 bg-black/20 text-center font-bold tabular-nums shadow-inner transition-all focus:border-primary/40 focus:bg-black/30"
                                />
                                <p className="text-[10px] text-muted-foreground">Skala 0-{definition.max}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    Catatan / Saran Pelatih (Opsional)
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isGeneratingNote}
                    onClick={() => void handleGenerateNote()}
                    className="h-8 gap-1.5 rounded-lg border-primary/20 bg-primary/5 px-3 text-xs font-semibold text-primary hover:bg-primary/10"
                  >
                    {isGeneratingNote ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="size-3.5" />
                    )}
                    Generate Catatan
                  </Button>
                </div>
                <Textarea
                  value={notes}
                  maxLength={notesMaxLength}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Fokus pada konsistensi gerakan dan keputusan bermain..."
                  className="h-20 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {notes.length}/{notesMaxLength} karakter
                </p>
                <div className="rounded-lg border border-border/50 bg-background/30 px-3 py-2 text-xs text-muted-foreground">
                  Tuliskan: 1 kekuatan utama, 1 area perbaikan, dan presensi jika relevan.
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  {categoryStatusRows.map((category) => (
                    <div
                      key={category.id}
                      className="rounded-lg border border-border/50 bg-background/20 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-foreground">{category.categoryLabel}</p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${category.className}`}
                        >
                          {category.statusLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                        Skor saat ini <span className="font-medium text-foreground">{category.score}</span>/100,
                        jadi kategori ini masuk level{" "}
                        <span className="font-medium text-foreground">{category.statusLabel.toLowerCase()}</span>.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </fieldset>

            <div className="flex items-center justify-center gap-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="text-center">
                <p className="text-xs font-medium text-muted-foreground">Total Skor</p>
                <p className="text-2xl font-bold tabular-nums text-primary">
                  {dynamicConfig ? dynamicGrandTotal : legacyGrandTotal}
                </p>
              </div>
              <div className="h-8 w-px bg-border/50" />
              <div className="text-center">
                <p className="text-xs font-medium text-muted-foreground">Aspek Dinilai</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {dynamicConfig
                    ? dynamicConfig.categories.reduce((sum, category) => sum + category.items.length, 0)
                    : FLAT_METRIC_DEFS.length}
                </p>
              </div>
            </div>

            {isPeriodActive ? (
              <div className="mt-1 flex flex-col gap-2">
                {isCoach ? (
                  <Button
                    type="button"
                    onClick={() => void onSubmit("Draft")}
                    disabled={isPending}
                    className="h-11 w-full bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    {pendingStatus === "Draft" ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" /> Menyimpan Draf...
                      </>
                    ) : (
                      "Simpan sebagai Draf"
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      onClick={() => void onSubmit("Published")}
                      disabled={isPending}
                      className="h-11 w-full bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      {pendingStatus === "Published" ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" /> Menyimpan...
                        </>
                      ) : (
                        "Simpan & Terbitkan"
                      )}
                    </Button>
                    {!isPublishedStat ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void onSubmit("Draft")}
                        disabled={isPending}
                        className="h-11 w-full border-primary/30 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        {pendingStatus === "Draft" ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" /> Menyimpan Draf...
                          </>
                        ) : (
                          "Simpan sebagai Draf"
                        )}
                      </Button>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
