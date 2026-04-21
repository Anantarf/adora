"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Edit2, Trash2, Users, FolderPlus } from "lucide-react";
import { usePlayers } from "@/hooks/use-players";
import { type Player } from "@/types/dashboard";
import { useGroups, type Group } from "@/hooks/use-groups";
import { useState, useMemo, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { AddPlayerDialog } from "@/components/features/AddPlayerDialog";
import { DeletePlayerConfirm } from "@/components/features/DeletePlayerConfirm";
import { AddGroupDialog } from "@/components/features/AddGroupDialog";
import { EditGroupDialog } from "@/components/features/EditGroupDialog";
import { DeleteGroupConfirm } from "@/components/features/DeleteGroupConfirm";
import { ViewPlayerDialog } from "@/components/features/ViewPlayerDialog";
import { getGroupDisplayDescription } from "@/lib/group-meta";
import { motion, AnimatePresence } from "framer-motion";

type UIState =
  | { type: "add-group" }
  | { type: "edit-group"; payload: Group }
  | { type: "delete-group"; payload: Group }
  | { type: "view-player"; payload: Player }
  | { type: "edit-player"; payload: Player }
  | { type: "delete-player"; payload: Player }
  | null;

export default function PlayersPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const [uiState, setUiState] = useState<UIState>(null);

  const { data: players, isLoading: isPlayersLoading } = usePlayers(selectedGroupId ?? "", debouncedSearch, !!selectedGroupId);
  const { data: groups, isLoading: isGroupsLoading } = useGroups();

  useEffect(() => {
    if (groups && groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  const selectedGroup = useMemo(() => groups?.find((g: Group) => g.id === selectedGroupId), [groups, selectedGroupId]);
  const filteredPlayers = players || [];

  const totalPlayers = useMemo(() => groups?.reduce((sum: number, g: Group) => sum + (g._count?.player || 0), 0) ?? 0, [groups]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-20">
      {/* Modals */}
      <AddGroupDialog externalOpen={uiState?.type === "add-group"} onExternalOpenChange={(open) => setUiState(open ? { type: "add-group" } : null)} hideTrigger />
      {uiState?.type === "edit-group" && <EditGroupDialog group={uiState.payload} open={true} onOpenChange={(open) => !open && setUiState(null)} />}
      {uiState?.type === "delete-group" && <DeleteGroupConfirm group={uiState.payload} open={true} onOpenChange={(open) => !open && setUiState(null)} />}
      {uiState?.type === "view-player" && <ViewPlayerDialog player={uiState.payload} open={true} onOpenChange={(open) => !open && setUiState(null)} onDelete={() => setUiState({ type: "delete-player", payload: uiState.payload })} />}
      {uiState?.type === "delete-player" && <DeletePlayerConfirm player={uiState.payload} open={true} onOpenChange={(open) => !open && setUiState(null)} />}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="font-heading text-4xl text-foreground tracking-widest uppercase">Kelompok Latihan</h1>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">Manajemen data pemain dan kelompok klub</p>
        </div>
      </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {([
            { icon: FolderPlus, label: "Kelompok", value: groups?.length ?? 0 },
            { icon: Users,      label: "Pemain",   value: totalPlayers },
          ] as const).map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-card border border-border/50 rounded-lg p-4 flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{label}</p>
                {isGroupsLoading
                  ? <div className="h-6 w-8 bg-muted rounded animate-pulse mt-1" />
                  : <p className="text-2xl font-heading tracking-widest">{value}</p>}
              </div>
            </div>
          ))}
        </div>

      {/* Control Bar */}
      <div className="bg-card border border-border/50 rounded-lg p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder={selectedGroup?.name ? `Cari pemain di ${selectedGroup.name}...` : "Cari pemain..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-10 w-full bg-background/50" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="xl" onClick={() => setUiState({ type: "add-group" })} className="hidden sm:flex">
            <FolderPlus className="size-4" /> Kelompok Baru
          </Button>
          <AddPlayerDialog />
        </div>
      </div>

      {/* Tabs */}
      {isGroupsLoading ? (
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-24 rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : (groups?.length ?? 0) === 0 ? (
        <div className="bg-card rounded-lg p-12 text-center flex flex-col items-center gap-6 border border-dashed border-border/50">
          <FolderPlus className="size-12 text-muted-foreground/20" />
          <div className="space-y-1">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Belum ada kelompok</p>
            <p className="text-xs text-muted-foreground/60">Mulai dengan menambahkan kelompok latihan baru.</p>
          </div>
          <Button variant="outline" size="xl" onClick={() => setUiState({ type: "add-group" })}>
            <FolderPlus className="size-4 mr-2" /> Tambah Kelompok
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {groups?.map((group: Group) => {
            const isActive = selectedGroupId === group.id;
            return (
              <button
                key={group.id}
                onClick={() => {
                  setSelectedGroupId(group.id);
                  setSearchQuery("");
                }}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {group.name}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-black/20" : "bg-background/50"}`}>{group._count?.player ?? 0}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {!selectedGroupId ? null : isPlayersLoading ? (
          <div key="loading" className="flex justify-center p-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <motion.div key={selectedGroupId} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
            {selectedGroup && (
              <div className="flex items-center justify-between gap-4 flex-wrap bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex flex-col">
                  <h2 className="font-heading text-xl uppercase tracking-widest text-foreground">{selectedGroup?.name}</h2>
                  <p className="text-xs text-muted-foreground">{getGroupDisplayDescription(selectedGroup?.description ?? null) || "Grup Latihan"}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 px-3 font-semibold text-xs" onClick={() => setUiState({ type: "edit-group", payload: selectedGroup as Group })}>
                    <Edit2 className="size-3 mr-1.5" /> Ubah
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 font-semibold text-xs border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setUiState({ type: "delete-group", payload: selectedGroup as Group })}
                  >
                    <Trash2 className="size-3 mr-1.5" /> Hapus
                  </Button>
                </div>
              </div>
            )}

            {filteredPlayers.length === 0 ? (
              <div className="bg-card border border-dashed border-border/50 rounded-lg p-10 text-center flex flex-col items-center gap-3">
                <Users className="size-8 text-muted-foreground/30" />
                <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground">{searchQuery ? "Pemain tidak ditemukan" : "Kelompok masih kosong"}</p>
              <p className="text-xs text-muted-foreground mt-1">{searchQuery ? "Coba kata kunci lain." : "Tambah pemain baru menggunakan tombol di atas."}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPlayers.map((player: Player) => (
                  <div key={player.id} className="bg-card border border-border/50 p-4 rounded-lg flex items-center hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setUiState({ type: "view-player", payload: player })}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center font-heading text-lg text-primary shrink-0">{player.name.charAt(0).toUpperCase()}</div>
                      <div className="flex flex-col min-w-0 gap-0.5">
                        <h4 className="font-heading tracking-widest uppercase text-sm text-foreground truncate">{player.name}</h4>
                        <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground truncate">{player.schoolOrigin || "—"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
