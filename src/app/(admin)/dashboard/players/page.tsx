"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Edit2, Trash2, ArrowLeft, Users, FolderPlus } from "lucide-react";
import { usePlayers } from "@/hooks/use-players";
import { type Player } from "@/types/dashboard";
import { useGroups, type Group } from "@/hooks/use-groups";
import { useState, useMemo } from "react";
import { AddPlayerDialog } from "@/components/features/AddPlayerDialog";
import { EditPlayerDialog } from "@/components/features/EditPlayerDialog";
import { DeletePlayerConfirm } from "@/components/features/DeletePlayerConfirm";
import { AddGroupDialog } from "@/components/features/AddGroupDialog";
import { motion, AnimatePresence } from "framer-motion";

export default function PlayersPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);

  const { data: players, isLoading: isPlayersLoading } = usePlayers(selectedGroupId || "all");
  const { data: groups, isLoading: isGroupsLoading } = useGroups();

  const selectedGroup = useMemo(() => 
    groups?.find((g: Group) => g.id === selectedGroupId), 
    [groups, selectedGroupId]
  );

  // Filter Groups (Home View)
  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    return groups.filter((g: Group) => 
      g.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [groups, searchQuery]);

  // Filter Players (Detail View)
  const filteredPlayers = useMemo(() => {
    if (!players) return [];
    return players.filter((p: Player) => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.schoolOrigin?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [players, searchQuery]);

  const isLoading = isPlayersLoading || isGroupsLoading;

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

      {/* Header Section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <h1 
              className={`font-heading uppercase tracking-widest transition-all cursor-pointer ${
                !selectedGroupId ? "text-5xl md:text-6xl text-foreground" : "text-xl text-muted-foreground hover:text-primary"
              }`}
              onClick={() => { setSelectedGroupId(null); setSearchQuery(""); }}
            >
              Manajemen Roster
            </h1>
            {selectedGroupId && (
              <>
                <span className="text-muted-foreground/30 text-2xl">/</span>
                <h2 className="text-5xl md:text-6xl font-heading uppercase tracking-widest text-primary animate-in slide-in-from-left-4 duration-500">
                  {selectedGroup?.name || "KU Detail"}
                </h2>
              </>
            )}
          </div>
          <p className="text-muted-foreground font-medium max-w-lg border-l-2 border-primary/40 pl-4 py-1 tracking-wide">
            {!selectedGroupId 
               ? "Pilih Kelompok (KU) untuk mengelola atlet secara spesifik, atau gunakan pencarian global."
               : `Daftar atlet aktif pada ${selectedGroup?.name}. Kelola profil individual dan pantau klasifikasi.`
            }
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <AddGroupDialog />
          <AddPlayerDialog />
        </div>
      </section>

      {/* Persistent Control Bar */}
      <div className="glass-card p-6 rounded-3xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
          <Input 
            placeholder={!selectedGroupId ? "Cari Kelompok (KU)..." : "Cari nama atlet di grup ini..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 rounded-2xl border-border/40 bg-background/40 focus-visible:ring-primary/20 focus-visible:border-primary/50 text-base shadow-inner"
          />
        </div>
        
        {selectedGroupId && (
          <Button 
            variant="ghost" 
            onClick={() => { setSelectedGroupId(null); setSearchQuery(""); }}
            className="h-14 px-6 rounded-2xl bg-secondary/5 border border-border/40 hover:bg-secondary/10 gap-2 font-bold uppercase tracking-widest text-[10px]"
          >
            <ArrowLeft className="size-4" /> Kembali ke Daftar KU
          </Button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-20 gap-4"
            >
              <Loader2 className="size-12 animate-spin text-primary opacity-50" />
              <p className="text-xs font-bold tracking-[0.3em] uppercase animate-pulse">Menghubungkan Data ADORA...</p>
            </motion.div>
          ) : !selectedGroupId ? (
            /* VIEW: GROUPS GRID */
            <motion.div 
              key="groups-grid"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredGroups.map((group: Group) => (
                <div 
                  key={group.id}
                  onClick={() => { setSelectedGroupId(group.id); setSearchQuery(""); }}
                  className="group relative bg-[#111113] border border-primary/20 rounded-[2.5rem] p-10 cursor-pointer overflow-hidden transition-all duration-500 hover:border-primary/60 hover:bg-primary/[0.03] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[5rem] transition-all group-hover:bg-primary/10 group-hover:scale-110 duration-700" />
                  
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <Users className="size-7" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-white/40 group-hover:text-primary group-hover:border-primary/30 transition-colors">
                        KELOMPOK UMUR
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="font-heading text-4xl text-white tracking-widest uppercase mb-2 group-hover:translate-x-2 transition-transform duration-500">
                        {group.name}
                      </h3>
                      <p className="text-muted-foreground text-sm font-medium leading-relaxed italic opacity-70 group-hover:opacity-100 line-clamp-2">
                        {group.description || "Pembinaan fundamental dan teknik dasar basket berkelanjutan."}
                      </p>
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Kapasitas Penuh</span>
                        <span className="font-heading text-2xl text-primary">{group._count?.player || 0} Atlet</span>
                      </div>
                      <div className="size-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all duration-500">
                        <ArrowLeft className="size-4 rotate-180" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Optional Add Quickie */}
              <div className="border-2 border-dashed border-border/30 rounded-[2.5rem] p-10 flex flex-col items-center justify-center gap-4 text-muted-foreground/40 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all duration-500 cursor-pointer group">
                  <FolderPlus className="size-12 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-widest">Tambah Kelompok Baru</span>
              </div>
            </motion.div>
          ) : (
            /* VIEW: PLAYER TILES (DRILL DOWN) */
            <motion.div 
              key="players-list"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4"
            >
              {filteredPlayers.length === 0 ? (
                <div className="bg-muted/10 border border-dashed border-border/50 rounded-[2rem] p-20 text-center flex flex-col items-center gap-4">
                  <Search className="size-12 text-muted-foreground/30" />
                  <p className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Tidak ada atlet di kelompok ini</p>
                  <Button onClick={() => setSelectedGroupId(null)} variant="link" className="text-primary text-xs">Kembali ke Daftar KU</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPlayers.map((player: Player) => (
                    <div 
                      key={player.id}
                      className="group glass-card p-6 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all duration-300"
                    >
                      <div className="flex items-center gap-5">
                         <div className="size-14 rounded-xl bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center font-heading text-xl text-black shadow-lg">
                           {player.name.charAt(0)}
                         </div>
                         <div className="flex flex-col">
                            <h4 className="font-bold text-lg text-white group-hover:text-primary transition-colors">{player.name}</h4>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground/60">UID: {player.id.split("-")[0]}</span>
                              <span className="size-1 rounded-full bg-border" />
                              <span className="text-[10px] font-medium text-white/40 italic">{player.schoolOrigin || "Private Enrollment"}</span>
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button size="icon" variant="ghost" className="size-10 rounded-xl hover:bg-primary/20 hover:text-primary" onClick={() => setEditingPlayer(player)}>
                            <Edit2 className="size-4" />
                         </Button>
                         <Button size="icon" variant="ghost" className="size-10 rounded-xl hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeletingPlayer(player)}>
                            <Trash2 className="size-4" />
                         </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="mt-10 pt-10 border-t border-border/30 text-center flex flex-col items-center gap-2">
         <p className="text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/50">Sistem Performa ADORA Basketball © {new Date().getFullYear()}</p>
         <div className="flex items-center gap-4 text-xs font-bold text-primary/50">
           <span>{groups?.length || 0} Kelompok Terdaftar</span>
         </div>
      </footer>
    </motion.div>
  );
}
