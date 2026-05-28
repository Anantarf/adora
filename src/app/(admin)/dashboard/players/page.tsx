"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Edit2, Trash2, Users, FolderPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import * as React from "react";
import { usePlayersPage } from "@/hooks/use-players";
import { type PlayerSummary } from "@/types/dashboard";
import { useGroups, type Group } from "@/hooks/use-groups";
import { useState, useMemo } from "react";
import { useDebounce } from "use-debounce";
import { AddPlayerDialog } from "@/components/features/AddPlayerDialog";
import { DeletePlayerConfirm } from "@/components/features/DeletePlayerConfirm";
import { AddGroupDialog } from "@/components/features/AddGroupDialog";
import { EditGroupDialog } from "@/components/features/EditGroupDialog";
import { DeleteGroupConfirm } from "@/components/features/DeleteGroupConfirm";
import { ViewPlayerDialog } from "@/components/features/ViewPlayerDialog";
import { getGroupCategoryLabel, getGroupDisplayDescription } from "@/lib/group-meta";
import { Pagination } from "@/components/ui/pagination";
import { motion, AnimatePresence } from "framer-motion";
import { buildPlayerFullName } from "@/lib/player-profile";

type UIState =
  | { type: "add-group" }
  | { type: "edit-group"; payload: Group }
  | { type: "delete-group"; payload: Group }
  | { type: "view-player"; payload: PlayerSummary }
  | { type: "edit-player"; payload: PlayerSummary }
  | { type: "delete-player"; payload: Pick<PlayerSummary, "id" | "name"> }
  | null;

