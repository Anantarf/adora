"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Loader2, LayoutList as SelectIcon, CalendarRange, Trash2, FileDown, Search, Filter, X, ChevronRight, Activity } from "lucide-react";
import { usePlayers } from "@/hooks/use-players";
import { useGroups } from "@/hooks/use-groups";
import { usePeriods, useSetActivePeriod, useDeletePeriod } from "@/hooks/use-evaluation-periods";
import { useClubSettings } from "@/hooks/use-settings";
import { useStatsByPeriod } from "@/hooks/use-statistics";
import { AddStatDialog } from "@/components/features/AddStatDialog";
import { AddPeriodDialog } from "@/components/features/AddPeriodDialog";
import type { MetricsJson } from "@/types/dashboard";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FLAT_METRIC_DEFS, averageScore } from "@/lib/metrics";
import { generateRaporPDF } from "@/lib/generate-rapor-pdf";
import { GradeBadge } from "@/components/features/dashboard/GradeBadge";
import { PERIOD_STATUS_BADGE as STATUS_BADGE_CONFIG } from "@/lib/constants/badge-configs";

// ─── TYPES & HELPERS ────────────────────────────────────

const MetricCell = ({ v }: { v?: number }) => (v != null ? <span className="font-bold text-primary">{v}</span> : <span className="text-muted-foreground/30">—</span>);

const getValidMetrics = (m: unknown): MetricsJson | null => {
  let obj = m;
  if (typeof m === "string") {
    try { obj = JSON.parse(m); } catch { return null; }
  }
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  const isValid = o.dribble != null && typeof o.dribble === "object" && o.passing != null && typeof o.passing === "object";
  return isValid ? (o as MetricsJson) : null;
};

const periodDisplayLabel = (period: { name: string; startDate: Date | string; endDate: Date | string }) => {
  const trimmedName = (period.name || "").trim();
  if (trimmedName) return trimmedName;
  const start = new Date(period.startDate);
  const end = new Date(period.endDate);
  const startLabel = isNaN(start.getTime()) ? "?" : start.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  const endLabel = isNaN(end.getTime()) ? "?" : end.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  return `Periode ${startLabel} - ${endLabel}`;
};

// ─── SUBCOMPONENTS ──────────────────────────────────────

