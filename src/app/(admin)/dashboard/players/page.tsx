"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Edit2, Trash2, ShieldAlert, Filter } from "lucide-react";
import { usePlayers, type Player } from "@/hooks/use-players";
import { useGroups } from "@/hooks/use-groups";
import { useState, useMemo } from "react";
import { AddPlayerDialog } from "@/components/features/AddPlayerDialog";
import { EditPlayerDialog } from "@/components/features/EditPlayerDialog";
import { DeletePlayerConfirm } from "@/components/features/DeletePlayerConfirm";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ADORA Basketball - Senior Styled Management Page
 * Features: Framer Motion interactions, Glassmorphism, Robust Search
 */
export default function PlayersPage() {
  const [activeGroup, setActiveGroup] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // State manajemen Edit/Delete
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);

  const { data: players, isLoading, isError } = usePlayers(activeGroup);
  const { data: groups } = useGroups();

  // Filter logic (Performance optimized with useMemo)
  const filteredPlayers = useMemo(() => {
    if (!players) return [];
    return players.filter((p: Player) => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.schoolOrigin?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [players, searchQuery]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20"
    >
      {/* Modals Manager */}
      {editingPlayer && (
        <EditPlayerDialog 
            player={editingPlayer} 
            open={!!editingPlayer} 
            onOpenChange={(open) => !open && setEditingPlayer(null)} 
        />
      )}
      {deletingPlayer && (
        <DeletePlayerConfirm 
            player={deletingPlayer} 
            open={!!deletingPlayer} 
            onOpenChange={(open) => !open && setDeletingPlayer(null)} 
        />
      )}

      {/* Dynamic Header Section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-5xl md:text-6xl font-heading uppercase tracking-widest text-foreground">Roster Atlet</h1>
          <p className="text-muted-foreground font-medium max-w-lg border-l-2 border-primary/40 pl-4 py-1 tracking-wide">
            Data terpusat untuk profil atlet klub. Kelola, filter, dan pantau status pendaftaran secara real-time.
          </p>
        </div>
        <AddPlayerDialog />
      </section>

      {/* Control Layer (Senior UX) */}
      <div className="glass-card p-6 rounded-3xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
          <Input 
            placeholder="Cari nama atau asal sekolah..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 rounded-2xl border-border/40 bg-background/40 focus-visible:ring-primary/20 focus-visible:border-primary/50 text-base shadow-inner"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mr-2">
            <Filter className="size-3" /> Filter Grup:
          </div>
          <Select value={activeGroup} onValueChange={(val) => setActiveGroup(val || "all")}>
            <SelectTrigger className="w-full md:w-[220px] h-14 rounded-2xl bg-background/40 border-border/40 shadow-sm font-semibold">
              <SelectValue placeholder="Semua Grup" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Lintas Semua Latihan</SelectItem>
              {groups?.map((group: { id: string; name: string }) => (
                <SelectItem key={group.id} value={group.id} className="font-medium text-sm">
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Modern Data Visualization (Table) */}
      <div className="glass-card rounded-[2rem] overflow-hidden border-border/30">
        <Table>
          <TableHeader className="bg-secondary/5 border-b border-border/50">
            <TableRow className="hover:bg-transparent h-16 border-b border-border/50">
              <TableHead className="w-[80px] text-center text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">ID</TableHead>
              <TableHead className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Identitas Atlet</TableHead>
              <TableHead className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Asal Institusi</TableHead>
              <TableHead className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Lahir</TableHead>
              <TableHead className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Klasifikasi</TableHead>
              <TableHead className="text-right pr-8 text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Manajemen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout" initial={false}>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64">
                    <div className="flex flex-col items-center justify-center gap-4 text-primary">
                      <Loader2 className="size-10 animate-spin opacity-50" />
                      <span className="text-sm font-bold tracking-widest uppercase animate-pulse">Menghubungkan ke MySQL...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                   <TableCell colSpan={6} className="h-64 text-center">
                    <span className="text-destructive font-bold uppercase">DATABASE CONNECTION FAILED</span>
                  </TableCell>
                </TableRow>
              ) : filteredPlayers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground grayscale opacity-50 italic">
                      <Search className="size-12 mb-2" />
                      <span className="text-base font-semibold uppercase tracking-widest">Data Tidak Ditemukan</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlayers.map((player: Player, idx: number) => (
                  <motion.tr
                    key={player.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="group border-b border-border/30 hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-300"
                  >
                    <TableCell className="text-center text-xs font-bold text-muted-foreground/60">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-lg text-secondary group-hover:text-primary transition-colors">{player.name}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">UID: {player.id.split("-")[0]}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium italic text-muted-foreground/90">{player.schoolOrigin || "Private Enrollment"}</TableCell>
                    <TableCell className="text-sm font-semibold text-secondary/80">
                      {new Date(player.dateOfBirth).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center rounded-xl bg-secondary px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-secondary-foreground shadow-sm">
                        {player.group?.name || "Unassigned"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-10 rounded-xl hover:bg-primary/20 hover:text-primary border border-transparent hover:border-primary/30" 
                            title="Ubah Profile"
                            onClick={() => setEditingPlayer(player)}
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-10 rounded-xl hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/30" 
                            title="Arsip Data"
                            onClick={() => setDeletingPlayer(player)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
        
        <div className="p-6 bg-gradient-to-r from-secondary/5 to-transparent flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          <div className="flex items-center gap-4">
             <span className="text-secondary font-bold">Total Entitas: {players?.length || 0}</span>
             <span className="w-1 h-1 rounded-full bg-border" />
             <span>Terfilter: {filteredPlayers.length} unit</span>
          </div>
          <span className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" /> Live MySQL Connection
          </span>
        </div>
      </div>

      {/* Advisory Footer */}
      <footer className="mt-4 p-5 rounded-2xl bg-secondary text-secondary-foreground flex items-center gap-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute right-0 top-0 h-full w-48 bg-primary/20 skew-x-[-20deg] translate-x-24 group-hover:translate-x-12 transition-transform duration-1000" />
        <div className="relative z-10 size-12 bg-white/10 rounded-xl flex items-center justify-center ring-1 ring-white/20">
          <ShieldAlert className="size-6 text-primary" />
        </div>
        <div className="relative z-10 flex flex-col">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Integritas Data</span>
          <p className="text-sm font-medium opacity-80 leading-tight">
            Penghapusan data menggunakan sistem <span className="text-white font-bold underline decoration-primary underline-offset-4">Soft-Delete</span>. Statistik dan histori kehadiran akan tetap tersimpan secara permanen untuk pelaporan akhir tahun.
          </p>
        </div>
      </footer>
    </motion.div>
  );
}
