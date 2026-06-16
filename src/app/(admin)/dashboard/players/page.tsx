"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Edit2,
  Trash2,
  Users,
  LayoutGrid,
  Table as TableIcon,
  ChevronLeft,
  MessageCircle,
  HeartCrack,
  Eye,
} from "lucide-react";

import { AddGroupDialog } from "@/components/features/AddGroupDialog";
import { AddPlayerDialog } from "@/components/features/AddPlayerDialog";
import { AdminPageHeader } from "@/components/features/admin-page-header";
import { AdminStatePanel } from "@/components/features/admin-state-panel";
import { DeleteGroupConfirm } from "@/components/features/DeleteGroupConfirm";
import { DeletePlayerConfirm } from "@/components/features/DeletePlayerConfirm";
import { EditGroupDialog } from "@/components/features/EditGroupDialog";
import { ViewPlayerDialog } from "@/components/features/ViewPlayerDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroups, type Group } from "@/hooks/use-groups";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePlayersPage } from "@/hooks/use-players";
import { getGroupCategoryLabel, getGroupDisplayDescription } from "@/lib/group-meta";
import { buildPlayerFullName, calculateAgeFromDate } from "@/lib/player-profile";
import { type PlayerSummary } from "@/types/dashboard";

type UIState =
  | { type: "add-group" }
  | { type: "edit-group"; payload: Group }
  | { type: "delete-group"; payload: Group }
  | { type: "view-player"; payload: PlayerSummary }
  | { type: "edit-player"; payload: PlayerSummary }
  | { type: "delete-player"; payload: Pick<PlayerSummary, "id" | "name"> }
  | null;

const ITEMS_PER_PAGE = 10;

