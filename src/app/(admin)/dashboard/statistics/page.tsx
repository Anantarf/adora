"use client";

import { useState, useMemo, useEffect } from "react";
import { Loader2, LayoutList as SelectIcon, CalendarRange, History } from "lucide-react";
import { usePlayers } from "@/hooks/use-players";
import { useGroups } from "@/hooks/use-groups";
import { usePeriods, useSetActivePeriod } from "@/hooks/use-evaluation-periods";
import { useStatsByPeriod } from "@/hooks/use-statistics";
import { AddStatDialog } from "@/components/features/AddStatDialog";
import { AddPeriodDialog } from "@/components/features/AddPeriodDialog";
import type { Player, MetricsJson } from "@/types/dashboard";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Helpers ─────────────────────────────────────────
const dribbleTotal = (m: MetricsJson["dribble"]) =>
  m.inAndOut + m.crossover + m.vLeft + m.vRight + m.betweenLegsLeft + m.betweenLegsRight;

const passingTotal = (m: MetricsJson["passing"]) =>
  m.chestPass + m.bouncePass + m.overheadPass;

// ─── Page ─────────────────────────────────────────────
export default function StatisticsPage() {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string>("all");
  const [historyTarget, setHistoryTarget] = useState<string | null>(null);

  const { data: periods } = usePeriods();
  const { data: groups } = useGroups();
  const { data: players, isLoading: playersLoading } = usePlayers(activeGroup);
  const { data: stats, isLoading: statsLoading } = useStatsByPeriod(selectedPeriodId);
  const { mutateAsync: setActive } = useSetActivePeriod();

  // Auto-select active period on first load
  useEffect(() => {
    if (periods && !selectedPeriodId) {
      const active = periods.find(p => p.isActive);
      if (active) setSelectedPeriodId(active.id);
      else if (periods.length > 0) setSelectedPeriodId(periods[0].id);
    }
  }, [periods, selectedPeriodId]);

  // Build stats lookup: playerId → stat record
  const statsMap = useMemo(
    () => Object.fromEntries((stats ?? []).map(s => [s.player.id, s])),
    [stats]
  );

  // Group players by group (preserving group order from groups list)
  const playersByGroup = useMemo(() => {
    if (!players || !groups) return [];
    const grouped = players.reduce<Record<string, Player[]>>((acc, p) => {
      const key = p.groupId || "ungrouped";
      acc[key] = acc[key] || [];
      acc[key].push(p);
      return acc;
    }, {});
    return groups
      .map(group => ({ group, players: grouped[group.id] ?? [] }))
      .filter(g => g.players.length > 0);
  }, [players, groups]);

  const selectedPeriod = periods?.find(p => p.id === selectedPeriodId);

  const handleSetActive = async (periodId: string) => {
    try {
      await setActive(periodId);
      toast.success("Periode aktif diperbarui.");
    } catch {
      toast.error("Gagal mengubah periode aktif.");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="font-heading text-4xl text-foreground tracking-widest uppercase">Evaluasi Rapor Kinerja</h1>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">Rekam dan finalisasi data performa individual anak didik per periode evaluasi.</p>
        </div>
        <AddPeriodDialog />
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-end bg-card p-4 rounded-xl border border-border/40 shadow-sm">
        {/* Period selector */}
        <div className="flex flex-col gap-1.5 w-full md:w-[300px]">
          <label className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground">Periode Evaluasi</label>
          <div className="relative group">
            <CalendarRange className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10" />
            <Select value={selectedPeriodId ?? ""} onValueChange={setSelectedPeriodId}>
              <SelectTrigger className="pl-9 h-11 border-border/50 bg-background/50 focus-visible:ring-primary/30">
                <SelectValue placeholder={periods?.length === 0 ? "Belum ada periode — buat dulu" : "Pilih Periode"} />
              </SelectTrigger>
              <SelectContent>
                {periods?.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.isActive && <span className="text-primary font-bold">(Aktif)</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedPeriod && !selectedPeriod.isActive && (
            <button
              onClick={() => handleSetActive(selectedPeriod.id)}
              className="text-[10px] text-primary underline underline-offset-2 text-left w-fit"
            >
              Jadikan periode aktif
            </button>
          )}
        </div>

        {/* Group filter */}
        <div className="flex flex-col gap-1.5 w-full md:w-[250px]">
          <label className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground">Filter Kelompok</label>
          <div className="relative group">
            <SelectIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10" />
            <Select value={activeGroup} onValueChange={v => setActiveGroup(v ?? "all")}>
              <SelectTrigger className="pl-9 h-11 border-border/50 bg-background/50 focus-visible:ring-primary/30">
                <SelectValue placeholder="Pilih Kelompok" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelompok</SelectItem>
                {groups?.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats summary */}
        {selectedPeriodId && !statsLoading && (
          <div className="flex gap-3 ml-auto">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Sudah Dinilai</p>
              <p className="text-xl font-bold text-primary">{stats?.filter(s => s.status === "Published").length ?? 0}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Pemain</p>
              <p className="text-xl font-bold text-foreground">{players?.length ?? 0}</p>
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
          <Table className="min-w-[700px]">
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b border-border/50">
                <TableHead className="w-10 text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">No</TableHead>
                <TableHead className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Nama Pemain</TableHead>
                <TableHead className="text-center text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Dribble</TableHead>
                <TableHead className="text-center text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Passing</TableHead>
                <TableHead className="text-center text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Lay Up</TableHead>
                <TableHead className="text-center text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Shooting</TableHead>
                <TableHead className="text-center text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Status</TableHead>
                <TableHead className="text-right text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Aksi</TableHead>
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
              {!playersLoading && !statsLoading && playersByGroup.map(({ group, players: gPlayers }) => (
                <>
                  {/* Group header row */}
                  <TableRow key={`group-${group.id}`} className="bg-muted/20 hover:bg-muted/20">
                    <TableCell colSpan={8} className="font-bold text-primary uppercase tracking-widest text-sm py-2.5 pl-4">
                      {group.name}
                    </TableCell>
                  </TableRow>

                  {/* Player rows */}
                  {gPlayers.map((player, idx) => {
                    const stat = statsMap[player.id];
                    const m = stat?.metricsJson as MetricsJson | undefined;

                    return (
                      <TableRow key={player.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="text-muted-foreground font-medium">{idx + 1}</TableCell>
                        <TableCell className="font-semibold">{player.name}</TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {m ? <span className="font-bold text-primary">{dribbleTotal(m.dribble)}</span> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {m ? <span className="font-bold text-primary">{passingTotal(m.passing)}</span> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {m ? <span className="font-bold text-primary">{m.layUp}</span> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {m ? <span className="font-bold text-primary">{m.shooting}</span> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {!stat && <Badge variant="outline" className="text-muted-foreground border-border/50 text-[10px]">Belum</Badge>}
                          {stat?.status === "Draft" && <Badge variant="outline" className="border-yellow-500/50 text-yellow-600 bg-yellow-500/10 text-[10px]">Draft</Badge>}
                          {stat?.status === "Published" && <Badge variant="outline" className="border-green-500/50 text-green-600 bg-green-500/10 text-[10px]">Published</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {stat && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-foreground"
                                onClick={() => setHistoryTarget(stat.id)}
                                title="Lihat riwayat revisi"
                              >
                                <History className="size-4" />
                              </Button>
                            )}
                            <AddStatDialog
                              player={player}
                              periodId={selectedPeriodId}
                              existingStat={stat ? { id: stat.id, metrics: stat.metricsJson as MetricsJson, status: stat.status as "Draft" | "Published" } : undefined}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