const PlayerStatRow = React.memo(({ player, idx, stat, group, selectedPeriod, settings }: { player: any; idx: number; stat: any; group: any; selectedPeriod: any; settings: any }) => {
  const m = getValidMetrics(stat?.metricsJson);

  return (
    <tr className="group hover:bg-muted/40 transition-all">
      <td className="px-4 py-4 text-center text-xs font-bold text-muted-foreground/50 sticky left-0 bg-card group-hover:bg-muted/40 z-20 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.05)] border-r border-border/40">
        {idx + 1}
      </td>
      <td className="px-5 py-4 font-bold text-sm text-foreground sticky left-12 bg-card group-hover:bg-muted/40 z-20 shadow-[5px_0_15px_-5px_rgba(0,0,0,0.1)] min-w-[180px]">
        <div className="flex flex-col">
          <span className="truncate">{player.name}</span>
          <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-tighter">{group.name}</span>
        </div>
      </td>
      {FLAT_METRIC_DEFS.map((def) => (
        <td key={def.key} className="px-2 py-4 text-center font-mono text-sm border-r border-border/5">
          <MetricCell v={m ? def.getValue(m) : undefined} />
        </td>
      ))}
      <td className="px-4 py-4 text-center bg-muted/5">
        {m ? <GradeBadge score={averageScore(m)} /> : <span className="text-muted-foreground/20">—</span>}
      </td>
      <td className="px-4 py-4 text-center">
        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${stat ? STATUS_BADGE_CONFIG[stat.status as keyof typeof STATUS_BADGE_CONFIG].className : "bg-muted/10 text-muted-foreground/40 border-border/30"}`}>
          {stat ? STATUS_BADGE_CONFIG[stat.status as keyof typeof STATUS_BADGE_CONFIG].label : "Kosong"}
        </span>
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {m && (
            <Button
              variant="ghost"
              size="icon"
              title="Unduh Rapor PDF"
              onClick={() =>
                generateRaporPDF({
                  playerName: player.name,
                  groupName: group.name,
                  schoolOrigin: player.schoolOrigin,
                  periodName: selectedPeriod ? selectedPeriod.name : "Periode Evaluasi",
                  metrics: m,
                  assets: {
                    headerUrl: settings?.rapor_header_url,
                    ceoSignUrl: settings?.rapor_ceo_sign_url,
                    coachSignUrl: settings?.rapor_coach_sign_url,
                    stampUrl: settings?.rapor_stamp_url,
                  },
                  signers: {
                    coachName: settings?.rapor_coach_name,
                    ceoName: settings?.rapor_ceo_name,
                  },
                })
              }
              className="h-9 w-9 rounded-xl text-primary/60 hover:bg-primary/10 hover:text-primary transition-all"
            >
              <FileDown className="size-4" />
            </Button>
          )}
          <AddStatDialog
            player={player}
            periodId={selectedPeriod?.id}
            isPeriodActive={selectedPeriod?.isActive}
            existingStat={stat ? { id: stat.id, metrics: stat.metricsJson as MetricsJson, status: stat.status as "Draft" | "Published" } : undefined}
          />
        </div>
      </td>
    </tr>
  );
});
PlayerStatRow.displayName = "PlayerStatRow";

// ─── MAIN PAGE ──────────────────────────────────────────

export default function StatisticsPage() {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DRAFT" | "PUBLISHED" | "UNFILLED">("ALL");
  const [activeGroup, setActiveGroup] = useState<string>("all");

  const { data: periods } = usePeriods();
  const { data: groups } = useGroups();
  const { data: players, isLoading: playersLoading } = usePlayers(activeGroup);
  const { data: stats, isLoading: statsLoading } = useStatsByPeriod(selectedPeriodId);
  const { mutateAsync: setActive } = useSetActivePeriod();
  const { mutateAsync: deletePeriod } = useDeletePeriod();
  const { data: settings } = useClubSettings();

  const initialized = React.useRef(false);
  useEffect(() => {
    if (initialized.current || !periods) return;
    const first = periods.find((p) => p.isActive) ?? periods[0];
    if (first) {
      setSelectedPeriodId(first.id);
      initialized.current = true;
    }
  }, [periods]);

  const statsMap = useMemo(() => Object.fromEntries((stats ?? []).map((s) => [s.player.id, s])), [stats]);

  const filteredPlayersByGroup = useMemo(() => {
    if (!players || !groups) return [];
    
    return groups.map((group) => {
      const gPlayers = players.filter((p) => {
        if (p.groupId !== group.id) return false;
        
        // Search Filter
        const q = searchQuery.toLowerCase();
        const matchesSearch = p.name.toLowerCase().includes(q);
        
        // Status Filter
        const stat = statsMap[p.id];
        let matchesStatus = true;
        if (statusFilter === "DRAFT") matchesStatus = stat?.status === "Draft";
        else if (statusFilter === "PUBLISHED") matchesStatus = stat?.status === "Published";
        else if (statusFilter === "UNFILLED") matchesStatus = !stat;
        
        return matchesSearch && matchesStatus;
      });

      return { group, players: gPlayers };
    }).filter((g) => g.players.length > 0);
  }, [players, groups, searchQuery, statusFilter, statsMap]);

  const statsSummary = useMemo(() => 
    (stats ?? []).reduce(
      (acc, s) => {
        if (s.status === "Published") acc.published++;
        else if (s.status === "Draft") acc.draft++;
        return acc;
      },
      { published: 0, draft: 0 }
    ), [stats]
  );

  const selectedPeriod = periods?.find((p) => p.id === selectedPeriodId);
  const canDeletePeriod = statsSummary.published === 0 && statsSummary.draft === 0;

  const handleSetActive = async (periodId: string) => {
    try {
      await setActive(periodId);
      toast.success("Periode aktif diperbarui.");
    } catch { toast.error("Gagal mengubah periode aktif."); }
  };

  const handleDeletePeriod = async () => {
    if (!selectedPeriodId) return;
    try {
      await deletePeriod(selectedPeriodId);
      toast.success("Periode evaluasi berhasil dihapus.");
      setSelectedPeriodId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus periode.");
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-border/50 pb-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl md:text-5xl text-foreground tracking-[0.2em] uppercase leading-none">Penilaian</h1>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">Monitor perkembangan atlet dan kelola rapor evaluasi periode.</p>
        </div>
        <AddPeriodDialog />
      </div>

      {/* Control Panel: Periods, Groups, Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Period & Group Selectors */}
        <div className="lg:col-span-4 flex flex-col gap-4 bg-card/40 backdrop-blur-md border border-border/50 p-5 rounded-3xl shadow-xl">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Periode Aktif</label>
              <div className="flex items-center gap-2">
                {selectedPeriod && !selectedPeriod.isActive && (
                  <button onClick={() => handleSetActive(selectedPeriod.id)} className="text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20">
                    Aktifkan
                  </button>
                )}
                {selectedPeriod && (
                  <AlertDialog>
                    <AlertDialogTrigger>
                      <button className="p-1 rounded-lg text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive transition-all">
                        <Trash2 className="size-3.5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-heading uppercase tracking-widest text-destructive">Hapus Periode?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground font-medium">
                          Periode <span className="text-foreground font-black">&quot;{selectedPeriod.name}&quot;</span> akan dihapus permanen.
                          {!canDeletePeriod && (
                            <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs leading-relaxed font-bold">
                              Hapus semua data nilai terlebih dahulu sebelum menghapus periode ini.
                            </div>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePeriod} disabled={!canDeletePeriod} className="rounded-xl bg-destructive text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-destructive/20">Hapus Permanen</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
            <div className="relative">
              <CalendarRange className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10" />
              <Select value={selectedPeriodId ?? ""} onValueChange={(val) => setSelectedPeriodId(val)}>
                <SelectTrigger className="pl-10 h-12 rounded-2xl border-border/50 bg-background/50 hover:bg-background transition-all">
                  <SelectValue placeholder="Pilih Periode" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-2xl border-border/40">
                  {periods?.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="rounded-xl py-3 text-xs font-bold uppercase tracking-wider">
                      {periodDisplayLabel(p)} {p.isActive && " (Aktif)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Kelompok Latihan</label>
            <div className="relative">
              <SelectIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10" />
              <Select value={activeGroup} onValueChange={(val) => setActiveGroup(val ?? "all")}>
                <SelectTrigger className="pl-10 h-12 rounded-2xl border-border/50 bg-background/50 hover:bg-background transition-all">
                  <SelectValue placeholder="Semua Kelompok" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-2xl border-border/40">
                  <SelectItem value="all" className="rounded-xl py-3 text-xs font-bold uppercase tracking-wider">Semua Kelompok</SelectItem>
                  {groups?.map((g) => (
                    <SelectItem key={g.id} value={g.id} className="rounded-xl py-3 text-xs font-bold uppercase tracking-wider">{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Right: Search, Status Filter & Progress Summary */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-all" />
              <input
                type="text"
                placeholder="Cari Nama Pemain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-10 pr-10 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all shadow-lg shadow-black/5"
              />
              {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-all"><X className="size-3 text-muted-foreground" /></button>}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="outline" className="h-12 px-6 rounded-2xl border-border/50 bg-card/40 backdrop-blur-md text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 transition-all shadow-lg shadow-black/5">
                  <Filter className="size-3.5 mr-2" />
                  {statusFilter === "ALL" ? "Semua Status" : statusFilter === "DRAFT" ? "Draft Nilai" : statusFilter === "PUBLISHED" ? "Sudah Selesai" : "Belum Diisi"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1 shadow-2xl backdrop-blur-xl bg-card/95 border-border/40">
                <DropdownMenuItem onClick={() => setStatusFilter("ALL")} className="rounded-xl text-[10px] font-black uppercase py-3 cursor-pointer">Semua Status</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("PUBLISHED")} className="rounded-xl text-[10px] font-black uppercase py-3 cursor-pointer text-emerald-500">Sudah Selesai</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("DRAFT")} className="rounded-xl text-[10px] font-black uppercase py-3 cursor-pointer text-amber-500">Masih Draft</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("UNFILLED")} className="rounded-xl text-[10px] font-black uppercase py-3 cursor-pointer text-muted-foreground">Belum Diisi</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Progress Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60">Selesai</span>
              <span className="text-xl font-bold text-emerald-500 tabular-nums">{statsSummary.published}</span>
            </div>
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-500/60">Masih Draft</span>
              <span className="text-xl font-bold text-amber-500 tabular-nums">{statsSummary.draft}</span>
            </div>
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">Total Pemain</span>
              <span className="text-xl font-bold text-primary tabular-nums">{(players?.length ?? 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!selectedPeriodId ? (
        <div className="rounded-3xl border border-dashed border-border/60 bg-card/30 backdrop-blur-sm p-20 text-center flex flex-col items-center gap-4">
          <CalendarRange className="size-12 text-muted-foreground/20" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Pilih Periode Evaluasi</p>
            <p className="text-[10px] font-bold text-muted-foreground/40 italic">Buat periode baru melalui tombol di pojok kanan atas.</p>
          </div>
        </div>
      ) : (
        <div className="bg-card/40 backdrop-blur-md border border-border/60 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-separate border-spacing-0">
              <thead className="bg-muted/30 text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                <tr>
                  <th className="px-4 py-5 w-12 text-center sticky left-0 bg-muted/95 z-30 border-b border-border/40">No</th>
                  <th className="px-5 py-5 min-w-[200px] sticky left-12 bg-muted/95 z-30 border-b border-border/40">Nama Pemain</th>
                  {FLAT_METRIC_DEFS.map((def) => (
                    <th key={def.key} className="px-1 py-5 text-center text-[9px] font-black border-b border-border/40 min-w-[45px]" title={def.label}>
                      {def.shortLabel}
                    </th>
                  ))}
                  <th className="px-4 py-5 text-center border-b border-border/40 w-24">Nilai</th>
                  <th className="px-4 py-5 text-center border-b border-border/40 w-32">Status</th>
                  <th className="px-4 py-5 text-right border-b border-border/40 w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {(playersLoading || statsLoading) ? (
                  <tr>
                    <td colSpan={FLAT_METRIC_DEFS.length + 5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="size-8 animate-spin text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Sinkronisasi Nilai...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPlayersByGroup.length === 0 ? (
                  <tr>
                    <td colSpan={FLAT_METRIC_DEFS.length + 5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <Activity className="size-12" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Data Tidak Ditemukan</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPlayersByGroup.map(({ group, players: gPlayers }) => (
                    <React.Fragment key={group.id}>
                      {/* Group Header Row */}
                      <tr className="bg-primary/5">
                        <td colSpan={FLAT_METRIC_DEFS.length + 5} className="px-6 py-3 border-y border-primary/10">
                          <div className="flex items-center gap-2">
                            <div className="h-1 w-4 bg-primary rounded-full" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">{group.name}</span>
                            <ChevronRight className="size-3 text-primary/30" />
                            <span className="text-[9px] font-bold text-muted-foreground/60">{gPlayers.length} Pemain</span>
                          </div>
                        </td>
                      </tr>

                      {gPlayers.map((player, idx) => {
                        const stat = statsMap[player.id];
                        return <PlayerStatRow key={player.id} player={player} idx={idx} stat={stat} group={group} selectedPeriod={selectedPeriod} settings={settings} />;
                      })}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