export default function PlayersPage() {
  const [selectedCategory, setSelectedCategory] = useState<"SEKOLAH" | "KELOMPOK_UMUR">("SEKOLAH");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [playerSearchQuery, setPlayerSearchQuery] = useState("");
  const [debouncedPlayerSearch] = useDebounce(playerSearchQuery, 300);
  const [viewMode, setViewMode] = useState<"database" | "grid">("database");
  const isMobile = useIsMobile();
  useEffect(() => {
    if (isMobile) setViewMode("grid"); // eslint-disable-line react-hooks/set-state-in-effect
  }, [isMobile]);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const [uiState, setUiState] = useState<UIState>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: groups, isLoading: isGroupsLoading } = useGroups();


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

  const selectedGroup = useMemo(
    () => groups?.find((group: Group) => group.id === effectiveGroupId),
    [groups, effectiveGroupId],
  );
  const paginatedPlayers = playersPage?.items ?? [];
  const currentServerPage = playersPage?.page ?? currentPage;
  const totalPages = playersPage?.totalPages ?? 1;
  const filteredPlayerCount = playersPage?.total ?? 0;
  const activeCategoryLabel =
    selectedCategory === "SEKOLAH" ? "Kelompok sekolah" : "Kelompok umur";

  React.useEffect(() => {
    setCurrentPage(1);
  }, [effectiveGroupId, debouncedPlayerSearch]);



  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-20">
      <AddGroupDialog
        externalOpen={uiState?.type === "add-group"}
        onExternalOpenChange={(open) => setUiState(open ? { type: "add-group" } : null)}
        hideTrigger
      />
      {uiState?.type === "edit-group" && (
        <EditGroupDialog
          group={uiState.payload}
          open={true}
          onOpenChange={(open) => !open && setUiState(null)}
        />
      )}
      {uiState?.type === "delete-group" && (
        <DeleteGroupConfirm
          group={uiState.payload}
          open={true}
          onOpenChange={(open) => !open && setUiState(null)}
        />
      )}
      {uiState?.type === "view-player" && (
        <ViewPlayerDialog
          key={uiState.payload.id}
          playerId={uiState.payload.id}
          open={true}
          onOpenChange={(open) => !open && setUiState(null)}
          onDelete={() =>
            setUiState({
              type: "delete-player",
              payload: { id: uiState.payload.id, name: uiState.payload.name },
            })
          }
        />
      )}
      {uiState?.type === "delete-player" && (
        <DeletePlayerConfirm
          player={uiState.payload}
          open={true}
          onOpenChange={(open) => !open && setUiState(null)}
        />
      )}

      <AdminPageHeader
        eyebrow="Manajemen Pemain"
        title="Pemain & Kelompok"
        description="Pilih kelompok di kiri, lalu kelola pemain dan pencariannya di panel kanan."
        actions={
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-md border border-border/50 bg-background/60 px-3 py-1.5 font-medium">
              {activeCategoryLabel}
            </span>
            <span className="rounded-md border border-border/50 bg-background/60 px-3 py-1.5 font-medium">
              {groupsInCategory.length} kelompok aktif
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div
          className={`flex flex-col gap-4 lg:col-span-4 ${isMobileDetailOpen ? "hidden lg:flex" : "flex"}`}
        >
          <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  Daftar Kelompok
                </h3>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Pilih kelompok di kiri, lalu kelola pemainnya di panel kanan.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUiState({ type: "add-group" })}
                className="h-9 rounded-lg px-3 text-xs font-medium text-primary hover:bg-primary/10"
              >
                + Kelompok
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama kelompok..."
                value={groupSearchQuery}
                onChange={(event) => setGroupSearchQuery(event.target.value)}
                className="h-9 rounded-lg border-border/50 bg-background/50 pl-9 text-xs"
              />
            </div>

            <div className="flex gap-1.5 rounded-lg bg-muted/40 p-1" role="tablist">
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
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-medium transition-all ${
                      active
                        ? "border border-border/30 bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{category === "SEKOLAH" ? "Sekolah" : "Kelompok Umur"}</span>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                        active
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex max-h-[460px] flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
              {isGroupsLoading ? (
                <div className="space-y-2 rounded-xl border border-border/40 bg-background/20 p-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-[68px] w-full rounded-xl bg-muted/20" />
                  ))}
                </div>
              ) : groupsInCategory.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/50 py-10 text-center text-xs text-muted-foreground/60">
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
                        setIsMobileDetailOpen(true);
                        setPlayerSearchQuery("");
                      }}
                      className={`flex w-full cursor-pointer flex-col gap-1.5 rounded-xl border p-3 text-left transition-all ${
                        isActive
                          ? "border-primary bg-primary/5 shadow-xs"
                          : "border-border/40 bg-background/20 hover:border-primary/30 hover:bg-background/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="max-w-[70%] truncate text-sm font-semibold text-foreground">
                          {group.name}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                            isSchool
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-violet-500/10 text-violet-500"
                          }`}
                        >
                          {group._count?.player ?? 0} pemain
                        </span>
                      </div>
                      <p className="truncate text-[10px] leading-relaxed text-muted-foreground">
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

        <div
          className={`flex flex-col gap-4 lg:col-span-8 ${isMobileDetailOpen ? "flex" : "hidden lg:flex"}`}
        >
          <AnimatePresence mode="wait">
            {!effectiveGroupId ? (
              <AdminStatePanel
                icon={Users}
                title="Pilih kelompok terlebih dahulu"
                description="Silakan pilih kelompok di panel kiri untuk melihat dan mengelola daftar pemain."
                className="min-h-[460px] bg-card"
              />
            ) : isPlayersLoading && !selectedGroup ? (
              <div className="flex min-h-[500px] flex-col gap-4 rounded-xl border border-border/50 bg-card p-6">
                <Skeleton className="h-14 w-full rounded-xl bg-muted/30" />
                <Skeleton className="h-10 w-full rounded-xl bg-muted/20" />
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full rounded-lg bg-muted/10" />
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
                className="flex min-h-[520px] flex-col gap-5 rounded-xl border border-border/50 bg-card p-4 shadow-xs sm:p-6"
              >
                {selectedGroup && (
                  <div className="flex flex-col gap-4 border-b border-border/50 pb-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsMobileDetailOpen(false)}
                            className="size-8 shrink-0 rounded-lg lg:hidden"
                          >
                            <ChevronLeft className="size-4" />
                          </Button>
                          <h2 className="max-w-[240px] truncate text-lg font-semibold text-foreground sm:max-w-none sm:text-xl">
                            {selectedGroup.name}
                          </h2>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                              selectedGroup.category === "SEKOLAH"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-violet-500/10 text-violet-500"
                            }`}
                          >
                            {getGroupCategoryLabel(selectedGroup.category)}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {getGroupDisplayDescription({
                            category: selectedGroup.category,
                            targetKu: selectedGroup.targetKu,
                            schoolLevel: selectedGroup.schoolLevel,
                            description: selectedGroup.description,
                          }) || "Kelompok latihan"}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="rounded-md bg-primary/8 px-2.5 py-1 font-medium text-primary">
                            {filteredPlayerCount} pemain
                          </span>
                          {playerSearchQuery ? (
                            <span className="rounded-md border border-border/50 px-2.5 py-1 font-medium">
                              Hasil pencarian
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
                        <AddPlayerDialog
                          defaultGroupId={effectiveGroupId ?? undefined}
                          defaultGroupName={selectedGroup.name}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 flex-1 rounded-lg px-3 text-xs font-semibold transition-all hover:border-primary/50 hover:text-primary sm:flex-none"
                            onClick={() =>
                              setUiState({
                                type: "edit-group",
                                payload: selectedGroup as Group,
                              })
                            }
                          >
                            <Edit2 className="mr-1.5 size-3" /> Ubah
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 flex-1 rounded-lg border-destructive/30 px-3 text-xs font-semibold text-destructive transition-all hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive sm:flex-none"
                            onClick={() =>
                              setUiState({
                                type: "delete-group",
                                payload: selectedGroup as Group,
                              })
                            }
                          >
                            <Trash2 className="mr-1.5 size-3" /> Hapus
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-semibold text-muted-foreground">
                        {filteredPlayerCount === 0
                          ? "Belum ada pemain yang tampil."
                          : `${filteredPlayerCount} pemain tampil di daftar.`}
                      </p>
                      {totalPages > 1 ? (
                        <p className="text-[11px] font-medium text-muted-foreground">
                          Halaman {currentServerPage} dari {totalPages}
                        </p>
                      ) : null}
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder={
                          selectedGroup?.name
                            ? `Cari pemain di ${selectedGroup.name}...`
                            : "Cari pemain..."
                        }
                        value={playerSearchQuery}
                        onChange={(event) => setPlayerSearchQuery(event.target.value)}
                        className="h-9 rounded-lg border-border/50 bg-background/50 pl-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="hidden items-center gap-1.5 self-end rounded-lg bg-muted/40 p-1 sm:flex sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setViewMode("database")}
                      className={`rounded-md p-1.5 transition-all ${
                        viewMode === "database"
                          ? "border border-border/30 bg-card text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Tampilan Database (Tabel)"
                    >
                      <TableIcon className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`rounded-md p-1.5 transition-all ${
                        viewMode === "grid"
                          ? "border border-border/30 bg-card text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Tampilan Visual (Grid)"
                    >
                      <LayoutGrid className="size-3.5" />
                    </button>
                  </div>
                </div>

                {isPlayersLoading ? (
                  <div className="grid min-h-[250px] w-full gap-3 rounded-xl border border-border/50 bg-card p-4 md:grid-cols-2">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <Skeleton key={index} className="h-20 w-full rounded-xl bg-muted/20" />
                    ))}
                  </div>
                ) : filteredPlayerCount === 0 ? (
                  <AdminStatePanel
                    icon={Users}
                    title={playerSearchQuery ? "Pemain tidak ditemukan" : "Kelompok masih kosong"}
                    description={playerSearchQuery ? "Coba kata kunci lain atau periksa ejaan nama pemain." : "Lengkapi data pemain baru dengan mengklik tombol Tambah Pemain di atas."}
                    className="min-h-[300px]"
                  />
                ) : viewMode === "database" ? (
                  <div className="-mx-1 overflow-x-auto rounded-xl border border-border/50 bg-background/20 shadow-xs custom-scrollbar">
                    <table className="min-w-[64rem] w-full text-left text-xs">
                      <thead className="border-b border-border/50 bg-muted/40 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                        <tr>
                          <th scope="col" className="w-10 px-4 py-3 text-center">
                            No
                          </th>
                          <th scope="col" className="px-4 py-3">
                            Nama Lengkap
                          </th>
                          <th scope="col" className="px-4 py-3">
                            Gender/Umur
                          </th>
                          <th scope="col" className="px-4 py-3">
                            No. WhatsApp
                          </th>
                          <th scope="col" className="px-4 py-3 text-center">
                            Medis
                          </th>
                          <th scope="col" className="px-4 py-3 text-center">
                            Dokumen
                          </th>
                          <th scope="col" className="w-24 px-4 py-3 text-right">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {paginatedPlayers.map((player: PlayerSummary, index: number) => {
                          const age = player.dateOfBirth
                            ? calculateAgeFromDate(new Date(player.dateOfBirth))
                            : null;
                          const hasPhoto = !!player.photoUrl;
                          const hasSignature = !!player.signatureUrl;
                          const globalIndex =
                            (currentServerPage - 1) * ITEMS_PER_PAGE + index + 1;

                          return (
                            <tr
                              key={player.id}
                              className="group transition-colors hover:bg-primary/[0.02]"
                            >
                              <td className="px-4 py-2.5 text-center font-mono font-medium tabular-nums text-muted-foreground/60">
                                {globalIndex}
                              </td>
                              <td className="px-4 py-2.5 font-bold text-foreground">
                                <div className="flex max-w-[240px] items-center gap-2.5 wrap-break-word">
                                  {player.photoUrl ? (
                                    <div className="size-10 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-background/40">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={player.photoUrl}
                                        alt={buildPlayerFullName(player.firstName, player.lastName) || player.name}
                                        className="size-full object-cover object-top"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary">
                                      {player.name.charAt(0)}
                                    </div>
                                  )}
                                  <span
                                    className="cursor-pointer truncate transition-colors group-hover:text-primary"
                                    onClick={() =>
                                      setUiState({ type: "view-player", payload: player })
                                    }
                                  >
                                    {buildPlayerFullName(player.firstName, player.lastName) ||
                                      player.name}
                                  </span>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                                <span className="font-bold text-foreground">
                                  {player.gender === "Laki-laki"
                                    ? "L"
                                    : player.gender === "Perempuan"
                                      ? "P"
                                      : "-"}
                                </span>
                                {" - "}
                                {age !== null ? `${age} thn` : "-"}
                              </td>
                              <td className="whitespace-nowrap px-4 py-2.5">
                                {player.phoneNumber ? (
                                  <a
                                    href={`https://wa.me/${player.phoneNumber.replace(/[^0-9]/g, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 font-mono text-emerald-500 transition-colors hover:text-emerald-400"
                                  >
                                    <MessageCircle className="size-3 shrink-0" />
                                    {player.phoneNumber}
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground/30">-</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                {player.hasMedicalCondition ? (
                                  <div
                                    className="inline-flex cursor-help items-center justify-center text-rose-500"
                                    title={
                                      player.medicalConditionDetail ||
                                      "Ada riwayat penyakit bawaan"
                                    }
                                  >
                                    <HeartCrack className="size-4 animate-pulse-subtle" />
                                  </div>
                                ) : (
                                  <span className="rounded-sm bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-500">
                                    Aman
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <div className="inline-flex items-center justify-center gap-1 text-[9px] font-medium">
                                  <span
                                    className={`rounded-xs px-1 ${
                                      hasPhoto
                                        ? "bg-emerald-500/15 text-emerald-500"
                                        : "bg-muted text-muted-foreground/30"
                                    }`}
                                  >
                                    FOTO
                                  </span>
                                  <span
                                    className={`rounded-xs px-1 ${
                                      hasSignature
                                        ? "bg-emerald-500/15 text-emerald-500"
                                        : "bg-muted text-muted-foreground/30"
                                    }`}
                                  >
                                    TTD
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() =>
                                      setUiState({ type: "view-player", payload: player })
                                    }
                                    className="inline-flex size-8 items-center justify-center rounded-md border border-border/50 text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                                    title="Lihat Detail"
                                    aria-label="Lihat detail pemain"
                                  >
                                    <Eye className="size-3.5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setUiState({
                                        type: "delete-player",
                                        payload: { id: player.id, name: player.name },
                                      })
                                    }
                                    className="inline-flex size-8 items-center justify-center rounded-md border border-destructive/20 text-destructive/80 transition-all hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                                    title="Arsipkan Pemain"
                                    aria-label="Arsipkan pemain"
                                  >
                                    <Trash2 className="size-3.5" />
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
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedPlayers.map((player: PlayerSummary) => (
                      <div
                        key={player.id}
                        className="group flex cursor-pointer flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-2xs transition-all hover:border-primary/35 hover:bg-muted/30"
                        onClick={() => setUiState({ type: "view-player", payload: player })}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {player.photoUrl ? (
                            <div className="size-12 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-background/40">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={player.photoUrl}
                                alt={buildPlayerFullName(player.firstName, player.lastName) || player.name}
                                className="size-full object-cover object-top"
                              />
                            </div>
                          ) : (
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                              {player.name.charAt(0)}
                            </div>
                          )}
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <h4 className="truncate text-sm font-semibold text-foreground">
                              {buildPlayerFullName(player.firstName, player.lastName) ||
                                player.name}
                            </h4>
                            <span className="truncate text-[10px] font-medium text-muted-foreground">
                              {player.group?.name || "Tanpa Kelompok"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className="rounded-md border border-border/50 bg-background/50 px-2 py-0.5 font-medium text-foreground">
                            {(() => {
                              const age = player.dateOfBirth ? calculateAgeFromDate(new Date(player.dateOfBirth)) : null;
                              const gender = player.gender === "Laki-laki" ? "L" : player.gender === "Perempuan" ? "P" : "-";
                              return `${gender} - ${age ?? "-"} thn`;
                            })()}
                          </span>
                          {player.hasMedicalCondition ? (
                            <span className="rounded-md bg-rose-500/10 px-2 py-0.5 font-medium text-rose-500">
                              Medis
                            </span>
                          ) : (
                            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-500">
                              Sehat
                            </span>
                          )}
                          {player.phoneNumber ? (
                            <span className="truncate font-mono text-emerald-500/80">
                              {player.phoneNumber}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

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
