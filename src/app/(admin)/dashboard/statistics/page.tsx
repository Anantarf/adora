"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Loader2, LayoutList as SelectIcon, CalendarRange, Trash2 } from "lucide-react";
import { usePlayers } from "@/hooks/use-players";
import { useGroups } from "@/hooks/use-groups";
import { usePeriods, useSetActivePeriod, useDeletePeriod } from "@/hooks/use-evaluation-periods";
import { useStatsByPeriod } from "@/hooks/use-statistics";
import { AddStatDialog } from "@/components/features/AddStatDialog";
import { AddPeriodDialog } from "@/components/features/AddPeriodDialog";
import type { Player, MetricsJson } from "@/types/dashboard";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { dribbleTotal, passingTotal } from "@/lib/metrics";

const STATUS_BADGE_CONFIG = {
  Draft:     { label: "Draft",   className: "border-sky-500/50 text-sky-400 bg-sky-500/10" },
  Published: { label: "Selesai", className: "border-primary/50 text-primary bg-primary/10 font-heading" },
} satisfies Record<string, { label: string; className: string }>;

const MetricCell = ({ v }: { v?: number }) =>
  v != null
    ? <span className="font-bold text-primary">{v}</span>
    : <span className="text-muted-foreground">—</span>;

const periodDisplayLabel = (period: { name: string; startDate: Date | string; endDate: Date | string }) => {
  const trimmedName = (period.name || "").trim();
  if (trimmedName) return trimmedName;
  const start = new Date(period.startDate);
  const end = new Date(period.endDate);
  const startLabel = Number.isNaN(start.getTime()) ? "?" : start.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  const endLabel = Number.isNaN(end.getTime()) ? "?" : end.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  return `Periode ${startLabel} - ${endLabel}`;
};

