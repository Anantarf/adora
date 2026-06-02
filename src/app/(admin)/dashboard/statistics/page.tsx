"use client";

import React, { useMemo, useState } from "react";
import {
  Loader2,
  LayoutList as SelectIcon,
  CalendarRange,
  Trash2,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";

import { AddPeriodDialog } from "@/components/features/AddPeriodDialog";
import { AddStatDialog } from "@/components/features/AddStatDialog";
import { GradeBadge } from "@/components/features/dashboard/GradeBadge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGroups } from "@/hooks/use-groups";
import { usePeriods, useSetActivePeriod, useDeletePeriod } from "@/hooks/use-evaluation-periods";
import { usePlayers } from "@/hooks/use-players";
import { useClubSettings } from "@/hooks/use-settings";
import { useStatsByPeriod } from "@/hooks/use-statistics";
import { PERIOD_STATUS_BADGE as STATUS_BADGE_CONFIG } from "@/lib/constants/badge-configs";
import { FLAT_METRIC_DEFS, averageScore } from "@/lib/metrics";
import type { MetricsJson, PlayerSummary } from "@/types/dashboard";

const MetricCell = ({ value }: { value?: number }) =>
  value != null ? (
    <span className="font-bold text-primary">{value}</span>
  ) : (
    <span className="text-muted-foreground">-</span>
  );

function getValidMetrics(metrics: unknown): MetricsJson | null {
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

const PlayerStatRow = React.memo(
  ({
    player,
    index,
    stat,
    group,
    selectedPeriod,
    settings,
  }: {
    player: PlayerSummary;
    index: number;
    stat?: {
      id: string;
      metricsJson: unknown;
      status: string;
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
  }) => {
    const metrics = getValidMetrics(stat?.metricsJson);
    const [isPdfLoading, setIsPdfLoading] = useState(false);

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
            coachSignUrl: settings?.rapor_coach_sign_url ?? undefined,
            stampUrl: settings?.rapor_stamp_url ?? undefined,
          },
          signers: {
            coachName: settings?.rapor_coach_name ?? undefined,
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
      <TableRow className="transition-colors even:bg-muted/10 hover:bg-muted/30">
        <TableCell className="sticky left-0 z-20 w-12 min-w-12 max-w-12 bg-card px-2 text-center font-medium text-muted-foreground">
          {index + 1}
        </TableCell>
        <TableCell className="sticky left-12 z-20 min-w-40 max-w-50 bg-card font-semibold">
          {player.name}
        </TableCell>
        {FLAT_METRIC_DEFS.map((definition) => (
          <TableCell
            key={definition.key}
            className="text-center font-mono text-sm tabular-nums"
          >
            <MetricCell value={metrics ? definition.getValue(metrics) : undefined} />
          </TableCell>
        ))}
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
            className={`text-[10px] font-bold uppercase tracking-widest ${
              stat
                ? STATUS_BADGE_CONFIG[stat.status as keyof typeof STATUS_BADGE_CONFIG].className
                : "border-border/50 text-muted-foreground"
            }`}
          >
            {stat
              ? STATUS_BADGE_CONFIG[stat.status as keyof typeof STATUS_BADGE_CONFIG].label
              : "Belum Diisi"}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            {metrics ? (
              <button
                title="Download Rapor PDF"
                onClick={handleDownload}
                disabled={isPdfLoading}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-indigo-500/10 hover:text-indigo-400 disabled:opacity-50"
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
                      metrics: stat.metricsJson as MetricsJson,
                      status: stat.status as "Draft" | "Published",
                    }
                  : undefined
              }
            />
          </div>
        </TableCell>
      </TableRow>
    );
  },
);

PlayerStatRow.displayName = "PlayerStatRow";

export default function StatisticsPage() {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string>("all");
  const [loadingPlayerId, setLoadingPlayerId] = useState<string | null>(null);

  const { data: periods } = usePeriods();
  const { data: groups } = useGroups();
  const { data: players, isLoading: playersLoading } = usePlayers(activeGroup);
  const { data: stats, isLoading: statsLoading } = useStatsByPeriod(selectedPeriodId);
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

  const totalPlayerCount = playersByGroup.reduce(
    (count, entry) => count + entry.players.length,
    0,
  );
  const selectedPeriod = periods?.find((period) => period.id === selectedPeriodId);
  const canDeletePeriod = statsSummary.published === 0 && statsSummary.draft === 0;
  const activeGroupName =
    activeGroup === "all"
      ? "Semua kelompok"
      : groups?.find((group) => group.id === activeGroup)?.name ?? "Kelompok";

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
      setSelectedPeriodId(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus periode evaluasi.",
      );
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border/50 pb-6 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl text-foreground tracking-widest uppercase md:text-3xl">
            Input Penilaian
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola nilai pemain per periode evaluasi.
          </p>
        </div>
        <AddPeriodDialog />
      </div>

      <div className="rounded-xl border border-border/40 bg-card p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          <span className="rounded-full border border-border/50 bg-background/60 px-3 py-1.5">
            {selectedPeriod ? periodDisplayLabel(selectedPeriod) : "Belum pilih periode"}
          </span>
          <span className="rounded-full border border-border/50 bg-background/60 px-3 py-1.5">
            {activeGroupName}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:flex md:items-end">
          <div className="flex w-full flex-col gap-1.5 md:min-w-[16rem]">
            <div className="flex items-center justify-between gap-3 px-1">
              <label className="text-micro text-muted-foreground">Periode Evaluasi</label>
              <div className="flex items-center gap-1.5">
                {selectedPeriod && !selectedPeriod.isActive ? (
                  <button
                    onClick={() => handleSetActive(selectedPeriod.id)}
                    className="rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary/20 bg-primary/10"
                  >
                    Aktifkan
                  </button>
                ) : null}
                {selectedPeriod ? (
                  <AlertDialog>
                    <AlertDialogTrigger className="rounded p-1.5 text-muted-foreground outline-none transition-colors hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="size-3.5" />
                    </AlertDialogTrigger>
                    <AlertDialogContent className="sm:max-w-md border-border/50 bg-card">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 font-heading text-xl uppercase tracking-widest text-destructive">
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
                ) : null}
              </div>
            </div>
            <div className="relative w-full">
              <CalendarRange className="absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
              <Select
                value={selectedPeriodId ?? ""}
                onValueChange={(value) => {
                  setSelectedPeriodId(value);
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
                          <span className="ml-2 rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider leading-none text-primary">
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
                  className="max-h-60 rounded-xl border-border/50"
                >
                  {periods?.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      <div className="flex w-full items-center justify-between">
                        <span>{periodDisplayLabel(period)}</span>
                        {period.isActive ? (
                          <span className="ml-2 rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider leading-none text-primary">
                            Aktif
                          </span>
                        ) : null}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex w-full flex-col gap-1.5 md:min-w-56">
            <label className="text-micro text-muted-foreground">Filter Kelompok</label>
            <div className="relative">
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
        </div>

        {selectedPeriodId && !statsLoading ? (
          <div className="mt-4 border-t border-border/40 pt-4">
            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
              <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Selesai
                </p>
                <p className="mt-1 text-sm font-bold tabular-nums text-primary">
                  {statsSummary.published}
                </p>
              </div>
              <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Draft
                </p>
                <p className="mt-1 text-sm font-bold tabular-nums text-foreground">
                  {statsSummary.draft}
                </p>
              </div>
              <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Total
                </p>
                <p className="mt-1 text-sm font-bold tabular-nums text-foreground">
                  {totalPlayerCount}
                </p>
              </div>
            </div>
          </div>
        ) : null}
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
        <div className="space-y-4 md:hidden">
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
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">
                      {group.name}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      {groupPlayers.length} pemain
                    </span>
                  </div>
                  <div className="divide-y divide-border/40">
                    {groupPlayers.map((player, index) => {
                      const stat = statsMap[player.id];
                      const metrics = getValidMetrics(stat?.metricsJson);

                      return (
                        <article key={player.id} className="space-y-3 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-tight text-foreground">
                                <span className="mr-1 text-muted-foreground">{index + 1}.</span>
                                {player.name}
                              </p>
                              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                                {stat
                                  ? STATUS_BADGE_CONFIG[
                                      stat.status as keyof typeof STATUS_BADGE_CONFIG
                                    ].label
                                  : "Belum Diisi"}
                              </p>
                            </div>
                            <div className="shrink-0">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold uppercase tracking-widest ${
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

                          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                            {FLAT_METRIC_DEFS.map((definition) => {
                              const value = metrics
                                ? definition.getValue(metrics)
                                : undefined;

                              return (
                                <div
                                  key={definition.key}
                                  className="min-w-20 shrink-0 rounded-md border border-border/50 bg-background/40 px-1.5 py-1 text-center"
                                >
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                    {definition.shortLabel}
                                  </p>
                                  <p className="text-sm font-mono font-bold leading-tight tabular-nums text-primary">
                                    {value != null ? value : "-"}
                                  </p>
                                </div>
                              );
                            })}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-md border border-border/50 bg-background/40 px-2 py-1.5 text-center">
                              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
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
                              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                Skor Terisi
                              </p>
                              <p className="mt-1 text-sm font-bold tabular-nums text-foreground">
                                {metrics ? FLAT_METRIC_DEFS.length : 0}
                              </p>
                            </div>
                          </div>

                          <div className="-mx-4 mt-1 border-t border-border/40 px-4 pt-3">
                            <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                              Aksi Cepat
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              {metrics ? (
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
                                          coachSignUrl:
                                            settings?.rapor_coach_sign_url ?? undefined,
                                          stampUrl: settings?.rapor_stamp_url ?? undefined,
                                        },
                                        signers: {
                                          coachName: settings?.rapor_coach_name ?? undefined,
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
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-indigo-500/10 hover:text-indigo-400 disabled:opacity-50"
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
                                        metrics: stat.metricsJson as MetricsJson,
                                        status: stat.status as "Draft" | "Published",
                                      }
                                    : undefined
                                }
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
        <div className="hidden overflow-x-auto rounded-xl border border-border/50 bg-card shadow-sm md:block">
          <Table className="min-w-245">
            <TableHeader className="bg-muted/30">
              <TableRow className="border-b border-border/50 hover:bg-transparent">
                <TableHead className="sticky left-0 z-20 w-12 min-w-12 max-w-12 bg-muted/30 px-2 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  No
                </TableHead>
                <TableHead className="sticky left-12 z-20 min-w-40 max-w-50 bg-muted/30 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Nama Pemain
                </TableHead>
                {FLAT_METRIC_DEFS.map((definition) => (
                  <TableHead
                    key={definition.key}
                    className="w-12 px-1 text-center text-[9px] font-bold uppercase tracking-wider text-muted-foreground"
                    title={definition.label}
                  >
                    {definition.shortLabel}
                  </TableHead>
                ))}
                <TableHead className="w-20 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Nilai
                </TableHead>
                <TableHead className="w-20 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="w-24 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
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
                      <TableCell className="sticky left-12 z-20 min-w-40 max-w-50 bg-card">
                        <Skeleton className="h-4 w-32 bg-muted/50" />
                      </TableCell>
                      {FLAT_METRIC_DEFS.map((definition) => (
                        <TableCell key={definition.key} className="text-center">
                          <Skeleton className="mx-auto h-4 w-6 bg-muted/40" />
                        </TableCell>
                      ))}
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
                  <TableCell colSpan={FLAT_METRIC_DEFS.length + 5} className="h-24 text-center">
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
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableCell
                          colSpan={FLAT_METRIC_DEFS.length + 5}
                          className="border-l-4 border-primary py-2.5 pl-3 text-sm font-bold uppercase tracking-widest text-primary"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span>{group.name}</span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
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
