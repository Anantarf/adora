"use client";

import React, { useMemo, useState } from "react";
import {
  Loader2,
  LayoutList as SelectIcon,
  CalendarRange,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";

import { AddPeriodDialog } from "@/components/features/AddPeriodDialog";
import { AddStatDialog } from "@/components/features/AddStatDialog";
import { EvaluationConfigDialog } from "@/components/features/EvaluationConfigDialog";
import { GradeBadge } from "@/components/features/dashboard/GradeBadge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGroups } from "@/hooks/use-groups";
import { usePeriods, useSetActivePeriod, useDeletePeriod } from "@/hooks/use-evaluation-periods";
import { usePlayers } from "@/hooks/use-players";
import { useClubSettings } from "@/hooks/use-settings";
import { useStatsByPeriod } from "@/hooks/use-statistics";
import { PERIOD_STATUS_BADGE as STATUS_BADGE_CONFIG } from "@/lib/constants/badge-configs";
import { averageScore } from "@/lib/metrics";
import { DEFAULT_EVALUATION_CONFIG_V2, getEvaluationSummary, isMetricsJsonV2, normalizeEvaluationConfig, type MetricsJsonV2 } from "@/lib/evaluation-rules";
import { resolveCoachSignerAssetUrl, resolveCoachSignerName } from "@/lib/report-signer";
import type { MetricsJson, PlayerSummary } from "@/types/dashboard";

function getValidMetrics(metrics: unknown): MetricsJson | MetricsJsonV2 | null {
  let data = metrics;

  if (typeof metrics === "string") {
    try {
      data = JSON.parse(metrics);
    } catch {
      return null;
    }
  }

  if (!data || typeof data !== "object") {
    return null;
  }

  const candidate = data as Record<string, unknown>;
  if (isMetricsJsonV2(candidate)) {
    return candidate;
  }

  const isValid =
    candidate.dribble != null &&
    typeof candidate.dribble === "object" &&
    candidate.passing != null &&
    typeof candidate.passing === "object";

  return isValid ? (candidate as MetricsJson) : null;
}

function periodDisplayLabel(period: {
  name: string;
  startDate: Date | string;
  endDate: Date | string;
}) {
  const trimmedName = (period.name || "").trim();
  if (trimmedName) {
    return trimmedName;
  }

  const start = new Date(period.startDate);
  const end = new Date(period.endDate);
  const startLabel = Number.isNaN(start.getTime())
    ? "?"
    : start.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
  const endLabel = Number.isNaN(end.getTime())
    ? "?"
    : end.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

  return `Periode ${startLabel} - ${endLabel}`;
}

function getCategoryShortLabel(label: string) {
  const words = label
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return "Kategori";
  }

  if (words.length === 1) {
    return words[0];
  }

  return words.map((word) => word[0]?.toUpperCase() ?? "").join("");
}