// ─── Page ─────────────────────────────────────────────
export default function StatisticsPage() {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string>("all");
  const { data: periods} = usePeriods();
  const { data: groups } = useGroups();
  const { data: players, isLoading: playersLoading } = usePlayers(activeGroup);
  const { data: stats, isLoading: statsLoading } = useStatsByPeriod(selectedPeriodId);
  const { mutateAsync: setActive } = useSetActivePeriod();
  const { mutateAsync: deletePeriod } = useDeletePeriod();

  // Auto-select active period on first load
  useEffect(() => {
    if (periods && !selectedPeriodId) {
      const active = periods.find((p) => p.isActive);
      if (active) setSelectedPeriodId(active.id);
      else if (periods.length > 0) setSelectedPeriodId(periods[0].id);
    }
  }, [periods]);

  // Build stats lookup: playerId → stat record
  const statsMap = useMemo(() => Object.fromEntries((stats ?? []).map((s) => [s.player.id, s])), [stats]);

  // Group players by group (preserving group order from groups list)
  const playersByGroup = useMemo(() => {
    if (!players || !groups) return [];
    return groups
      .map((group) => ({ group, players: players.filter((p) => p.groupId === group.id) }))
      .filter((g) => g.players.length > 0);
  }, [players, groups]);

  const statsSummary = useMemo(() => ({
    published: stats?.filter((s) => s.status === "Published").length ?? 0,
    draft: stats?.filter((s) => s.status === "Draft").length ?? 0,
  }), [stats]);

  const totalPlayerCount = playersByGroup.reduce((n, g) => n + g.players.length, 0);

  const selectedPeriod = periods?.find((p) => p.id === selectedPeriodId);
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
    if (!selectedPeriodId) return;
    try {
      await deletePeriod(selectedPeriodId);
      toast.success("Periode evaluasi berhasil dihapus.");
      setSelectedPeriodId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus periode evaluasi.");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="font-heading text-4xl text-foreground tracking-widest uppercase">Input Penilaian</h1>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">Manajemen rapor dan statistik pemain klub</p>
        </div>
        <AddPeriodDialog />
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start bg-card p-4 rounded-xl border border-border/40 shadow-sm">
        {/* Period selector */}
        <div className="flex flex-col gap-1.5 w-full md:min-w-[16rem]">
          <div className="flex items-center gap-3 ml-1">
            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mr-1">Periode Evaluasi</label>
            {/* Contextual Actions */}
            <div className="flex items-center gap-1.5">
              {selectedPeriod && !selectedPeriod.isActive && (
                <button onClick={() => handleSetActive(selectedPeriod.id)} className="text-[10px] px-2.5 py-1 rounded flex items-center justify-center font-bold uppercase tracking-widest bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  Aktifkan
                </button>
              )}
              {selectedPeriod && (
                <AlertDialog>
                  <AlertDialogTrigger className="p-1.5 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors outline-none">
                    <Trash2 className="size-3.5" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-heading uppercase tracking-widest text-secondary">Hapus Periode?</AlertDialogTitle>
                      <AlertDialogDescription className="flex flex-col gap-2">
                         <span className="text-destructive font-bold text-sm">Periode &quot;{selectedPeriod.name}&quot; akan dihapus permanen.</span>
                         {!canDeletePeriod ? (
                           <span className="text-muted-foreground text-xs leading-relaxed">
                            Anda tidak bisa menghapus periode ini karena sudah terdapat {statsSummary.published + statsSummary.draft} data statistik pemain di dalamnya. Kosongkan data terlebih dahulu jika ingin menghapus.
                           </span>
                         ) : (
                           <span className="text-muted-foreground text-xs leading-relaxed">
                            Tindakan ini tidak dapat dibatalkan. Pastikan Anda menghapus periode yang tepat.
                           </span>
                         )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeletePeriod} disabled={!canDeletePeriod} className="bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50">
                        Iya, Hapus Permanen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          <div className="relative group w-full">
            <CalendarRange className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10" />
            <Select value={selectedPeriodId ?? ""} onValueChange={setSelectedPeriodId}>
              <SelectTrigger className="pl-9 h-11 border-border/50 bg-background/50 focus-visible:ring-primary/30">
                <SelectValue placeholder={periods?.length === 0 ? "Belum ada periode - buat dulu" : "Pilih Periode"}>
                  {selectedPeriod ? (
                    <div className="flex items-center">
                      <span>{periodDisplayLabel(selectedPeriod)}</span>
                      {selectedPeriod.isActive && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20 leading-none">
                          Aktif
                        </span>
                      )}
                    </div>
                  ) : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} sideOffset={6} className="max-h-60 rounded-xl border-border/50">
                {periods?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{periodDisplayLabel(p)}</span>
                      {p.isActive && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20 leading-none">
                          Aktif
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Group filter */}
        <div className="flex flex-col gap-1.5 w-full md:min-w-[14rem]">
          <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Filter Kelompok</label>
          <div className="relative group">
            <SelectIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10" />
            <Select value={activeGroup} onValueChange={(v) => setActiveGroup(v ?? "all")}>
              <SelectTrigger className="pl-9 h-11 border-border/50 bg-background/50 focus-visible:ring-primary/30">
                <SelectValue placeholder="Pilih Kelompok">
                  {activeGroup === "all" ? "Semua Kelompok" : groups?.find((g) => g.id === activeGroup)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} sideOffset={6} className="max-h-60 rounded-xl border-border/50">
                <SelectItem value="all">Semua Kelompok</SelectItem>
                {groups?.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats summary - Precise Alignment Structure */}
        {selectedPeriodId && !statsLoading && (
          <div className="md:self-end ml-auto">
            <div className="flex items-center gap-6 h-11">
              <div className="w-px h-6 bg-border/60 mx-2" />
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Selesai</span>
                <span className="text-sm font-bold text-primary tabular-nums">{statsSummary.published}</span>
              </div>
              <div className="size-1 rounded-full bg-border/60" />
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Draft</span>
                <span className="text-sm font-bold text-foreground tabular-nums">{statsSummary.draft}</span>
              </div>
              <div className="size-1 rounded-full bg-border/60" />
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Total</span>
                <span className="text-sm font-bold text-foreground tabular-nums">{totalPlayerCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty state: no period selected */}
      {!selectedPeriodId && (
        <div className="rounded-xl border border-dashed border-border/60 bg-card p-12 text-center">
          <CalendarRange className="size-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-foreground">Belum ada periode evaluasi</p>
          <p className="text-sm text-muted-foreground mt-1">Buat periode baru untuk mulai input nilai.</p>
        </div>
      )}

      {/* Table */}
      {selectedPeriodId && (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm overflow-x-auto">
          <Table className="min-w-175">
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b border-border/50">
                <TableHead className="w-10 text-center text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">No</TableHead>
                <TableHead className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Nama Pemain</TableHead>
                <TableHead className="w-24 text-center text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Dribble</TableHead>
                <TableHead className="w-24 text-center text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Passing</TableHead>
                <TableHead className="w-24 text-center text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Lay Up</TableHead>
                <TableHead className="w-24 text-center text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Shooting</TableHead>
                <TableHead className="w-24 text-center text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Status</TableHead>
                <TableHead className="w-36 text-right text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(playersLoading || statsLoading) && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2 text-primary font-bold">
                      <Loader2 className="size-5 animate-spin" /> Mengambil data...
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!playersLoading && !statsLoading && playersByGroup.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    {(players?.length ?? 0) === 0 ? (
                      <>
                        <p className="font-semibold text-foreground text-sm">Belum ada pemain terdaftar</p>
                        <p className="text-xs text-muted-foreground mt-1">Tambah pemain terlebih dahulu melalui halaman Pemain.</p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-foreground text-sm">Semua pemain belum memiliki kelompok</p>
                        <p className="text-xs text-muted-foreground mt-1">Tetapkan kelompok pada pemain melalui halaman Pemain.</p>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              )}
              {!playersLoading &&
                !statsLoading &&
                playersByGroup.map(({ group, players: gPlayers }) => (
                  <React.Fragment key={group.id}>
                    {/* Group header row */}
                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                      <TableCell colSpan={8} className="font-bold text-primary uppercase tracking-widest text-sm py-2.5 pl-3 border-l-4 border-primary">
                        {group.name}
                      </TableCell>
                    </TableRow>

                    {/* Player rows */}
                    {gPlayers.map((player, idx) => {
                      const stat = statsMap[player.id];
                      const m = stat?.metricsJson as MetricsJson | undefined;

                      return (
                        <TableRow key={player.id} className="even:bg-muted/10 hover:bg-muted/30 transition-colors">
                          <TableCell className="text-center text-muted-foreground font-medium">{idx + 1}</TableCell>
                          <TableCell className="font-semibold">{player.name}</TableCell>
                          <TableCell className="text-center font-mono text-sm"><MetricCell v={m ? dribbleTotal(m.dribble) : undefined} /></TableCell>
                          <TableCell className="text-center font-mono text-sm"><MetricCell v={m ? passingTotal(m.passing) : undefined} /></TableCell>
                          <TableCell className="text-center font-mono text-sm"><MetricCell v={m?.layUp} /></TableCell>
                          <TableCell className="text-center font-mono text-sm"><MetricCell v={m?.shooting} /></TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-[10px] uppercase tracking-widest font-bold ${stat ? STATUS_BADGE_CONFIG[stat.status as keyof typeof STATUS_BADGE_CONFIG].className : "text-muted-foreground border-border/50"}`}>
                              {stat ? STATUS_BADGE_CONFIG[stat.status as keyof typeof STATUS_BADGE_CONFIG].label : "Belum"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">

                              <AddStatDialog player={player} periodId={selectedPeriodId} isPeriodActive={selectedPeriod?.isActive} existingStat={stat ? { id: stat.id, metrics: stat.metricsJson as MetricsJson, status: stat.status as "Draft" | "Published" } : undefined} />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
