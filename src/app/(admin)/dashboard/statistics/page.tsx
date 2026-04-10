"use client";

import { useState, useMemo } from "react";
import { Loader2, CalendarDays, LayoutList as SelectIcon } from "lucide-react";
import { usePlayers } from "@/hooks/use-players";
import { useGroups, type Group } from "@/hooks/use-groups";
import { AddStatDialog } from "@/components/features/AddStatDialog";
import { getJakartaToday, toYYYYMMDD } from "@/lib/date-utils";
import { type Player } from "@/types/dashboard";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function StatisticsPage() {
  const [activeGroup, setActiveGroup] = useState<string>("all");
  const [date, setDate] = useState<string>(toYYYYMMDD(getJakartaToday()));

  const { data: groups } = useGroups();
  const { data: players, isLoading: playersLoading } = usePlayers(activeGroup);

  // Organize players by group
  const playersByGroup = useMemo(() => {
    if (!players || !groups) return [];

    // Group players by groupId
    const grouped = players.reduce(
      (acc, player) => {
        const groupId = player.groupId || null;
        return { ...acc, [groupId || "null"]: [...(acc[groupId || "null"] || []), player] };
      },
      {} as Record<string, Player[]>
    );

    // Map groups to players, filtering empty groups
    return groups
      .map(group => ({ group, players: grouped[group.id] || [] }))
      .filter(g => g.players.length > 0);
  }, [players, groups]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="font-heading text-4xl text-foreground tracking-widest uppercase">Evaluasi Rapor Kinerja</h1>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">Rekam dan finalisasi data performa individual anak didik untuk kebutuhan Rapor PDF.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end bg-card p-4 rounded-xl border border-border/40 shadow-sm">
        <div className="flex flex-col gap-1.5 w-full md:w-[250px]">
          <label className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground">Filter Grup / Kelas</label>
          <div className="relative group">
            <SelectIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary z-10" />
            <Select value={activeGroup} onValueChange={(val: string | null) => setActiveGroup(val || "all")}>
              <SelectTrigger className="pl-9 h-11 border-border/50 bg-background/50 focus-visible:ring-primary/30">
                <SelectValue placeholder="Pilih Grup" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Pemain Lintas Kelas</SelectItem>
                {groups?.map((group) => (
                  <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 w-full md:w-[200px]">
          <label className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground">Periode Pelaporan (Bulan/Tahun)</label>
          <div className="relative group">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary z-10" />
            <Input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-9 h-11 border-border/50 bg-background/50 focus-visible:ring-primary/30"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm mt-2 overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-b border-border/50">
              <TableHead className="w-[80px] text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">No</TableHead>
              <TableHead className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Nama Atlet</TableHead>
              <TableHead className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Kelas</TableHead>
              <TableHead className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground text-right border-border/50">Aksi Evaluasi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {playersLoading && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-primary font-bold">
                    <Loader2 className="size-5 animate-spin" /> Mengambil Profil Pemain...
                  </div>
                </TableCell>
              </TableRow>
            )}
            {playersByGroup.length === 0 && !playersLoading && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground font-semibold">
                  Tabel pemain kosong didalam filter grup ini.
                </TableCell>
              </TableRow>
            )}
            {playersByGroup.map(({ group, players: groupPlayers }) => (
              <TableRow key={group.id} className="bg-muted/20 hover:bg-muted/20">
                <TableCell colSpan={4} className="font-bold text-primary uppercase tracking-widest text-sm py-3">
                  {group.name}
                </TableCell>
              </TableRow>
            )).concat(
              playersByGroup.flatMap(({ group, players: groupPlayers }, groupIdx) =>
                groupPlayers.map((player: Player, playerIdx: number) => (
                  <TableRow key={player.id} className="group hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium text-muted-foreground">{playerIdx + 1}</TableCell>
                    <TableCell className="font-semibold text-secondary">{player.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary border border-primary/20">
                        {player.group?.name || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <AddStatDialog player={player} date={date} />
                    </TableCell>
                  </TableRow>
                ))
              )
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
