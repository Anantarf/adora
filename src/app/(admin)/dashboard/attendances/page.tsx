"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2, CheckSquare, CalendarDays, LayoutList as SelectIcon } from "lucide-react";
import { usePlayers } from "@/hooks/use-players";
import { useGroups } from "@/hooks/use-groups";
import { useAddAttendances, useAttendances } from "@/hooks/use-attendances";
import { toast } from "sonner";
import { getJakartaToday, toYYYYMMDD } from "@/lib/date-utils";
import { AttendanceStatus, Player } from "@/types/dashboard";

import { Button } from "@/components/ui/button";
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

export default function AttendancesPage() {
  const [activeGroup, setActiveGroup] = useState<string>("all");
  // Jakarta Midnight Date Sync
  const [date, setDate] = useState<string>(toYYYYMMDD(getJakartaToday()));
  const [batchStatus, setBatchStatus] = useState<Record<string, AttendanceStatus>>({});

  const { data: groups } = useGroups();
  const { data: players, isLoading: playersLoading } = usePlayers(activeGroup);
  const { mutateAsync: sendBatch, isPending } = useAddAttendances();
  const { data: existingAttendances } = useAttendances(date, activeGroup !== "all" ? activeGroup : undefined);

  // Sync DB data into editable local state when date/query changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setBatchStatus(
      Object.fromEntries(existingAttendances?.map(a => [a.playerId, a.status]) ?? [])
    );
  }, [existingAttendances]);

  const handleStatusChange = (playerId: string, status: AttendanceStatus) => {
    setBatchStatus(prev => ({ ...prev, [playerId]: status }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    if (!players) return;
    const updated: Record<string, AttendanceStatus> = { ...batchStatus };
    players.forEach((p) => {
      updated[p.id] = status;
    });
    setBatchStatus(updated);
    const label = status === "HADIR" ? "HADIR" : status === "IZIN" ? "IZIN" : status === "SAKIT" ? "SAKIT" : "ALPA";
    toast.info(`Semua ditandai sebagai ${label}.`);
  };

  const handleBatchSubmit = async () => {
    if (!players || players.length === 0) {
      toast.warning("Pilih grup latihan dulu.");
      return;
    }
    if (!date) {
      toast.warning("Tanggal wajib diisi.");
      return;
    }

    const playerStatuses = players.map((p) => ({
      playerId: p.id,
      status: batchStatus[p.id] || "HADIR", 
    }));

    try {
      await sendBatch({ date, playerStatuses });
      toast.success("Presensi berhasil disimpan.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Terjadi kesalahan tak dikenal.";
      toast.error("Gagal menyimpan: " + msg);
    }
  };

  const statsCount = useMemo(() => {
    if (!players) return { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };
    const counts = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };
    players.forEach((p) => {
      const s = batchStatus[p.id] || "HADIR";
      counts[s]++;
    });
    return counts;
  }, [players, batchStatus]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="font-heading text-4xl text-foreground tracking-widest uppercase">Daftar Hadir Latihan</h1>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">Buku absen kelompok (Batching Input) untuk mempermudah pelatih di lapangan.</p>
        </div>
        <div className="flex items-center gap-2">
            {Object.entries(statsCount).map(([label, count]) => (
                <div key={label} className="flex flex-col items-center px-4 py-1.5 bg-card border border-border/40 rounded-xl">
                    <span className="text-[10px] font-black tracking-widest text-muted-foreground">{label}</span>
                    <span className="text-lg font-bold text-secondary">{count}</span>
                </div>
            ))}
        </div>
      </div>

      {/* Controller Top Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-end bg-card p-4 rounded-xl border border-border/40 shadow-sm">
        <div className="flex flex-col gap-1.5 w-full md:w-[250px]">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kelas Latihan</label>
          <div className="relative group">
            <SelectIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary z-10" />
            <Select value={activeGroup} onValueChange={(val: string | null) => setActiveGroup(val || "all")}>
              <SelectTrigger className="pl-9 h-11 border-border/50 bg-background/50 focus-visible:ring-primary/30">
                <SelectValue placeholder="Pilih Grup" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Pemain Lintas Kelas</SelectItem>
                {groups?.map((group: { id: string; name: string }) => (
                  <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 w-full md:w-[200px]">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tanggal Pertemuan</label>
          <div className="relative group">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary z-10" />
            <Input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-9 h-11 border-border/50 bg-background/50 focus-visible:ring-primary/30 font-bold"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto w-full md:w-auto flex-wrap">
            <Button
                variant="outline"
                size="lg"
                onClick={() => handleMarkAll("HADIR")}
                disabled={!players || players.length === 0}
                className="h-11 font-bold uppercase tracking-widest text-xs text-green-600 border-green-500/30 hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/50 flex-1 md:flex-none"
            >
                Semua Hadir
            </Button>
            <Button
                variant="outline"
                size="lg"
                onClick={() => handleMarkAll("IZIN")}
                disabled={!players || players.length === 0}
                className="h-11 font-bold uppercase tracking-widest text-xs text-amber-500 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-600 hover:border-amber-500/50 flex-1 md:flex-none"
            >
                Semua Izin
            </Button>
            <Button
                variant="outline"
                size="lg"
                onClick={() => handleMarkAll("SAKIT")}
                disabled={!players || players.length === 0}
                className="h-11 font-bold uppercase tracking-widest text-xs text-orange-500 border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-600 hover:border-orange-500/50 flex-1 md:flex-none"
            >
                Semua Sakit
            </Button>
            <Button
                variant="outline"
                size="lg"
                onClick={() => handleMarkAll("ALPA")}
                disabled={!players || players.length === 0}
                className="h-11 font-bold uppercase tracking-widest text-xs text-red-500 border-red-500/30 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/50 flex-1 md:flex-none"
            >
                Semua Alpa
            </Button>
            <Button
                size="lg"
                onClick={handleBatchSubmit}
                disabled={isPending || !players || players.length === 0}
                className="h-11 font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20 flex-1 md:flex-none"
            >
                {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : <CheckSquare className="size-4 mr-2" />}
                Lapor Kehadiran
            </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm mt-2 overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-b border-border/50">
              <TableHead className="w-[80px] text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">No</TableHead>
              <TableHead className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Nama Atlet</TableHead>
              <TableHead className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Kelas</TableHead>
              <TableHead className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground text-right w-[200px]">Status Presensi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {playersLoading && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-primary font-bold">
                    <Loader2 className="size-5 animate-spin" /> Menarik Manifest Siswa...
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!playersLoading && players?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground font-semibold">
                  Grup kosong. Mohon pilih grup kelas yang lain.
                </TableCell>
              </TableRow>
            )}
            {players?.map((player: Player, idx: number) => (
              <TableRow key={player.id} className="group hover:bg-muted/40 transition-colors">
                <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                <TableCell className="font-semibold text-secondary">{player.name}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-md bg-secondary/10 px-2 py-1 text-xs font-semibold text-secondary border border-secondary/20">
                    {player.group?.name || "-"}
                  </span>
                </TableCell>
                <TableCell>
                  <Select 
                    value={batchStatus[player.id] || "HADIR"} 
                    onValueChange={(val: string | null) => handleStatusChange(player.id, (val as AttendanceStatus) || "HADIR")}
                  >
                    <SelectTrigger className="w-full h-9 font-black hover:border-primary/50 text-[10px] tracking-widest uppercase">
                      <SelectValue placeholder="STATUS" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HADIR"><span className="text-green-600 font-black tracking-widest">HADIR</span></SelectItem>
                      <SelectItem value="IZIN"><span className="text-amber-500 font-black tracking-widest">IZIN</span></SelectItem>
                      <SelectItem value="SAKIT"><span className="text-orange-500 font-black tracking-widest">SAKIT</span></SelectItem>
                      <SelectItem value="ALPA"><span className="text-destructive font-black tracking-widest">ALPA</span></SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
