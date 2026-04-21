"use client";

import { KeyRound } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export type UserDialogState = { type: "delete"; targetId: string } | { type: "reset"; targetId: string } | null;

type UserAccountActionDialogsProps = {
  uiState: UserDialogState;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => Promise<void>;
  onConfirmReset: () => Promise<void>;
};

export function UserAccountActionDialogs({ uiState, onOpenChange, onConfirmDelete, onConfirmReset }: UserAccountActionDialogsProps) {
  return (
    <>
      <AlertDialog open={uiState?.type === "delete"} onOpenChange={onOpenChange}>
        <AlertDialogContent className="bg-card border-border/50 rounded-card-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-heading uppercase">Hapus Akun Pengguna?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium tracking-wide opacity-70 flex flex-col gap-2 mt-2">
              <span className="text-destructive font-bold">Akses akun ini akan dihapus permanen dan tidak dapat dipulihkan.</span>
              <span className="italic">Peringatan: Akun hanya bisa dihapus jika tidak terhubung dengan pemain.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="h-11 px-8 rounded-xl border-border/50 uppercase text-[10px] font-bold tracking-widest hover:bg-secondary/10">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} className="h-11 px-8 bg-destructive text-white hover:bg-destructive/90 uppercase text-[10px] font-bold tracking-widest rounded-xl shadow-sm">
              Hapus Akun
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={uiState?.type === "reset"} onOpenChange={onOpenChange}>
        <AlertDialogContent className="bg-card border-border/50 rounded-card-lg">
          <AlertDialogHeader>
            <div className="size-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mb-4">
              <KeyRound className="size-7 text-primary" />
            </div>
            <AlertDialogTitle className="text-xl font-heading uppercase">Atur Ulang Kata Sandi Akun?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium tracking-wide opacity-70 flex flex-col gap-2 mt-2">
              <span>Sandi akun ini akan dikembalikan seperti saat pertama kali dibuat.</span>
              <span className="flex items-center gap-1.5 pt-1">
                Sandi awal: <strong className="font-mono text-primary tracking-normal bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">adora123</strong>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 border-t border-border/10 pt-4">
            <AlertDialogCancel className="h-11 px-8 rounded-xl border-border/50 uppercase text-[10px] font-bold tracking-widest hover:bg-secondary/10">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmReset} className="h-11 px-8 bg-primary text-primary-foreground hover:bg-primary/90 uppercase text-[10px] font-bold tracking-widest rounded-xl shadow-sm">
              Reset Sandi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
