"use client";

import React, { useMemo, useState } from "react";
import {
  LayoutList as SelectIcon,
  CalendarRange,
} from "lucide-react";
import { toast } from "sonner";

import { AddPeriodDialog } from "@/components/features/AddPeriodDialog";
import { AdminPageHeader } from "@/components/features/admin-page-header";
import { EvaluationConfigDialog } from "@/components/features/EvaluationConfigDialog";
import {
  StatisticsList,
  periodDisplayLabel,
  type SharedPlayer,
  type SharedStat,
} from "@/components/features/statistics/StatisticsList";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useGroups } from "@/hooks/use-groups";
import { usePeriods, useSetActivePeriod, useDeletePeriod } from "@/hooks/use-evaluation-periods";
import { usePlayers } from "@/hooks/use-players";
import { useClubSettings } from "@/hooks/use-settings";
import { useStatsByPeriod } from "@/hooks/use-statistics";

export default function StatisticsPage() {
  const [activeGroup, setActiveGroup] = useState<string>("all");
  // Pilihan user untuk periode; null artinya belum pilih (auto-pakai periode aktif dari server).
  const [pickedPeriodId, setPickedPeriodId] = useState<string | null>(null);

  const { data: periods } = usePeriods();

  // Default periode aktif ketika user belum memilih; setelah user memilih, pickedPeriodId menang.
  const defaultPeriodId = periods?.find((period) => period.isActive)?.id ?? periods?.[0]?.id;
  const selectedPeriodId = pickedPeriodId ?? defaultPeriodId ?? "";
  const selectedPeriod = periods?.find((period) => period.id === selectedPeriodId) ?? null;

  const { data: groups } = useGroups();
  const { data: players, isLoading: playersLoading } = usePlayers(activeGroup);
  const { data: stats, isLoading: statsLoading } = useStatsByPeriod(selectedPeriodId || null);
  const { mutateAsync: setActive } = useSetActivePeriod();
  const { mutateAsync: deletePeriod } = useDeletePeriod();
  const { data: settings } = useClubSettings();

  const statsMap = useMemo<Record<string, SharedStat | undefined>>(
    () => Object.fromEntries((stats ?? []).map((stat) => [stat.player.id, stat as SharedStat])),
    [stats],
  );

  const playersByGroup = useMemo(() => {
    if (!players || !groups) {
      return [];
    }

    return groups
      .map((group) => ({
        group,
        players: players.filter((player) => player.groupId === group.id) as SharedPlayer[],
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

  const canDeletePeriod = statsSummary.published === 0 && statsSummary.draft === 0;
  const totalPlayers = players?.length ?? 0;

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
      setPickedPeriodId(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus periode evaluasi.",
      );
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
      <AdminPageHeader
        eyebrow="Penilaian Pemain"
        title="Penilaian & Rapor"
        description="Pilih periode dan kelompok, lalu lanjut isi atau perbarui nilai pemain."
        actions={
          <>
            <EvaluationConfigDialog />
            <AddPeriodDialog />
          </>
        }
      />

      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative min-w-0 flex-1 sm:min-w-[19rem] sm:flex-none">
              <CalendarRange className="absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
              <Select
                value={selectedPeriodId}
                onValueChange={(value) => {
                  setPickedPeriodId(value);
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
                              className="h-9 justify-start rounded-lg px-3 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary"
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
                              className="flex h-9 items-center rounded-lg px-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
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
                                  <span className="text-sm font-bold text-foreground">
                                    Tindakan ini tidak dapat dibatalkan untuk periode{" "}
                                    {periodDisplayLabel(selectedPeriod)}.
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

      <StatisticsList
        selectedPeriodId={selectedPeriodId}
        selectedPeriod={selectedPeriod}
        groups={groups ?? []}
        playersByGroup={playersByGroup}
        statsMap={statsMap}
        settings={settings}
        isLoading={playersLoading || statsLoading}
        emptyMessage={
          totalPlayers === 0
            ? {
                noPlayersTitle: "Belum ada pemain terdaftar",
                noPlayersDescription: "Tambah pemain terlebih dahulu melalui halaman Pemain.",
                noPeriodTitle: "Belum ada periode evaluasi",
                noPeriodDescription: "Buat periode baru untuk mulai input nilai.",
              }
            : {
                noPlayersTitle: "Semua pemain belum memiliki kelompok",
                noPlayersDescription: "Tetapkan kelompok pada pemain melalui halaman Pemain.",
                noPeriodTitle: "Belum ada periode evaluasi",
                noPeriodDescription: "Buat periode baru untuk mulai input nilai.",
              }
        }
        resolveExtraCoachName={(player) =>
          player.group?.coachAssignment?.coachProfile?.fullName ?? null
        }
      />
    </div>
  );
}


