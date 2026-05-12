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
  const [selectedUserForPlayers, setSelectedUserForPlayers] = useState<{ id: string; name: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const { data: users, isLoading } = useUsers(activeRole);

  // Correct approach to reset pagination on data/filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeRole, searchTerm, users?.length]);

  const { mutateAsync: deleteUser } = useDeleteUser();
  const { mutateAsync: resetPassword } = useResetPassword();

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!normalizedSearch) return users;

    return users.filter((user) => 
      user.name?.toLowerCase().includes(normalizedSearch) || 
      (user.username || "").toLowerCase().includes(normalizedSearch) || 
      user.email?.toLowerCase().includes(normalizedSearch)
    );
  }, [users, normalizedSearch]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const handleSearchTermChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleRoleChange = (role: "PARENT" | "ADMIN") => {
    setActiveRole(role);
  };

  const hasUsers = (users?.length ?? 0) > 0;
  const isSearchActive = normalizedSearch.length > 0;
  const isParent = activeRole === "PARENT";

  const handleDeleteConfirm = async () => {
    if (!uiState?.targetId) return;
    await deleteUser(uiState.targetId);
    setUiState(null);
  };

  const handleResetConfirm = async () => {
    if (!uiState?.targetId) return;
    await resetPassword({ id: uiState.targetId });
    setUiState(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10"
    >
      <UsersManagementHeader 
        searchTerm={searchTerm} 
        onSearchTermChange={handleSearchTermChange} 
        totalAccounts={filteredUsers.length} 
        role={activeRole} 
        onRoleChange={handleRoleChange} 
      />

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="h-64 flex flex-col gap-4 items-center justify-center rounded-3xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-xl">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm font-bold tracking-widest text-muted-foreground animate-pulse uppercase">Memuat Data Akun...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="h-64 flex flex-col gap-3 items-center justify-center rounded-3xl border border-dashed border-border/50 bg-muted/5">
            <Users className="size-12 text-muted-foreground/20" />
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              {hasUsers && isSearchActive ? "Akun tidak ditemukan" : `Belum ada akun ${isParent ? "orang tua" : "admin"}`}
            </p>
            <p className="text-xs text-muted-foreground/60 max-w-xs text-center leading-relaxed">
              {hasUsers && isSearchActive 
                ? "Cobalah mencari dengan kata kunci lain atau periksa filter peran yang aktif." 
                : `Tambahkan akun ${isParent ? "orang tua" : "admin"} baru untuk mengelola akses sistem.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {paginatedUsers.map((user) => (
              <UserAccountCard 
                key={user.id} 
                user={user} 
                onReset={(id) => setUiState({ type: "reset", targetId: id })} 
                onDelete={(id) => setUiState({ type: "delete", targetId: id })} 
                onViewPlayers={(id) => setSelectedUserForPlayers({ id, name: user.name || user.username || "Orang Tua" })} 
              />
            ))}
          </div>
        )}
      </div>

      {!isLoading && totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      {/* Action Dialogs (Reset/Delete) */}
      <UserAccountActionDialogs 
        uiState={uiState} 
        onOpenChange={(open) => !open && setUiState(null)} 
        onConfirmDelete={handleDeleteConfirm} 
        onConfirmReset={handleResetConfirm} 
      />

      {/* Linked Players View */}
      <LinkedPlayersModal
        parentId={selectedUserForPlayers?.id || null}
        parentName={selectedUserForPlayers?.name}
        onOpenChange={(open) => !open && setSelectedUserForPlayers(null)}
      />
    </motion.div>
  );
}