export default function PlayersPage() {
  const [selectedCategory, setSelectedCategory] = useState<"SEKOLAH" | "KELOMPOK_UMUR">("SEKOLAH");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const [uiState, setUiState] = useState<UIState>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  const { data: groups, isLoading: isGroupsLoading } = useGroups();

  const availableCategories = useMemo(() => Array.from(new Set((groups ?? []).map((group) => group.category))), [groups]);
  const groupsInCategory = useMemo(
    () => (groups ?? []).filter((group) => group.category === selectedCategory),
    [groups, selectedCategory],
  );
  const effectiveGroupId = groupsInCategory.some((group) => group.id === selectedGroupId)
    ? selectedGroupId
    : groupsInCategory[0]?.id ?? null;
  const { data: playersPage, isLoading: isPlayersLoading } = usePlayersPage(
    effectiveGroupId ?? "",
    debouncedSearch,
    currentPage,
    ITEMS_PER_PAGE,
    !!effectiveGroupId,
  );

  const selectedGroup = useMemo(() => groups?.find((g: Group) => g.id === effectiveGroupId), [groups, effectiveGroupId]);
  const paginatedPlayers = playersPage?.items ?? [];
  const currentServerPage = playersPage?.page ?? currentPage;
  const totalPages = playersPage?.totalPages ?? 1;
  const filteredPlayerCount = playersPage?.total ?? 0;

  const totalPlayers = useMemo(() => groups?.reduce((sum: number, g: Group) => sum + (g._count?.player || 0), 0) ?? 0, [groups]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedGroupId, debouncedSearch]);

  React.useEffect(() => {
    if (!availableCategories.includes(selectedCategory) && availableCategories.length > 0) {
      setSelectedCategory(availableCategories[0] as "SEKOLAH" | "KELOMPOK_UMUR");
    }
  }, [availableCategories, selectedCategory]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-20">
      {/* Modals */}
      <AddGroupDialog externalOpen={uiState?.type === "add-group"} onExternalOpenChange={(open) => setUiState(open ? { type: "add-group" } : null)} hideTrigger />
      {uiState?.type === "edit-group" && <EditGroupDialog group={uiState.payload} open={true} onOpenChange={(open) => !open && setUiState(null)} />}
      {uiState?.type === "delete-group" && <DeleteGroupConfirm group={uiState.payload} open={true} onOpenChange={(open) => !open && setUiState(null)} />}
      {uiState?.type === "view-player" && <ViewPlayerDialog key={uiState.payload.id} playerId={uiState.payload.id} open={true} onOpenChange={(open) => !open && setUiState(null)} onDelete={() => setUiState({ type: "delete-player", payload: { id: uiState.payload.id, name: uiState.payload.name } })} />}
      {uiState?.type === "delete-player" && <DeletePlayerConfirm player={uiState.payload} open={true} onOpenChange={(open) => !open && setUiState(null)} />}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 md:gap-6 border-b border-border/50 pb-6 md:pb-8">
        <div>
          <h1 className="font-heading text-2xl md:text-4xl text-foreground tracking-widest uppercase">Kelompok Latihan</h1>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">Kelola data pemain dan kelompok latihan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(
          [
            { icon: FolderPlus, label: "Kelompok", value: groups?.length ?? 0 },
            { icon: Users, label: "Pemain", value: totalPlayers },
          ] as const
        ).map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-card border border-border/50 rounded-lg p-3 sm:p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0">
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-micro text-muted-foreground/50">{label}</p>
              {isGroupsLoading ? <div className="h-6 w-8 bg-muted rounded animate-pulse mt-1" /> : <p className="text-2xl font-heading tracking-widest">{value}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="bg-card border border-border/50 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder={selectedGroup?.name ? `Cari pemain di ${selectedGroup.name}...` : "Cari pemain..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-11 w-full bg-background/50" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="xl" onClick={() => setUiState({ type: "add-group" })} className="hidden sm:flex">
            <FolderPlus className="size-4" /> Tambah Kelompok
          </Button>
          <AddPlayerDialog defaultGroupId={effectiveGroupId ?? undefined} defaultGroupName={selectedGroup?.name} />
        </div>
      </div>

      {/* Category Tabs */}
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
            <p className="text-xs text-muted-foreground/75">Mulai dengan menambahkan kelompok latihan baru.</p>
          </div>
          <Button variant="outline" size="xl" onClick={() => setUiState({ type: "add-group" })}>
            <FolderPlus className="size-4 mr-2" /> Tambah Kelompok
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Kategori Kelompok Latihan">
            {(["SEKOLAH", "KELOMPOK_UMUR"] as const)
              .filter((category) => availableCategories.includes(category))
              .map((category) => {
                const active = selectedCategory === category;
                const count = groups?.filter((group) => group.category === category).length ?? 0;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedGroupId(null);
                      setSearchQuery("");
                    }}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                      active ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {getGroupCategoryLabel(category)}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-black/20" : "bg-background/50"}`}>{count}</span>
                  </button>
                );
              })}
          </div>

          <div className="rounded-xl border border-border/50 bg-card/70 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-micro uppercase tracking-[0.24em] text-muted-foreground">Folder {getGroupCategoryLabel(selectedCategory)}</p>
                <p className="text-xs text-muted-foreground/80">Pilih folder kelompok untuk melihat isi pemainnya.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2" role="tablist" aria-label="Kelompok Latihan">
              {groupsInCategory.map((group: Group) => {
                const isActive = effectiveGroupId === group.id;
                return (
                  <button
                    key={group.id}
                    id={`tab-${group.id}`}
                    role="tab"
                    aria-selected={isActive ? "true" : "false"}
                    aria-controls={`panel-${group.id}`}
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                      isActive ? "border-primary bg-primary/8 text-foreground" : "border-border/40 bg-background/30 text-muted-foreground hover:border-primary/35"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-heading text-sm uppercase tracking-wider">{group.name}</span>
                      <span className="rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-bold">{group._count?.player ?? 0}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {getGroupDisplayDescription({
                        category: group.category,
                        targetKu: group.targetKu,
                        schoolLevel: group.schoolLevel,
                        description: group.description,
                      }) || getGroupCategoryLabel(group.category)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {!effectiveGroupId ? null : isPlayersLoading ? (
          <div key="loading" className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-muted/20 border border-border/50 rounded-lg p-4 animate-pulse">
              <div className="flex flex-col gap-2 flex-1">
                <Skeleton className="h-6 w-48 bg-muted/60" />
                <Skeleton className="h-4 w-32 bg-muted/40" />
              </div>
              <div className="flex gap-2 w-full sm:w-auto shrink-0">
                <Skeleton className="h-9 w-20 rounded-lg bg-muted/50" />
                <Skeleton className="h-9 w-20 rounded-lg bg-muted/50" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <div key={i} className="bg-card border border-border/50 p-4 rounded-lg flex items-center gap-3">
                  <Skeleton className="size-10 rounded-lg shrink-0 bg-muted/50" />
                  <div className="flex flex-col gap-2 flex-1">
                    <Skeleton className="h-4 w-3/4 bg-muted/50" />
                    <Skeleton className="h-3 w-1/2 bg-muted/40" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <motion.div
            key={effectiveGroupId}
            id={`panel-${effectiveGroupId}`}
            role="tabpanel"
            aria-labelledby={`tab-${effectiveGroupId}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            {selectedGroup && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex flex-col">
                  <h2 className="font-heading text-lg sm:text-xl uppercase tracking-widest text-foreground">{selectedGroup?.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {getGroupCategoryLabel(selectedGroup.category)} · {getGroupDisplayDescription({
                      category: selectedGroup.category,
                      targetKu: selectedGroup.targetKu,
                      schoolLevel: selectedGroup.schoolLevel,
                      description: selectedGroup.description,
                    }) || "Kelompok Latihan"}
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button size="sm" variant="outline" className="h-9 px-3 font-semibold text-xs flex-1 sm:flex-none" onClick={() => setUiState({ type: "edit-group", payload: selectedGroup as Group })}>
                    <Edit2 className="size-3 mr-1.5" /> Ubah
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-3 font-semibold text-xs flex-1 sm:flex-none border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setUiState({ type: "delete-group", payload: selectedGroup as Group })}
                  >
                    <Trash2 className="size-3 mr-1.5" /> Hapus
                  </Button>
                </div>
              </div>
            )}

            {filteredPlayerCount === 0 ? (
              <div className="bg-card border border-dashed border-border/50 rounded-lg p-10 text-center flex flex-col items-center gap-3">
                <Users className="size-8 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">{searchQuery ? "Pemain tidak ditemukan" : "Kelompok masih kosong"}</p>
                <p className="text-xs text-muted-foreground mt-1">{searchQuery ? "Coba kata kunci lain." : "Tambah pemain baru menggunakan tombol di atas."}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {paginatedPlayers.map((player: PlayerSummary) => (
                    <div key={player.id} className="bg-card border border-border/50 p-4 rounded-lg flex items-center hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setUiState({ type: "view-player", payload: player })}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-10 rounded-lg bg-muted flex items-center justify-center font-heading text-lg text-foreground/60 shrink-0">{player.name.charAt(0).toUpperCase()}</div>
                        <div className="flex flex-col min-w-0 gap-0.5">
                          <h4 className="font-heading tracking-wide text-sm text-foreground truncate">{buildPlayerFullName(player.firstName, player.lastName) || player.name}</h4>
                          <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground truncate">{player.group?.name || "Tanpa Kelompok"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination currentPage={currentServerPage} totalPages={totalPages} onPageChange={setCurrentPage} className="mt-6" />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


