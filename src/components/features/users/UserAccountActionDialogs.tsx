"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export type UserDialogState = { type: "delete"; targetId: string } | { type: "reset"; targetId: string } | null;

type UserAccountActionDialogsProps = {
  uiState: UserDialogState;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => Promise<void>;
  onConfirmReset: () => Promise<void>;
  isDeleting?: boolean;
  isResetting?: boolean;
};

export function UserAccountActionDialogs({
  uiState,
  onOpenChange,
  onConfirmDelete,
  onConfirmReset,
  isDeleting = false,
  isResetting = false,
}: UserAccountActionDialogsProps) {
  const isPending = isDeleting || isResetting;

  return (
    <>
      <AlertDialog open={uiState?.type === "delete"} onOpenChange={(val) => !isPending && onOpenChange(val)}>
        <AlertDialogContent className="bg-card border-border/50 rounded-card-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-destructive">Hapus Akun Pengguna?</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/80 font-medium text-xs mt-2 leading-relaxed">
              Akses akun ini akan dihapus <span className="text-destructive font-bold">permanen</span> dan tidak dapat dipulihkan.
            </AlertDialogDescription>
            <div className="mt-4 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
              <p className="text-amber-500/90 text-xs font-medium leading-relaxed">
                <strong className="font-bold">Catatan:</strong> Akun hanya dapat dihapus jika tidak ada pemain yang terhubung. Pastikan pemain sudah dipindahkan terlebih dahulu.
              </p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel
              disabled={isPending}
              className="h-11 rounded-xl border-border/50 px-8 text-sm font-semibold hover:bg-secondary/10"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onConfirmDelete();
              }}
              disabled={isPending}
              className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-destructive px-8 text-sm font-semibold text-white shadow-sm hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
              Hapus Akun
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={uiState?.type === "reset"} onOpenChange={(val) => !isPending && onOpenChange(val)}>
        <AlertDialogContent className="bg-card border-border/50 rounded-card-lg">
          <AlertDialogHeader>
            <div className="size-16 rounded-full bg-muted border-2 border-border/50 flex items-center justify-center mb-4">
              <KeyRound className="size-7 text-muted-foreground" />
            </div>
            <AlertDialogTitle className="text-lg font-semibold text-foreground">Atur Ulang Kata Sandi Akun?</AlertDialogTitle>
            <AlertDialogDescription className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground">
              <span>Kata sandi akun ini akan dikembalikan seperti saat pertama kali dibuat.</span>
              <span className="flex items-center gap-1.5 pt-1">
                Kata sandi awal: <strong className="font-mono text-primary tracking-normal bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">adora123</strong>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 border-t border-border/10 pt-4">
            <AlertDialogCancel
              disabled={isPending}
              className="h-11 rounded-xl border-border/50 px-8 text-sm font-semibold hover:bg-secondary/10"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onConfirmReset();
              }}
              disabled={isPending}
              className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              {isResetting ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
              Atur Ulang Kata Sandi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
