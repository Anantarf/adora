"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { useUsersPage, useDeleteUser, useResetPassword } from "@/hooks/use-users";
import { AdminStatePanel } from "@/components/features/admin-state-panel";
import { UserAccountActionDialogs, type UserDialogState } from "@/components/features/users/UserAccountActionDialogs";
import { UserAccountCard } from "@/components/features/users/UserAccountCard";
import { UsersManagementHeader } from "@/components/features/users/UsersManagementHeader";
import { LinkedPlayersModal } from "@/components/features/users/LinkedPlayersModal";
import { AccountDetailDialog } from "@/components/features/users/AccountDetailDialog";
import { CoachProfileDialog } from "@/components/features/users/CoachProfileDialog";
import { EditUserDialog } from "@/components/features/users/EditUserDialog";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Header memakai UsersManagementHeader (sub-header kustom dengan role switcher + search) bukan AdminPageHeader generik, karena halaman ini punya kontrol filter yang lebih kaya.
export default function UsersManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeRole, setActiveRole] = useState<"PARENT" | "ADMIN" | "COACH">("PARENT");
  const [uiState, setUiState] = useState<UserDialogState>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [coachProfileUserId, setCoachProfileUserId] = useState<string | null>(null);
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

  const handleRoleChange = (role: "PARENT" | "ADMIN" | "COACH") => {
    setActiveRole(role);
    setCurrentPage(1);
  };

  const isSearchActive = normalizedSearch.length > 0;
  const isParent = activeRole === "PARENT";
  const isCoach = activeRole === "COACH";

  const activeTargetId = uiState?.targetId || null;
  const selectedUser = paginatedUsers.find((user) => user.id === selectedUserId) ?? null;
  const editingUser = paginatedUsers.find((user) => user.id === editingUserId) ?? null;
  const coachProfileUser = paginatedUsers.find((user) => user.id === coachProfileUserId) ?? null;

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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-8">
      <UsersManagementHeader searchTerm={searchTerm} onSearchTermChange={handleSearchTermChange} totalAccounts={totalAccounts} role={activeRole} onRoleChange={handleRoleChange} />

      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="flex min-h-[300px] w-full flex-col gap-2 rounded-xl border border-border/50 bg-card p-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-[58px] w-full rounded-xl bg-muted/20" />
            ))}
          </div>
        ) : isError ? (
          <AdminStatePanel
            icon={Users}
            title="Gagal memuat data akun."
            tone="danger"
            action={
              <Button variant="outline" size="sm" onClick={() => refetch()} className="border-destructive/40 text-destructive hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive">
                Muat Ulang
              </Button>
            }
          />
        ) : totalAccounts === 0 ? (
          <AdminStatePanel
            icon={Users}
            title={isSearchActive ? "Akun tidak ditemukan" : `Belum ada akun ${isParent ? "orang tua" : isCoach ? "coach" : "admin"}`}
            description={isSearchActive ? "Ubah kata kunci pencarian atau kosongkan filter." : `Tambahkan akun ${isParent ? "orang tua" : isCoach ? "coach" : "admin"} baru menggunakan tombol di bagian atas.`}
          />
        ) : (
          paginatedUsers.map((user) => (
            <UserAccountCard key={user.id} user={user} onViewDetail={setSelectedUserId} />
          ))
        )}
      </div>

      {!isLoading && totalPages > 1 && <Pagination currentPage={currentServerPage} totalPages={totalPages} onPageChange={setCurrentPage} />}

      <AccountDetailDialog
        user={selectedUser}
        open={!!selectedUser}
        onOpenChange={(open) => {
          if (!open) setSelectedUserId(null);
        }}
        onEdit={(id) => {
          setSelectedUserId(null);
          setEditingUserId(id);
        }}
        onReset={(id) => {
          setSelectedUserId(null);
          setUiState({ type: "reset", targetId: id });
        }}
        onDelete={(id) => {
          setSelectedUserId(null);
          setUiState({ type: "delete", targetId: id });
        }}
        onManagePlayers={(id) => {
          setLinkedPlayersParentId(id);
        }}
        onManageCoachProfile={(id) => {
          setSelectedUserId(null);
          setCoachProfileUserId(id);
        }}
      />
      <EditUserDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => {
          if (!open) setEditingUserId(null);
        }}
      />
      <CoachProfileDialog
        user={coachProfileUser}
        open={!!coachProfileUser}
        onOpenChange={(open) => {
          if (!open) setCoachProfileUserId(null);
        }}
      />
      <UserAccountActionDialogs uiState={uiState} onOpenChange={handleDialogOpenChange} onConfirmDelete={handleDeleteConfirm} onConfirmReset={handleResetConfirm} isDeleting={isDeleting} isResetting={isResetting} />
      <LinkedPlayersModal
        parentId={linkedPlayersParentId}
        parentName={(linkedPlayersParentId ? paginatedUsers.find((u) => u.id === linkedPlayersParentId)?.name || paginatedUsers.find((u) => u.id === linkedPlayersParentId)?.username : undefined) ?? undefined}
        onOpenChange={(open) => {
          if (!open) setLinkedPlayersParentId(null);
        }}
      />
    </div>
  );
}
