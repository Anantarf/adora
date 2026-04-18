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
        <AlertDialogContent className="bg-card border-border/50 rounded-[2.5rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading uppercase text-foreground">Hapus akun orang tua?</AlertDialogTitle>
            <AlertDialogDescription className="flex flex-col gap-2">
              <span className="text-destructive font-semibold">Akses akun ini akan dihapus permanen dan tidak dapat dipulihkan.</span>
              <span className="text-amber-600 dark:text-amber-400 text-sm">Akun hanya dapat dihapus jika tidak terhubung dengan data pemain aktif.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold rounded-xl border-border/50">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} className="bg-destructive text-white hover:bg-destructive/90 font-bold rounded-xl shadow-lg shadow-destructive/20">
              Hapus Akun
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={uiState?.type === "reset"} onOpenChange={onOpenChange}>
        <AlertDialogContent className="bg-card border-border/50 rounded-[2.5rem]">
          <AlertDialogHeader>
            <div className="size-16 rounded-full bg-secondary/5 border-2 border-primary/20 flex items-center justify-center mb-4">
              <KeyRound className="size-7 text-primary" />
            </div>
            <AlertDialogTitle className="font-heading uppercase text-foreground">Atur ulang kata sandi akun?</AlertDialogTitle>
            <AlertDialogDescription className="flex flex-col gap-2">
              <span className="text-secondary font-semibold">Kata sandi akun akan diatur ulang ke nilai bawaan.</span>
              <span className="text-muted-foreground text-sm">
                Nilai bawaan: <strong className="text-secondary font-mono bg-muted px-2 py-0.5 rounded border border-border/20">adora123</strong>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold rounded-xl border-border/50">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmReset} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold rounded-xl px-8">
              Atur Ulang Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
