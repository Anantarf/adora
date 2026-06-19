"use client";

import React, { Suspense, useMemo, useState } from "react";
import {
  LayoutList as SelectIcon,
  CalendarRange,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { AdminPageHeader } from "@/components/features/admin-page-header";
import {
  StatisticsList,
  periodDisplayLabel,
  type SharedPlayer,
  type SharedStat,
} from "@/components/features/statistics/StatisticsList";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCoachWorkspace } from "@/hooks/use-coach-workspace";
import { usePeriods } from "@/hooks/use-evaluation-periods";
import { useReportSettings } from "@/hooks/use-settings";
import { useStatsByPeriod } from "@/hooks/use-statistics";

function CoachStatisticsPageInner() {
  const searchParams = useSearchParams();
  const [activeGroup, setActiveGroup] = useState<string>(searchParams.get("groupId") || "all");
  // Pilihan user untuk periode; null artinya belum pilih (auto-pakai periode aktif dari server).
  const [pickedPeriodId, setPickedPeriodId] = useState<string | null>(null);

  const { data: periods } = usePeriods();

  // Default periode aktif ketika user belum memilih; setelah user memilih, pickedPeriodId menang.
  const defaultPeriodId = periods?.find((period) => period.isActive)?.id ?? periods?.[0]?.id;
  const selectedPeriodId = pickedPeriodId ?? defaultPeriodId ?? "";
  const selectedPeriod = periods?.find((period) => period.id === selectedPeriodId) ?? null;


  const { data: coachData, isLoading: coachLoading } = useCoachWorkspace();
  const { data: stats, isLoading: statsLoading } = useStatsByPeriod(selectedPeriodId || null);
  const { data: settings } = useReportSettings();

  const groups = useMemo(() => coachData?.groups ?? [], [coachData?.groups]);
  const players = useMemo<SharedPlayer[]>(() => {
    if (!coachData?.players) return [];
    if (activeGroup === "all") return coachData.players as SharedPlayer[];
    return (coachData.players as SharedPlayer[]).filter(
      (player) => player.group?.id === activeGroup,
    );
  }, [coachData, activeGroup]);

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
        players: players.filter((player) => player.group?.id === group.id),
      }))
      .filter((entry) => entry.players.length > 0);
  }, [players, groups]);

  const visiblePlayerIds = useMemo(() => new Set(players.map((player) => player.id)), [players]);

  const visibleStats = useMemo(
    () => (stats ?? []).filter((stat) => visiblePlayerIds.has(stat.player.id)),
    [stats, visiblePlayerIds],
  );

  const statsSummary = useMemo(
    () =>
      visibleStats.reduce(
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
    [visibleStats],
  );

  const isLoading = coachLoading || statsLoading;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
      <AdminPageHeader
        eyebrow="Penilaian Pelatih"
        title="Penilaian & Rapor"
        description="Pilih periode dan kelompok, lalu isi penilaian pemain. Pelatih menyimpan draf; admin yang menerbitkan rapor."
      />

      <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">Alur kerja:</span>{" "}
        isi atau perbarui nilai sebagai draf, lalu admin meninjau dan menerbitkan rapor untuk orang tua.
      </div>

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
                        ? "Belum ada periode evaluasi"
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
                </SelectContent>
              </Select>
            </div>

            <div className="relative min-w-0 flex-1 sm:min-w-56 sm:flex-none">
              <SelectIcon className="absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
              <Select value={activeGroup} onValueChange={(value) => setActiveGroup(value ?? "all")}>
                <SelectTrigger className="h-11 border-border/50 bg-background/50 pl-9 focus-visible:ring-primary/30">
                  <SelectValue placeholder="Pilih Kelompok">
                    {activeGroup === "all"
                      ? "Semua Kelompok Saya"
                      : groups?.find((group) => group.id === activeGroup)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  sideOffset={6}
                  className="max-h-60 rounded-xl border-border/50"
                >
                  <SelectItem value="all">Semua Kelompok Saya</SelectItem>
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
                <span className="text-[11px] font-medium text-muted-foreground">Nilai Terpublikasi</span>
                <span className="text-sm font-semibold tabular-nums text-primary">
                  {statsSummary.published}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/50 px-3 py-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">Draf Saya</span>
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
        groups={groups}
        playersByGroup={playersByGroup}
        statsMap={statsMap}
        settings={settings}
        isLoading={isLoading}
        emptyMessage={{
          noPlayersTitle: "Belum ada pemain di kelompok Anda",
          noPlayersDescription: "Pemain akan tampil setelah admin menugaskan kelompok kepada pelatih.",
          noPeriodTitle: "Belum ada periode evaluasi",
          noPeriodDescription: "Periode evaluasi akan tampil setelah dibuat oleh admin.",
        }}
      />
    </div>
  );
}

export default function CoachStatisticsPage() {
  return (
    <Suspense>
      <CoachStatisticsPageInner />
    </Suspense>
  );
}