function CategorySummaryChips({
  categoryDefinitions,
  metricSummary,
  compact = false,
}: {
  categoryDefinitions: Array<{
    key: string;
    label: string;
    shortLabel?: string;
  }>;
  metricSummary: ReturnType<typeof getEvaluationSummary> | null;
  compact?: boolean;
}) {
  const hasAnyCategoryScore = categoryDefinitions.some((definition) =>
    metricSummary?.categorySummaries.some((category) => category.id === definition.key),
  );

  if (!hasAnyCategoryScore) {
    return (
      <div
        className={`rounded-xl border border-dashed border-border/50 bg-background/30 text-muted-foreground ${
          compact ? "px-3 py-2 text-xs" : "px-3.5 py-3 text-sm"
        }`}
      >
        Belum ada penilaian per kategori.
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap ${compact ? "gap-1.5" : "gap-2"}`}>
      {categoryDefinitions.map((definition) => {
        const value = metricSummary?.categorySummaries.find((category) => category.id === definition.key)?.averageScore;

        return (
          <div
            key={definition.key}
            className={`inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/50 ${
              compact ? "px-2.5 py-1.5" : "px-3 py-2"
            }`}
            title={definition.label}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {definition.shortLabel ?? definition.label}
            </p>
            <span className="h-3.5 w-px bg-border/60" />
            <p className={`${compact ? "text-sm" : "text-base"} font-bold tabular-nums text-primary`}>
              {value != null ? value : "-"}
              <span className="ml-1 text-[10px] font-medium text-muted-foreground">/100</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}

const PlayerStatRow = React.memo(
  ({
    player,
    index,
    stat,
    group,
    selectedPeriod,
    settings,
    categoryDefinitions,
    evaluationConfig,
  }: {
    player: PlayerSummary;
    index: number;
    stat?: {
      id: string;
      metricsJson: unknown;
      status: string;
      coachNameSnapshot?: string | null;
      coachNameResolved?: string | null;
      coachSignUrlResolved?: string | null;
      resolutionSource?: "GROUP" | "HOMEBASE" | "GLOBAL" | "SNAPSHOT";
    } | null;
    group: {
      id: string;
      name: string;
    };
    selectedPeriod?: {
      id: string;
      name: string;
      isActive: boolean;
    } | null;
    settings?: Record<string, string> | null | undefined;
    categoryDefinitions: Array<{
      key: string;
      label: string;
      shortLabel?: string;
    }>;
    evaluationConfig?: unknown;
  }) => {
    const metrics = getValidMetrics(stat?.metricsJson);
    const metricSummary = metrics ? getEvaluationSummary(metrics) : null;
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const canDownloadReport = Boolean(metrics && stat?.status === "Published");
    const coachSignerName = resolveCoachSignerName(
      stat?.coachNameResolved ??
        stat?.coachNameSnapshot ??
        player.group?.coachAssignment?.coachProfile?.fullName,
      settings?.rapor_coach_name,
    );
    const coachSignerAssetUrl = resolveCoachSignerAssetUrl(
      stat?.coachSignUrlResolved,
      settings?.rapor_coach_sign_url,
    );

    const handleDownload = async () => {
      if (!metrics) {
        return;
      }

      setIsPdfLoading(true);
      try {
        const { generateRaporPDF } = await import("@/lib/generate-rapor-pdf");
        await generateRaporPDF({
          playerName: player.name,
          groupName: group.name,
          schoolOrigin: player.schoolOrigin,
          periodName: selectedPeriod ? selectedPeriod.name : "Periode Evaluasi",
          metrics,
          assets: {
            headerUrl: settings?.rapor_header_url ?? undefined,
            ceoSignUrl: settings?.rapor_ceo_sign_url ?? undefined,
            coachSignUrl: coachSignerAssetUrl,
            stampUrl: settings?.rapor_stamp_url ?? undefined,
          },
          signers: {
            coachName: coachSignerName,
            ceoName: settings?.rapor_ceo_name ?? undefined,
          },
        });
      } catch {
        toast.error("Gagal membuat rapor PDF. Coba lagi.");
      } finally {
        setIsPdfLoading(false);
      }
    };

    return (
      <TableRow className="transition-colors even:bg-muted/[0.08] hover:bg-muted/[0.14]">
        <TableCell className="sticky left-0 z-20 w-12 min-w-12 max-w-12 bg-card px-2 text-center font-medium text-muted-foreground">
          {index + 1}
        </TableCell>
        <TableCell className="sticky left-12 z-20 min-w-40 max-w-50 bg-card py-3 font-semibold">
          <div className="space-y-1">
            <div className="space-y-0.5">
              <p className="text-[15px] font-semibold text-foreground">{player.name}</p>
              <p className="text-[11px] text-muted-foreground">{group.name}</p>
            </div>
          </div>
        </TableCell>
        <TableCell className="min-w-[360px] py-3">
          <CategorySummaryChips categoryDefinitions={categoryDefinitions} metricSummary={metricSummary} compact />
        </TableCell>
        <TableCell className="text-center">
          {metrics ? (
            <GradeBadge score={averageScore(metrics)} />
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell className="text-center">
          <Badge
            variant="outline"
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              stat
                ? STATUS_BADGE_CONFIG[stat.status as keyof typeof STATUS_BADGE_CONFIG].className
                : "border-border/50 bg-background/40 text-muted-foreground"
            }`}
          >
            {stat
              ? STATUS_BADGE_CONFIG[stat.status as keyof typeof STATUS_BADGE_CONFIG].label
              : "Belum Diisi"}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            {canDownloadReport ? (
              <button
                title="Download Rapor PDF"
                onClick={handleDownload}
                disabled={isPdfLoading}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-background/40 text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary disabled:opacity-50"
              >
                {isPdfLoading ? (
                  <Loader2 className="size-4 animate-spin text-primary" />
                ) : (
                  <FileDown className="size-4" />
                )}
              </button>
            ) : null}
            <AddStatDialog
              player={player}
              periodId={selectedPeriod?.id}
              isPeriodActive={selectedPeriod?.isActive}
              existingStat={
                stat
                  ? {
                      id: stat.id,
                      metrics: stat.metricsJson as MetricsJson | MetricsJsonV2,
                      status: stat.status as "Draft" | "Published",
                    }
                  : undefined
              }
              evaluationConfig={evaluationConfig}
            />
          </div>
        </TableCell>
      </TableRow>
    );
  },
);

