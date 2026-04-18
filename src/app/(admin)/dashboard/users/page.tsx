"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, Loader2 } from "lucide-react";
import { useUsers, useDeleteUser, useResetPassword } from "@/hooks/use-users";
import { UserAccountActionDialogs, type UserDialogState } from "@/components/features/users/UserAccountActionDialogs";
import { UserAccountCard } from "@/components/features/users/UserAccountCard";
import { UsersManagementHeader } from "@/components/features/users/UsersManagementHeader";

export default function UsersManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [uiState, setUiState] = useState<UserDialogState>(null);

  const { data: users, isLoading } = useUsers("PARENT");
  const { mutateAsync: deleteUser } = useDeleteUser();
  const { mutateAsync: resetPassword } = useResetPassword();

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!normalizedSearch) return users;

    return users.filter((user) => user.name?.toLowerCase().includes(normalizedSearch) || (user.username || "").toLowerCase().includes(normalizedSearch) || user.email?.toLowerCase().includes(normalizedSearch));
  }, [users, normalizedSearch]);

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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20">
      <UsersManagementHeader searchTerm={searchTerm} onSearchTermChange={setSearchTerm} totalAccounts={filteredUsers.length} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full h-64 flex flex-col gap-4 items-center justify-center glass-card rounded-[3rem]">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Memuat Data Akun...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="col-span-full h-64 flex flex-col gap-4 items-center justify-center glass-card border-dashed border-2 rounded-[3rem] opacity-60">
            <Users className="size-10 text-muted-foreground/40" />
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Tidak Ada Data Akun</p>
          </div>
        ) : (
          filteredUsers.map((user) => <UserAccountCard key={user.id} user={user} onReset={(id) => setUiState({ type: "reset", targetId: id })} onDelete={(id) => setUiState({ type: "delete", targetId: id })} />)
        )}
      </div>

      <UserAccountActionDialogs uiState={uiState} onOpenChange={handleDialogOpenChange} onConfirmDelete={handleDeleteConfirm} onConfirmReset={handleResetConfirm} />
    </motion.div>
  );
}
