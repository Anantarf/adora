"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Loader2 } from "lucide-react";
import { useUsers, useDeleteUser, useResetPassword } from "@/hooks/use-users";
import { UserAccountActionDialogs, type UserDialogState } from "@/components/features/users/UserAccountActionDialogs";
import { UserAccountCard } from "@/components/features/users/UserAccountCard";
import { UsersManagementHeader } from "@/components/features/users/UsersManagementHeader";
import { LinkedPlayersModal } from "@/components/features/users/LinkedPlayersModal";
import { Pagination } from "@/components/ui/pagination";

export default function UsersManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeRole, setActiveRole] = useState<"PARENT" | "ADMIN">("PARENT");
  const [uiState, setUiState] = useState<UserDialogState>(null);
  const [linkedPlayersParentId, setLinkedPlayersParentId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const { data: users, isLoading } = useUsers(activeRole);

  // Reset pagination when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [users]);

  const { mutateAsync: deleteUser } = useDeleteUser();
  const { mutateAsync: resetPassword } = useResetPassword();

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!normalizedSearch) return users;

    return users.filter((user) => user.name?.toLowerCase().includes(normalizedSearch) || (user.username || "").toLowerCase().includes(normalizedSearch) || user.email?.toLowerCase().includes(normalizedSearch));
  }, [users, normalizedSearch]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const handleSearchTermChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleRoleChange = (role: "PARENT" | "ADMIN") => {
    setActiveRole(role);
    setCurrentPage(1);
  };

  const hasUsers = (users?.length ?? 0) > 0;
  const isSearchActive = normalizedSearch.length > 0;
  const isParent = activeRole === "PARENT";

  const activeTargetId = uiState?.targetId || null;

  const handleDeleteConfirm = async () => {
    if (!activeTargetId) return;
    await deleteUser(activeTargetId);
    setUiState(null);
  };

  const handleResetConfirm = async () => {
    if (!activeTargetId) return;
    await resetPassword({ id: activeTargetId });
    setUiState(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) setUiState(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
      <UsersManagementHeader 
        searchTerm={searchTerm} 
        onSearchTermChange={handleSearchTermChange} 
        totalAccounts={filteredUsers.length} 
        role={activeRole}
        onRoleChange={handleRoleChange}
      />

      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="col-span-full h-64 flex flex-col gap-3 items-center justify-center rounded-xl border border-border/50 bg-card">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Memuat Data Akun...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="col-span-full h-64 flex flex-col gap-3 items-center justify-center rounded-xl border border-dashed border-border/50">
            <Users className="size-10 text-muted-foreground/30" />
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              {hasUsers && isSearchActive ? "Akun tidak ditemukan" : `Belum ada akun ${isParent ? "orang tua" : "admin"}`}
            </p>
            <p className="text-xs text-muted-foreground/60 text-center">
              {hasUsers && isSearchActive
                ? "Ubah kata kunci pencarian atau kosongkan filter."
                : `Tambahkan akun ${isParent ? "orang tua" : "admin"} baru menggunakan tombol di bagian atas.`}
            </p>
          </div>
        ) : (
          paginatedUsers.map((user) => (
            <UserAccountCard
              key={user.id}
              user={user}
              onReset={(id) => setUiState({ type: "reset", targetId: id })}
              onDelete={(id) => setUiState({ type: "delete", targetId: id })}
              onViewPlayers={(id) => setLinkedPlayersParentId(id)}
            />
          ))
        )}
      </div>

      {!isLoading && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <UserAccountActionDialogs uiState={uiState} onOpenChange={handleDialogOpenChange} onConfirmDelete={handleDeleteConfirm} onConfirmReset={handleResetConfirm} />
      <LinkedPlayersModal
        parentId={linkedPlayersParentId}
        parentUsername={filteredUsers.find((u) => u.id === linkedPlayersParentId)?.username ?? undefined}
        onOpenChange={(open) => { if (!open) setLinkedPlayersParentId(null); }}
      />
    </motion.div>
  );
}