PlayerStatRow.displayName = "PlayerStatRow";

export default function StatisticsPage() {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [activeGroup, setActiveGroup] = useState<string>("all");
  const [loadingPlayerId, setLoadingPlayerId] = useState<string | null>(null);

  const { data: periods } = usePeriods();
  const { data: groups } = useGroups();
  const { data: players, isLoading: playersLoading } = usePlayers(activeGroup);
  const { data: stats, isLoading: statsLoading } = useStatsByPeriod(selectedPeriodId || null);
  const { mutateAsync: setActive } = useSetActivePeriod();
  const { mutateAsync: deletePeriod } = useDeletePeriod();
  const { data: settings } = useClubSettings();

  const initialized = React.useRef(false);

  React.useEffect(() => {
    if (initialized.current || !periods) {
      return;
    }

    const firstPeriod = periods.find((period) => period.isActive) ?? periods[0];
    if (firstPeriod) {
      setSelectedPeriodId(firstPeriod.id);
      initialized.current = true;
    }
  }, [periods]);

  const statsMap = useMemo(
    () => Object.fromEntries((stats ?? []).map((stat) => [stat.player.id, stat])),
    [stats],
  );

  const playersByGroup = useMemo(() => {
    if (!players || !groups) {
      return [];
    }

    return groups
      .map((group) => ({
        group,
        players: players.filter((player) => player.groupId === group.id),
      }))
      .filter((entry) => entry.players.length > 0);
  }, [players, groups]);

  const statsSummary = useMemo(
    () =>
      (stats ?? []).reduce(
        (summary, stat) => {
          if (stat.status === "Published") {
            summary.published += 1;
          } else if (stat.status === "Draft") {
            summary.draft += 1;
          }
          return summary;
        },
        { published: 0, draft: 0 },
      ),
    [stats],
  );

  const selectedPeriod = periods?.find((period) => period.id === selectedPeriodId);
  const selectedEvaluationConfig = selectedPeriod?.evaluationConfigJson ?? null;
  const selectedCategoryDefinitions = useMemo(() => {
    const config = selectedEvaluationConfig
      ? normalizeEvaluationConfig(selectedEvaluationConfig)
      : DEFAULT_EVALUATION_CONFIG_V2;

    return config.categories.map((category) => ({
      key: category.id,
      label: category.label,
      shortLabel: getCategoryShortLabel(category.label),
    }));
  }, [selectedEvaluationConfig]);
  const canDeletePeriod = statsSummary.published === 0 && statsSummary.draft === 0;

  const handleSetActive = async (periodId: string) => {
    try {
      await setActive(periodId);
      toast.success("Periode aktif diperbarui.");
    } catch {
      toast.error("Gagal mengubah periode aktif.");
    }
  };

  const handleDeletePeriod = async () => {
    if (!selectedPeriodId) {
      return;
    }

    try {
      await deletePeriod(selectedPeriodId);
      toast.success("Periode evaluasi berhasil dihapus.");
      setSelectedPeriodId("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus periode evaluasi.",
      );
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border/50 pb-6 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">
          Pilih periode dan kelompok, lalu lanjut isi atau perbarui nilai pemain.
        </p>
        <div className="flex items-center gap-2">
          <EvaluationConfigDialog />
          <AddPeriodDialog />
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative min-w-0 flex-1 sm:min-w-[19rem] sm:flex-none">
              <CalendarRange className="absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
              <Select
                value={selectedPeriodId}
                onValueChange={(value) => {
                  setSelectedPeriodId(value ?? "");
                  setActiveGroup("all");
                }}
              >
                <SelectTrigger className="h-11 border-border/50 bg-background/50 pl-9 focus-visible:ring-primary/30">
                  <SelectValue
                    placeholder={
                      periods?.length === 0
                        ? "Belum ada periode - buat dulu"
                        : "Pilih Periode"
                    }
                  >
                    {selectedPeriod ? (
                      <div className="flex items-center">
                        <span>{periodDisplayLabel(selectedPeriod)}</span>
                        {selectedPeriod.isActive ? (
                          <span className="ml-2 rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary">
                            Aktif
                          </span>
                        ) : null}
                      </div>
                    ) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  sideOffset={6}
                  className="max-h-72 rounded-xl border-border/50"
                >
                  {periods?.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      <div className="flex w-full items-center justify-between">
                        <span>{periodDisplayLabel(period)}</span>
                        {period.isActive ? (
                          <span className="ml-2 rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary">
                            Aktif
                          </span>
                        ) : null}
                      </div>
                    </SelectItem>
                  ))}

                  {selectedPeriod ? (
                    <>
                      <Separator className="my-2" />
                      <div className="px-2 pb-1 pt-0.5">
                        <div className="mb-2 px-2 text-[10px] font-medium text-muted-foreground">
                          Aksi Periode
                        </div>
                        <div className="flex flex-col gap-1">
                          {!selectedPeriod.isActive ? (
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-8 justify-start px-2 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                void handleSetActive(selectedPeriod.id);
                              }}
                            >
                              Aktifkan periode ini
                            </Button>
                          ) : null}
                          <AlertDialog>
                            <AlertDialogTrigger
                              className="flex h-8 items-center rounded-md px-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                              onClick={(event) => event.stopPropagation()}
                            >
                              Hapus periode
                            </AlertDialogTrigger>
                            <AlertDialogContent className="sm:max-w-md border-border/50 bg-card">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-lg font-semibold text-destructive">
                                  Hapus Periode?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="flex flex-col gap-2">
                                  <span className="text-sm font-bold text-destructive">
                                    Periode &quot;{selectedPeriod.name}&quot; akan dihapus permanen.
                                  </span>
                                  {canDeletePeriod ? (
                                    <span className="text-xs leading-relaxed text-muted-foreground">
                                      Tindakan ini tidak dapat dibatalkan. Pastikan Anda menghapus
                                      periode yang tepat.
                                    </span>
                                  ) : (
                                    <span className="text-xs leading-relaxed text-amber-500/80">
                                      Periode ini memiliki{" "}
                                      {statsSummary.published + statsSummary.draft} data nilai pemain.
                                      Kosongkan semua data nilai terlebih dahulu sebelum menghapus
                                      periode.
                                    </span>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeletePeriod}
                                  disabled={!canDeletePeriod}
                                  className="bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50"
                                >
                                  Hapus Periode
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </>
                  ) : null}
                </SelectContent>
              </Select>
            </div>

            <div className="relative min-w-0 flex-1 sm:min-w-56 sm:flex-none">
              <SelectIcon className="absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
              <Select value={activeGroup} onValueChange={(value) => setActiveGroup(value ?? "all")}>
                <SelectTrigger className="h-11 border-border/50 bg-background/50 pl-9 focus-visible:ring-primary/30">
                  <SelectValue placeholder="Pilih Kelompok">
                    {activeGroup === "all"
                      ? "Semua Kelompok"
                      : groups?.find((group) => group.id === activeGroup)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  sideOffset={6}
                  className="max-h-60 rounded-xl border-border/50"
                >
                  <SelectItem value="all">Semua Kelompok</SelectItem>
                  {groups?.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedPeriodId && !statsLoading ? (
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/50 px-3 py-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">Selesai</span>
                <span className="text-sm font-semibold tabular-nums text-primary">
                  {statsSummary.published}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/50 px-3 py-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">Draft</span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {statsSummary.draft}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {!selectedPeriodId ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card p-12 text-center">
          <CalendarRange className="mx-auto mb-3 size-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">
            Belum ada periode evaluasi
          </p>
          <p className="mt-1 text-xs text-muted-foreground/75">
            Buat periode baru untuk mulai input nilai.
          </p>
        </div>
      ) : null}

      {selectedPeriodId ? (
        <div className="space-y-4 lg:hidden">
          {playersLoading || statsLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map((groupIndex) => (
                <div
                  key={groupIndex}
                  className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm"
                >
                  <div className="border-b border-border/50 bg-muted/20 px-4 py-2.5">
                    <Skeleton className="h-4 w-32 bg-muted/60" />
                  </div>
                  <div className="space-y-4 divide-y divide-border/40 p-4">
                    {[1, 2].map((playerIndex) => (
                      <div key={playerIndex} className="space-y-3 pt-3 first:pt-0">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-40 bg-muted/50" />
                          <Skeleton className="h-3 w-12 bg-muted/40" />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {[1, 2, 3, 4].map((metricIndex) => (
                            <Skeleton
                              key={metricIndex}
                              className="h-10 min-w-20 shrink-0 rounded-md bg-muted/40"
                            />
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Skeleton className="h-10 rounded-md bg-muted/40" />
                          <Skeleton className="h-10 rounded-md bg-muted/40" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!playersLoading && !statsLoading && playersByGroup.length === 0 ? (
            <div className="rounded-xl border border-border/50 bg-card p-6 text-center">
              {(players?.length ?? 0) === 0 ? (
                <>
                  <p className="text-sm font-semibold text-foreground">
                    Belum ada pemain terdaftar
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tambah pemain terlebih dahulu melalui halaman Pemain.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-foreground">
                    Semua pemain belum memiliki kelompok
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tetapkan kelompok pada pemain melalui halaman Pemain.
                  </p>
                </>
              )}
            </div>
          ) : null}

          {!playersLoading && !statsLoading
            ? playersByGroup.map(({ group, players: groupPlayers }) => (
                <section
                  key={group.id}
                  className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-border/50 bg-muted/20 px-4 py-2.5">
                    <span className="text-xs font-semibold text-primary">
                      {group.name}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {groupPlayers.length} pemain
                    </span>
                  </div>
                  <div className="divide-y divide-border/40">
                    {groupPlayers.map((player, index) => {
                      const stat = statsMap[player.id];
                      const metrics = getValidMetrics(stat?.metricsJson);
                      const metricSummary = metrics ? getEvaluationSummary(metrics) : null;
                      const coachSignerName = resolveCoachSignerName(
                        stat?.coachNameResolved ??
                          stat?.coachNameSnapshot ??
                          player.group?.coachAssignment?.coachProfile?.fullName,
                        settings?.rapor_coach_name,
                      );
                      const coachSignerAssetUrl = resolveCoachSignerAssetUrl(
                        stat?.coachSignUrlResolved,
                        settings?.rapor_coach_sign_url,
                      );

                      return (
                        <article key={player.id} className="space-y-3 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold leading-tight text-foreground">
                                <span className="mr-1 text-muted-foreground">{index + 1}.</span>
                                {player.name}
                              </p>
                            </div>
                            <div className="shrink-0">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-semibold ${
                                  stat
                                    ? STATUS_BADGE_CONFIG[
                                        stat.status as keyof typeof STATUS_BADGE_CONFIG
                                      ].className
                                    : "border-border/50 text-muted-foreground"
                                }`}
                              >
                                {stat
                                  ? STATUS_BADGE_CONFIG[
                                      stat.status as keyof typeof STATUS_BADGE_CONFIG
                                    ].label
                                  : "Belum Diisi"}
                              </Badge>
                            </div>
                          </div>

                          <CategorySummaryChips
                            categoryDefinitions={selectedCategoryDefinitions}
                            metricSummary={metricSummary}
                          />

                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-md border border-border/50 bg-background/40 px-2 py-1.5 text-center">
                              <p className="text-[9px] font-medium text-muted-foreground">
                                Nilai
                              </p>
                              <div className="mt-1 flex justify-center">
                                {metrics ? (
                                  <GradeBadge score={averageScore(metrics)} />
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </div>
                            </div>
                            <div className="rounded-md border border-border/50 bg-background/40 px-2 py-1.5 text-center">
                              <p className="text-[9px] font-medium text-muted-foreground">
                                Skor Terisi
                              </p>
                              <p className="mt-1 text-sm font-bold tabular-nums text-foreground">
                                {metrics
                                  ? metricSummary?.flatRows.length ?? 0
                                  : 0}
                              </p>
                            </div>
                          </div>

                          <div className="-mx-4 mt-1 border-t border-border/40 px-4 pt-3">
                            <div className="flex items-center justify-end gap-2">
                              {metrics && stat?.status === "Published" ? (
                                <button
                                  title="Download Rapor PDF"
                                  disabled={loadingPlayerId === player.id}
                                  onClick={async () => {
                                    setLoadingPlayerId(player.id);
                                    try {
                                      const { generateRaporPDF } = await import(
                                        "@/lib/generate-rapor-pdf"
                                      );
                                      await generateRaporPDF({
                                        playerName: player.name,
                                        groupName: group.name,
                                        schoolOrigin: player.schoolOrigin,
                                        periodName: selectedPeriod
                                          ? selectedPeriod.name
                                          : "Periode Evaluasi",
                                        metrics,
                                        assets: {
                                          headerUrl: settings?.rapor_header_url ?? undefined,
                                          ceoSignUrl: settings?.rapor_ceo_sign_url ?? undefined,
                                          coachSignUrl: coachSignerAssetUrl,
                                          stampUrl: settings?.rapor_stamp_url ?? undefined,
                                        },
                                        signers: {
                                          coachName: coachSignerName,
                                          ceoName: settings?.rapor_ceo_name ?? undefined,
                                        },
                                      });
                                    } catch {
                                      toast.error(
                                        "Gagal membuat rapor PDF. Coba lagi.",
                                      );
                                    } finally {
                                      setLoadingPlayerId(null);
                                    }
                                  }}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                                >
                                  {loadingPlayerId === player.id ? (
                                    <Loader2 className="size-4 animate-spin text-primary" />
                                  ) : (
                                    <FileDown className="size-4" />
                                  )}
                                </button>
                              ) : null}
                              <AddStatDialog
                                player={player}
                                periodId={selectedPeriod?.id}
                                isPeriodActive={selectedPeriod?.isActive}
                                existingStat={
                                  stat
                                    ? {
                                        id: stat.id,
                                        metrics: stat.metricsJson as MetricsJson | MetricsJsonV2,
                                        status: stat.status as "Draft" | "Published",
                                      }
                                    : undefined
                                }
                                evaluationConfig={selectedEvaluationConfig}
                                triggerClassName="h-10 px-3"
                                alwaysShowLabel
                              />
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))
            : null}
        </div>
      ) : null}

      {selectedPeriodId ? (
        <div className="hidden overflow-x-auto rounded-2xl border border-border/50 bg-card shadow-sm lg:block">
          <Table className="min-w-[920px]">
              <TableHeader className="bg-muted/[0.16]">
                <TableRow className="border-b border-border/50 hover:bg-transparent">
                <TableHead className="sticky left-0 z-20 w-12 min-w-12 max-w-12 bg-muted/20 px-2 text-center text-[10px] font-medium text-muted-foreground">
                  No
                </TableHead>
                <TableHead className="sticky left-12 z-20 min-w-40 max-w-52 bg-muted/20 text-[10px] font-medium text-muted-foreground">
                  Nama Pemain
                </TableHead>
                <TableHead className="min-w-[320px] px-3 text-left text-[10px] font-medium text-muted-foreground">
                  Ringkasan Kategori
                </TableHead>
                <TableHead className="w-20 text-center text-[10px] font-medium text-muted-foreground">
                  Nilai
                </TableHead>
                <TableHead className="w-20 text-center text-[10px] font-medium text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="w-24 text-right text-[10px] font-medium text-muted-foreground">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playersLoading || statsLoading ? (
                <>
                  {[1, 2, 3, 4, 5].map((rowIndex) => (
                    <TableRow key={rowIndex} className="animate-pulse">
                      <TableCell className="sticky left-0 z-20 w-12 bg-card text-center">
                        <Skeleton className="mx-auto h-4 w-4 bg-muted/50" />
                      </TableCell>
                      <TableCell className="sticky left-12 z-20 min-w-44 max-w-56 bg-card">
                        <Skeleton className="h-4 w-32 bg-muted/50" />
                      </TableCell>
                      <TableCell className="min-w-[360px]">
                        <div className="grid grid-cols-3 gap-2">
                          {[1, 2, 3].map((chipIndex) => (
                            <Skeleton key={chipIndex} className="h-10 rounded-full bg-muted/40" />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="mx-auto h-5 w-10 rounded bg-muted/40" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="mx-auto h-5 w-16 rounded bg-muted/40" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Skeleton className="h-7 w-7 rounded bg-muted/40" />
                          <Skeleton className="h-7 w-7 rounded bg-muted/40" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : null}

              {!playersLoading && !statsLoading && playersByGroup.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {(players?.length ?? 0) === 0 ? (
                      <>
                        <p className="text-sm font-semibold text-foreground">
                          Belum ada pemain terdaftar
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Tambah pemain terlebih dahulu melalui halaman Pemain.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-foreground">
                          Semua pemain belum memiliki kelompok
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Tetapkan kelompok pada pemain melalui halaman Pemain.
                        </p>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ) : null}

              {!playersLoading && !statsLoading
                ? playersByGroup.map(({ group, players: groupPlayers }) => (
                    <React.Fragment key={group.id}>
                      <TableRow className="bg-muted/[0.12] hover:bg-muted/[0.12]">
                        <TableCell
                          colSpan={6}
                          className="border-l-4 border-primary py-2.5 pl-3 text-sm font-semibold text-primary"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span>{group.name}</span>
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {groupPlayers.length} pemain
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                      {groupPlayers.map((player, index) => {
                        const stat = statsMap[player.id];

                        return (
                          <PlayerStatRow
                            key={player.id}
                            player={player}
                            index={index}
                            stat={stat}
                            group={group}
                            selectedPeriod={selectedPeriod}
                            settings={settings}
                            categoryDefinitions={selectedCategoryDefinitions}
                            evaluationConfig={selectedEvaluationConfig}
                          />
                        );
                      })}
                    </React.Fragment>
                  ))
                : null}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
