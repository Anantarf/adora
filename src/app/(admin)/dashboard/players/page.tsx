"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Search,
  Edit2,
  Trash2,
  Users,
  FolderPlus,
  LayoutGrid,
  Table as TableIcon,
  ChevronLeft,
  MessageCircle,
  HeartCrack,
  Eye,
} from "lucide-react";
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
import { buildPlayerFullName, calculateAgeFromDate } from "@/lib/player-profile";

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
  
  // Searching states
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [playerSearchQuery, setPlayerSearchQuery] = useState("");
  const [debouncedPlayerSearch] = useDebounce(playerSearchQuery, 300);
  
  // UI layouts & modals
  const [viewMode, setViewMode] = useState<"database" | "grid">("database");
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const [uiState, setUiState] = useState<UIState>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const { data: groups, isLoading: isGroupsLoading } = useGroups();

  const availableCategories = useMemo(() => Array.from(new Set((groups ?? []).map((group) => group.category))), [groups]);

  // Instantly filter groups based on active category & left side group search query
  const groupsInCategory = useMemo(() => {
    return (groups ?? []).filter((group) => {
      const matchCategory = group.category === selectedCategory;
      const searchNeedle = groupSearchQuery.trim().toLowerCase();
      const groupDetails = [
        group.name,
        group.description,
        getGroupCategoryLabel(group.category),
        getGroupDisplayDescription({
          category: group.category,
          targetKu: group.targetKu,
          schoolLevel: group.schoolLevel,
          description: group.description,
        }),
        group.schoolLevel,
        group.targetKu ? `ku ${group.targetKu}` : "",
        group.targetKu ? `${group.targetKu}` : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchSearch = !searchNeedle || groupDetails.includes(searchNeedle);
      return matchCategory && matchSearch;
    });
  }, [groups, selectedCategory, groupSearchQuery]);

  // Dynamic fallback calculation for the selected group
  const effectiveGroupId = useMemo(() => {
    if (groupsInCategory.some((group) => group.id === selectedGroupId)) {
      return selectedGroupId;
    }
    return groupsInCategory[0]?.id ?? null;
  }, [groupsInCategory, selectedGroupId]);

  const { data: playersPage, isLoading: isPlayersLoading } = usePlayersPage(
    effectiveGroupId ?? "",
    debouncedPlayerSearch,
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
  }, [effectiveGroupId, debouncedPlayerSearch]);

  React.useEffect(() => {
    if (!availableCategories.includes(selectedCategory) && availableCategories.length > 0) {
      setSelectedCategory(availableCategories[0] as "SEKOLAH" | "KELOMPOK_UMUR");
    }
  }, [availableCategories, selectedCategory]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-20">
      {/* Modals */}
      <AddGroupDialog
        externalOpen={uiState?.type === "add-group"}
        onExternalOpenChange={(open) => setUiState(open ? { type: "add-group" } : null)}
        hideTrigger
      />
      {uiState?.type === "edit-group" && (
        <EditGroupDialog group={uiState.payload} open={true} onOpenChange={(open) => !open && setUiState(null)} />
      )}
      {uiState?.type === "delete-group" && (
        <DeleteGroupConfirm group={uiState.payload} open={true} onOpenChange={(open) => !open && setUiState(null)} />
      )}
      {uiState?.type === "view-player" && (
        <ViewPlayerDialog
          key={uiState.payload.id}
          playerId={uiState.payload.id}
          open={true}
          onOpenChange={(open) => !open && setUiState(null)}
          onDelete={() => setUiState({ type: "delete-player", payload: { id: uiState.payload.id, name: uiState.payload.name } })}
        />
      )}
      {uiState?.type === "delete-player" && (
        <DeletePlayerConfirm player={uiState.payload} open={true} onOpenChange={(open) => !open && setUiState(null)} />
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-foreground tracking-widest uppercase">Kelompok Latihan</h1>
          <p className="text-muted-foreground text-xs font-medium tracking-wide">
            Kelola data pembagian kelas latihan dan database pemain Adora BBC.
          </p>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 gap-4">
        {(
          [
            { icon: FolderPlus, label: "Total Kelompok", value: groups?.length ?? 0 },
            { icon: Users, label: "Total Pemain Aktif", value: totalPlayers },
          ] as const
        ).map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-xl p-4 flex items-center gap-3 shadow-xs">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
              {isGroupsLoading ? (
                <div className="h-6 w-8 bg-muted rounded animate-pulse mt-1" />
              ) : (
                <p className="text-xl font-heading tracking-widest text-foreground mt-0.5">{value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* RESPONSIVE LAYOUT CONTAINER */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* PANEL KIRI (MASTER: LIST KELOMPOK - 4 COLS) */}
        <div className={`md:col-span-4 flex flex-col gap-4 ${isMobileDetailOpen ? "hidden md:flex" : "flex"}`}>
          <div className="bg-card border border-border/50 rounded-xl p-4 flex flex-col gap-4 shadow-xs">
            
            {/* Header Master */}
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="text-xs font-black tracking-widest text-foreground uppercase">Daftar Kelompok</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUiState({ type: "add-group" })}
                className="h-8 px-2 text-[10px] font-bold uppercase text-primary hover:bg-primary/10 tracking-wider"
              >
                + Kelompok
              </Button>
            </div>

            {/* Pencarian Kelompok */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari nama kelompok..."
                value={groupSearchQuery}
                onChange={(e) => setGroupSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-lg bg-background/50 border-border/50"
              />
            </div>

            {/* Filter Kategori Kelompok */}
            <div className="flex gap-1.5 p-1 bg-muted/40 rounded-lg" role="tablist">
              {(["SEKOLAH", "KELOMPOK_UMUR"] as const).map((category) => {
                const active = selectedCategory === category;
                const count = groups?.filter((group) => group.category === category).length ?? 0;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedGroupId(null);
                      setGroupSearchQuery("");
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                      active
                        ? "bg-card text-foreground shadow-xs border border-border/30"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{category === "SEKOLAH" ? "Sekolah" : "Kelompok Umur"}</span>
                    <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-black ${active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Group List */}
            <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
              {isGroupsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 w-full rounded-lg bg-muted/30 animate-pulse border border-transparent" />
                ))
              ) : groupsInCategory.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground/60 border border-dashed border-border/50 rounded-lg">
                  {groupSearchQuery ? "Kelompok tidak ditemukan" : "Tidak ada kelompok latihan"}
                </div>
              ) : (
                groupsInCategory.map((group) => {
                  const isActive = effectiveGroupId === group.id;
                  const isSchool = group.category === "SEKOLAH";

                  return (
                    <button
                      key={group.id}
                      onClick={() => {
                        setSelectedGroupId(group.id);
                        setIsMobileDetailOpen(true); // Slide in on mobile
                        setPlayerSearchQuery("");
                      }}
                      className={`w-full text-left rounded-xl border p-3.5 transition-all flex flex-col gap-1.5 cursor-pointer hover:scale-[1.01] ${
                        isActive
                          ? "border-primary bg-primary/5 shadow-xs"
                          : "border-border/40 bg-background/20 hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-heading text-xs tracking-wider uppercase text-foreground truncate max-w-[70%]">
                          {group.name}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black tracking-wider ${
                          isSchool ? "bg-amber-500/10 text-amber-500" : "bg-violet-500/10 text-violet-500"
                        }`}>
                          {group._count?.player ?? 0} PEMAIN
                        </span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-muted-foreground truncate">
                        {getGroupDisplayDescription({
                          category: group.category,
                          targetKu: group.targetKu,
                          schoolLevel: group.schoolLevel,
                          description: group.description,
                        }) || getGroupCategoryLabel(group.category)}
                      </p>
                    </button>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* PANEL KANAN (DETAIL: DAFTAR PEMAIN - 8 COLS) */}
        <div className={`md:col-span-8 flex flex-col gap-4 ${isMobileDetailOpen ? "flex" : "hidden md:flex"}`}>
          <AnimatePresence mode="wait">
            {!effectiveGroupId ? (
              <div className="bg-card border border-border/50 rounded-xl p-8 min-h-[460px] flex flex-col items-center justify-center text-center gap-3">
                <Users className="size-8 text-muted-foreground/30 animate-bounce" />
                <p className="text-xs font-semibold text-muted-foreground">Silakan pilih kelompok terlebih dahulu di panel kiri.</p>
              </div>
            ) : isPlayersLoading && !selectedGroup ? (
              <div className="bg-card border border-border/50 rounded-xl p-6 min-h-[500px] flex flex-col gap-4">
                <Skeleton className="h-14 w-full bg-muted/30 rounded-xl" />
                <Skeleton className="h-10 w-full bg-muted/20 rounded-xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full bg-muted/10 rounded-lg" />
                  ))}
                </div>
              </div>
            ) : (
              <motion.div
                key={effectiveGroupId}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="bg-card border border-border/50 rounded-xl p-4 sm:p-6 flex flex-col gap-5 min-h-[520px] shadow-xs"
              >
                
                {/* 1. Header Detail Kelompok */}
                {selectedGroup && (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border/50">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        {/* Mobile Back Button */}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setIsMobileDetailOpen(false)}
                          className="md:hidden size-8 shrink-0 rounded-lg"
                        >
                          <ChevronLeft className="size-4" />
                        </Button>
                        <h2 className="font-heading text-lg sm:text-xl uppercase tracking-widest text-foreground truncate max-w-[240px] sm:max-w-none">
                          {selectedGroup.name}
                        </h2>
                        <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${
                          selectedGroup.category === "SEKOLAH" ? "bg-amber-500/10 text-amber-500" : "bg-violet-500/10 text-violet-500"
                        }`}>
                          {getGroupCategoryLabel(selectedGroup.category)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate leading-relaxed mt-0.5">
                        {getGroupDisplayDescription({
                          category: selectedGroup.category,
                          targetKu: selectedGroup.targetKu,
                          schoolLevel: selectedGroup.schoolLevel,
                          description: selectedGroup.description,
                        }) || "Kelompok Latihan"}
                      </p>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto shrink-0">
                      {/* Contextual Add Player Dialog */}
                      <AddPlayerDialog
                        defaultGroupId={effectiveGroupId ?? undefined}
                        defaultGroupName={selectedGroup?.name}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-3 font-semibold text-xs rounded-lg hover:border-primary/50 hover:text-primary transition-all flex-1 sm:flex-none"
                        onClick={() => setUiState({ type: "edit-group", payload: selectedGroup as Group })}
                      >
                        <Edit2 className="size-3 mr-1.5" /> Ubah
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-3 font-semibold text-xs rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/60 transition-all flex-1 sm:flex-none"
                        onClick={() => setUiState({ type: "delete-group", payload: selectedGroup as Group })}
                      >
                        <Trash2 className="size-3 mr-1.5" /> Hapus
                      </Button>
                    </div>
                  </div>
                )}

                {/* 2. Control Bar (Pencarian Pemain + Toggles) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      placeholder={selectedGroup?.name ? `Cari pemain di ${selectedGroup.name}...` : "Cari pemain..."}
                      value={playerSearchQuery}
                      onChange={(e) => setPlayerSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-xs rounded-lg bg-background/50 border-border/50"
                    />
                  </div>

                  {/* Layout View Toggles */}
                  <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-lg self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setViewMode("database")}
                      className={`p-1.5 rounded-md transition-all ${
                        viewMode === "database"
                          ? "bg-card text-foreground shadow-xs border border-border/30"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Tampilan Database (Tabel)"
                    >
                      <TableIcon className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-md transition-all ${
                        viewMode === "grid"
                          ? "bg-card text-foreground shadow-xs border border-border/30"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Tampilan Visual (Grid)"
                    >
                      <LayoutGrid className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* 3. Render Players Content */}
                {isPlayersLoading ? (
                  <div className="flex flex-col gap-3 py-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full bg-muted/20 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : filteredPlayerCount === 0 ? (
                  <div className="bg-background/20 border border-dashed border-border/50 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3 min-h-[300px]">
                    <Users className="size-8 text-muted-foreground/20 shrink-0" />
                    <p className="text-xs font-semibold text-muted-foreground">
                      {playerSearchQuery ? "Pemain tidak ditemukan" : "Kelompok masih kosong"}
                    </p>
                    <p className="text-[11px] text-muted-foreground max-w-sm mt-0.5 leading-relaxed">
                      {playerSearchQuery
                        ? "Coba kata kunci lain atau periksa ejaan nama pemain."
                        : "Lengkapi data pemain baru dengan mengklik tombol Tambah Pemain di atas."}
                    </p>
                  </div>
                ) : viewMode === "database" ? (
                  /* ── DATABASE VIEW (DENSE DATA TABLE) ── */
                  <div className="overflow-x-auto rounded-xl border border-border/50 bg-background/20 backdrop-blur-xs shadow-xs custom-scrollbar">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[10px] text-muted-foreground uppercase bg-muted/40 font-bold tracking-widest border-b border-border/50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-center w-10">No</th>
                          <th scope="col" className="px-4 py-3 w-28">ID Pemain</th>
                          <th scope="col" className="px-4 py-3">Nama Lengkap</th>
                          <th scope="col" className="px-4 py-3">Gender/Umur</th>
                          <th scope="col" className="px-4 py-3">No. WhatsApp</th>
                          <th scope="col" className="px-4 py-3 text-center">Medis</th>
                          <th scope="col" className="px-4 py-3 text-center">Dokumen</th>
                          <th scope="col" className="px-4 py-3 text-right w-24">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {paginatedPlayers.map((player: PlayerSummary, idx: number) => {
                          const age = player.dateOfBirth ? calculateAgeFromDate(new Date(player.dateOfBirth)) : null;
                          const hasPhoto = !!player.photoUrl;
                          const hasSignature = !!player.signatureUrl;
                          const idShort = player.id.substring(0, 8).toUpperCase();
                          const globalIdx = (currentServerPage - 1) * ITEMS_PER_PAGE + idx + 1;

                          return (
                            <tr key={player.id} className="hover:bg-primary/[0.02] group transition-colors">
                              {/* INDEX */}
                              <td className="px-4 py-2.5 text-center font-mono font-medium text-muted-foreground/60 tabular-nums">
                                {globalIdx}
                              </td>

                              {/* ID PEMAIN */}
                              <td className="px-4 py-2.5 font-mono font-semibold text-muted-foreground/75 uppercase tabular-nums">
                                ADR-{idShort}
                              </td>

                              {/* NAMA PEMAIN */}
                              <td className="px-4 py-2.5 font-bold text-foreground">
                                <div className="flex items-center gap-2 max-w-[200px]">
                                  <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-heading text-[10px] font-black uppercase shrink-0">
                                    {player.name.charAt(0)}
                                  </div>
                                  <span className="truncate group-hover:text-primary transition-colors cursor-pointer" onClick={() => setUiState({ type: "view-player", payload: player })}>
                                    {buildPlayerFullName(player.firstName, player.lastName) || player.name}
                                  </span>
                                </div>
                              </td>

                              {/* GENDER / UMUR */}
                              <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                                <span className="font-bold text-foreground">
                                  {player.gender === "Laki-laki" ? "L" : player.gender === "Perempuan" ? "P" : "-"}
                                </span>
                                {" · "}{age !== null ? `${age} thn` : "-"}
                              </td>

                              {/* NO WHATSAPP */}
                              <td className="px-4 py-2.5 whitespace-nowrap">
                                {player.phoneNumber ? (
                                  <a
                                    href={`https://wa.me/${player.phoneNumber.replace(/[^0-9]/g, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-emerald-500 hover:text-emerald-400 font-mono transition-colors"
                                  >
                                    <MessageCircle className="size-3 shrink-0" />
                                    {player.phoneNumber}
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground/30">-</span>
                                )}
                              </td>

                              {/* RIWAYAT MEDIS */}
                              <td className="px-4 py-2.5 text-center">
                                {player.hasMedicalCondition ? (
                                  <div
                                    className="inline-flex items-center justify-center text-rose-500 cursor-help"
                                    title={player.medicalConditionDetail || "Ada riwayat penyakit bawaan"}
                                  >
                                    <HeartCrack className="size-4 animate-pulse-subtle" />
                                  </div>
                                ) : (
                                  <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                                    Aman
                                  </span>
                                )}
                              </td>

                              {/* KELENGKAPAN DOKUMEN */}
                              <td className="px-4 py-2.5 text-center">
                                <div className="inline-flex items-center justify-center gap-1 text-[8px] font-black tracking-wider">
                                  <span className={`px-1 rounded-xs ${hasPhoto ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground/30"}`}>
                                    FOTO
                                  </span>
                                  <span className={`px-1 rounded-xs ${hasSignature ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground/30"}`}>
                                    TTD
                                  </span>
                                </div>
                              </td>

                              {/* AKSI */}
                              <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => setUiState({ type: "view-player", payload: player })}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-border/50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                                    title="Lihat Detail"
                                  >
                                    <Eye className="size-3.5" />
                                    Lihat
                                  </button>
                                  <button
                                    onClick={() => setUiState({ type: "delete-player", payload: { id: player.id, name: player.name } })}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-destructive/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-destructive/80 transition-all hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                                    title="Arsipkan Pemain"
                                  >
                                    <Trash2 className="size-3.5" />
                                    Arsip
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* ── VISUAL VIEW (GRID CARD LAYOUT) ── */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {paginatedPlayers.map((player: PlayerSummary) => (
                      <div
                        key={player.id}
                        className="bg-card border border-border/50 p-4 rounded-xl flex items-center hover:bg-muted/30 hover:border-primary/35 transition-all cursor-pointer group shadow-2xs"
                        onClick={() => setUiState({ type: "view-player", payload: player })}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-heading text-sm font-bold uppercase shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            {player.name.charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0 gap-0.5">
                            <h4 className="font-heading tracking-wide text-xs text-foreground truncate font-bold">
                              {buildPlayerFullName(player.firstName, player.lastName) || player.name}
                            </h4>
                            <span className="text-[9px] font-bold tracking-wider uppercase text-muted-foreground truncate">
                              {player.group?.name || "Tanpa Kelompok"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. Pagination */}
                {totalPages > 1 && (
                  <div className="mt-auto pt-4">
                    <Pagination
                      currentPage={currentServerPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
