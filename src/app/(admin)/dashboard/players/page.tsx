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
import { EditGroupDialog } from "@/components/features/EditGroupDialog";
import { DeleteGroupConfirm } from "@/components/features/DeleteGroupConfirm";
import { motion, AnimatePresence } from "framer-motion";

export default function PlayersPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);
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
      <AddGroupDialog externalOpen={addGroupOpen} onExternalOpenChange={setAddGroupOpen} />
      {editingGroup && (
        <EditGroupDialog
          group={editingGroup}
          open={!!editingGroup}
          onOpenChange={(open) => !open && setEditingGroup(null)}
        />
      )}
      {deletingGroup && (
        <DeleteGroupConfirm
          group={deletingGroup}
          open={!!deletingGroup}
          onOpenChange={(open) => !open && setDeletingGroup(null)}
        />
      )}
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
      <div className="p-4 rounded-lg border border-border/50 bg-card flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={!selectedGroupId ? "Cari Kelompok (KU)..." : "Cari nama atlet di grup ini..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>

        {selectedGroupId && (
          <Button
            variant="outline"
            onClick={() => { setSelectedGroupId(null); setSearchQuery(""); }}
            className="h-11 font-bold uppercase tracking-widest text-xs"
          >
            <ArrowLeft className="size-4 mr-2" /> Kembali ke Daftar KU
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
              <p className="text-xs font-semibold tracking-widest uppercase">Menghubungkan Data ADORA...</p>
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
                  className="group relative bg-card border border-border/50 rounded-lg p-6 cursor-pointer overflow-hidden transition-all hover:border-primary/50 hover:bg-primary/5"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-lg transition-all group-hover:bg-primary/20" />

                  {/* Action Buttons */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-9 rounded-lg hover:bg-primary/20 hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingGroup(group);
                      }}
                    >
                      <Edit2 className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-9 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingGroup(group);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="size-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <Users className="size-6" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-widest bg-muted/50 border border-border/50 px-3 py-1 rounded-full text-muted-foreground">
                        KELOMPOK UMUR
                      </span>
                    </div>

                    <div>
                      <h3 className="font-heading text-2xl text-foreground tracking-widest uppercase mb-2">
                        {group.name}
                      </h3>
                      <p className="text-muted-foreground text-xs font-medium line-clamp-2">
                        {group.description || "Pembinaan fundamental dan teknik dasar basket berkelanjutan."}
                      </p>
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-border/50">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Jumlah Atlet</span>
                        <span className="font-heading text-xl text-primary">{group._count?.player || 0}</span>
                      </div>
                      <div className="size-10 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground">
                        <ArrowLeft className="size-4 rotate-180" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add Group Quickie */}
              <div
                onClick={() => setAddGroupOpen(true)}
                className="border-2 border-dashed border-border/50 rounded-lg p-6 flex flex-col items-center justify-center gap-4 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
              >
                  <FolderPlus className="size-10 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-widest">Tambah Kelompok Baru</span>
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
                <div className="bg-muted/10 border border-dashed border-border/50 rounded-lg p-12 text-center flex flex-col items-center gap-4">
                  <Search className="size-10 text-muted-foreground/30" />
                  <p className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">Tidak ada atlet di kelompok ini</p>
                  <Button onClick={() => setSelectedGroupId(null)} variant="link" className="text-primary text-xs">Kembali ke Daftar KU</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPlayers.map((player: Player) => (
                    <div
                      key={player.id}
                      className="group p-4 rounded-lg border border-border/50 bg-card flex items-center justify-between hover:bg-muted/50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                         <div className="size-12 rounded-lg bg-primary/20 flex items-center justify-center font-heading text-base text-primary">
                           {player.name.charAt(0).toUpperCase()}
                         </div>
                         <div className="flex flex-col min-w-0">
                            <h4 className="font-semibold text-sm text-foreground truncate">{player.name}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="tracking-widest uppercase">UID: {player.id.split("-")[0]}</span>
                              <span className="text-muted-foreground/30">•</span>
                              <span className="truncate">{player.schoolOrigin || "-"}</span>
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg" onClick={() => setEditingPlayer(player)}>
                            <Edit2 className="size-4" />
                         </Button>
                         <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg" onClick={() => setDeletingPlayer(player)}>
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

      <footer className="mt-10 pt-10 border-t border-border/50 text-center flex flex-col items-center gap-2">
         <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Sistem Performa ADORA Basketball © {new Date().getFullYear()}</p>
         <div className="flex items-center gap-4 text-xs text-muted-foreground">
           <span>{groups?.length || 0} Kelompok Terdaftar</span>
         </div>
      </footer>
    </motion.div>
  );
}
