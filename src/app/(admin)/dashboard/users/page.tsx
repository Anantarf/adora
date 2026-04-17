"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { 
  Users,
  Search,
  Loader2,
  KeyRound,
  Trash2,
  UserCircle2,
  Baby,
  Mail,
  AtSign,
  UserCheck2
} from "lucide-react";
import { useUsers, useDeleteUser, useResetPassword } from "@/hooks/use-users";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddUserDialog } from "@/components/features/AddUserDialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

/**
 * ADORA Basketball - Global User Management Center
 * A premium administrative view for managing parent accounts and security.
 */

export default function UsersManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  type UIState = { type: 'delete'; targetId: string } | { type: 'reset'; targetId: string } | null;
  const [uiState, setUiState] = useState<UIState>(null);

  const { data: users, isLoading } = useUsers("PARENT");
  const { mutateAsync: deleteUser } = useDeleteUser();
  const { mutateAsync: resetPassword } = useResetPassword();

  // Optimized Searching with useMemo
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20"
    >
      {/* HEADER SECTION */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-1">
        <div className="space-y-1">
          <h1 className="text-5xl md:text-6xl font-heading uppercase tracking-widest text-foreground">Akses Akun</h1>
          <p className="text-muted-foreground font-medium max-w-lg border-l-2 border-primary/40 pl-4 py-1 tracking-wide">
            Manajemen hak akses dan akun orang tua. Buat akun baru, reset kata sandi, dan kelola integritas login.
          </p>
        </div>
        <AddUserDialog />
      </section>

      {/* SEARCH AND METRICS */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari Nama, Username, atau Email..."
            className="pl-11 h-12 bg-card/60 border-border/50 rounded-[1.2rem] shadow-sm font-medium focus:ring-primary/20"
          />
        </div>
        <div className="px-6 h-12 flex items-center gap-3 bg-secondary text-secondary-foreground rounded-[1.2rem] font-bold text-[10px] uppercase tracking-widest min-w-[200px] justify-center shadow-lg transition-transform hover:scale-[1.02]">
           <UserCheck2 className="size-4 text-primary" /> Total Account: {filteredUsers.length}
        </div>
      </div>

      {/* USER GRID */}
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
          filteredUsers.map((user) => (
            <motion.div
              layout
              key={user.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group glass-card p-6 rounded-[2.5rem] border-white/20 transition-all hover:bg-white/60 dark:hover:bg-white/5 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-secondary/5 border-2 border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                    <UserCircle2 className="size-7 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-secondary leading-tight truncate max-w-[140px]">{user.name}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <AtSign className="size-3" /> {user.username}
                    </div>
                  </div>
                </div>
                <div className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[8px] font-black uppercase tracking-widest">
                  {user.role}
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                   <Mail className="size-3.5 text-primary/40" />
                   <span className="truncate">{user.email || "— No Email —"}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                   <Baby className="size-3.5 text-primary/40" />
                   <span>Terhubung dengan <strong className="text-secondary">{user._count.player} Data Pemain</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-border/40">
                <Button 
                  onClick={() => setUiState(user.id ? { type: 'reset', targetId: user.id } : null)}
                  variant="ghost" 
                  size="sm" 
                  className="flex-1 h-9 rounded-xl text-[10px] uppercase font-black tracking-widest gap-2 hover:bg-secondary/10 hover:text-secondary group-hover:border-border/50 transition-all border border-transparent"
                >
                  <KeyRound className="size-3.5" /> Reset Pass
                </Button>
                <Button 
                  onClick={() => setUiState(user.id ? { type: 'delete', targetId: user.id } : null)}
                  variant="ghost" 
                  size="sm" 
                  className="flex-shrink-0 size-9 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ACTION DIALOGS */}
      <AlertDialog open={!!(uiState?.type === 'delete' ? uiState.targetId : null)} onOpenChange={(val) => !val && setUiState(null)}>
        <AlertDialogContent className="bg-card border-border/50 rounded-[2.5rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading uppercase text-foreground">Hapus Akun Parent?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
               Semua hak akses login untuk user ini akan dicabut permanen. Akun hanya bisa dihapus jika <strong>tidak memiliki data pemain</strong> aktif di dalamnya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold rounded-xl border-border/50">Batal Saja</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                if ((uiState?.type === 'delete' ? uiState.targetId : null)) {
                   await deleteUser(uiState?.type === 'delete' && uiState.targetId ? uiState.targetId : '');
                   setUiState(null);
                }
              }}
              className="bg-destructive text-white hover:bg-destructive/90 font-bold rounded-xl shadow-lg shadow-destructive/20"
            >
              Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!(uiState?.type === 'reset' ? uiState.targetId : null)} onOpenChange={(val) => !val && setUiState(null)}>
        <AlertDialogContent className="bg-card border-border/50 rounded-[2.5rem]">
          <AlertDialogHeader>
            <div className="size-16 rounded-full bg-secondary/5 border-2 border-primary/20 flex items-center justify-center mb-4">
               <KeyRound className="size-7 text-primary" />
            </div>
            <AlertDialogTitle className="font-heading uppercase text-foreground">Reset Password Akun?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
               Password akan di-reset ke default: <strong className="text-secondary font-mono bg-muted px-2 py-0.5 rounded border border-border/20">adora123</strong>. Berikan password ini kepada orang tua bersangkutan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold rounded-xl border-border/50">Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                if ((uiState?.type === 'reset' ? uiState.targetId : null)) {
                   await resetPassword({ id: uiState?.type === 'reset' && uiState.targetId ? uiState.targetId : '' });
                   setUiState(null);
                }
              }}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold rounded-xl px-8"
            >
              Reset Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </motion.div>
  );
}
