"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Loader2 } from "lucide-react";
import { useUsersPage, useDeleteUser, useResetPassword } from "@/hooks/use-users";
import { UserAccountActionDialogs, type UserDialogState } from "@/components/features/users/UserAccountActionDialogs";
import { UserAccountCard } from "@/components/features/users/UserAccountCard";
import { UsersManagementHeader } from "@/components/features/users/UsersManagementHeader";
import { LinkedPlayersModal } from "@/components/features/users/LinkedPlayersModal";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeRole, setActiveRole] = useState<"PARENT" | "ADMIN">("PARENT");
  const [uiState, setUiState] = useState<UserDialogState>(null);
  const [linkedPlayersParentId, setLinkedPlayersParentId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const normalizedSearch = searchTerm.trim();
  const { data: usersPage, isLoading, isError, refetch } = useUsersPage(activeRole, normalizedSearch, currentPage, ITEMS_PER_PAGE);

  const { mutateAsync: deleteUser, isPending: isDeleting } = useDeleteUser();
  const { mutateAsync: resetPassword, isPending: isResetting } = useResetPassword();

  const paginatedUsers = usersPage?.items ?? [];
  const currentServerPage = usersPage?.page ?? currentPage;
  const totalPages = usersPage?.totalPages ?? 1;
  const totalAccounts = usersPage?.total ?? 0;

  const handleSearchTermChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleRoleChange = (role: "PARENT" | "ADMIN") => {
    setActiveRole(role);
    setCurrentPage(1);
  };

  const isSearchActive = normalizedSearch.length > 0;
  const isParent = activeRole === "PARENT";

  const activeTargetId = uiState?.targetId || null;

  const handleDeleteConfirm = async () => {
    if (!activeTargetId) return;
    try {
      await deleteUser(activeTargetId);
      setUiState(null);
    } catch {
      // Error is caught by mutation toast, just reset uiState in case
    }
  };

  const handleResetConfirm = async () => {
    if (!activeTargetId) return;
    try {
      await resetPassword({ id: activeTargetId });
      setUiState(null);
    } catch {
      // Error is caught by mutation toast, just reset uiState in case
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) setUiState(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
      <UsersManagementHeader searchTerm={searchTerm} onSearchTermChange={handleSearchTermChange} totalAccounts={totalAccounts} role={activeRole} onRoleChange={handleRoleChange} />

      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-border/50 bg-card gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Skeleton className="size-8 rounded-full shrink-0 bg-muted/50" />
                  <div className="flex items-center gap-2 min-w-0 flex-wrap flex-1">
                    <Skeleton className="h-4 w-32 bg-muted/50" />
                    <Skeleton className="h-4 w-16 bg-muted/40" />
                    <Skeleton className="h-5 w-20 rounded bg-muted/40" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Skeleton className="h-7 w-20 rounded-lg bg-muted/40" />
                  <Skeleton className="h-7 w-7 rounded-lg bg-muted/40" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="col-span-full h-64 flex flex-col gap-3 items-center justify-center rounded-xl border border-dashed border-destructive/40 bg-destructive/5 text-center">
            <Users className="size-10 text-destructive/50" />
            <p className="text-sm font-semibold text-destructive">Gagal memuat data akun.</p>
            <button type="button" onClick={() => refetch()} className="text-[10px] px-4 py-2 rounded-lg font-bold uppercase tracking-widest border border-destructive/40 text-destructive hover:bg-destructive/10">
              Muat Ulang
            </button>
          </div>
        ) : totalAccounts === 0 ? (
          <div className="col-span-full h-64 flex flex-col gap-3 items-center justify-center rounded-xl border border-dashed border-border/50">
            <Users className="size-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">{isSearchActive ? "Akun tidak ditemukan" : `Belum ada akun ${isParent ? "orang tua" : "admin"}`}</p>
            <p className="text-xs text-muted-foreground/75 text-center">{isSearchActive ? "Ubah kata kunci pencarian atau kosongkan filter." : `Tambahkan akun ${isParent ? "orang tua" : "admin"} baru menggunakan tombol di bagian atas.`}</p>
          </div>
        ) : (
          paginatedUsers.map((user) => (
            <UserAccountCard key={user.id} user={user} onReset={(id) => setUiState({ type: "reset", targetId: id })} onDelete={(id) => setUiState({ type: "delete", targetId: id })} onViewPlayers={(id) => setLinkedPlayersParentId(id)} />
          ))
        )}
      </div>

      {!isLoading && totalPages > 1 && <Pagination currentPage={currentServerPage} totalPages={totalPages} onPageChange={setCurrentPage} />}

      <UserAccountActionDialogs uiState={uiState} onOpenChange={handleDialogOpenChange} onConfirmDelete={handleDeleteConfirm} onConfirmReset={handleResetConfirm} isDeleting={isDeleting} isResetting={isResetting} />
      <LinkedPlayersModal
        parentId={linkedPlayersParentId}
        parentName={(linkedPlayersParentId ? paginatedUsers.find((u) => u.id === linkedPlayersParentId)?.name || paginatedUsers.find((u) => u.id === linkedPlayersParentId)?.username : undefined) ?? undefined}
        onOpenChange={(open) => {
          if (!open) setLinkedPlayersParentId(null);
        }}
      />
    </motion.div>
  );
}
