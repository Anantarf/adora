"use client";

import { useDeletePlayer } from "@/hooks/use-players";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2, ShieldAlert } from "lucide-react";

interface DeletePlayerConfirmProps {
  player: {
    id: string;
    name: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeletePlayerConfirm({ player, open, onOpenChange }: DeletePlayerConfirmProps) {
  const { mutateAsync: deletePlayer, isPending } = useDeletePlayer();

  const handleDelete = async () => {
    try {
      await deletePlayer(player.id);
      toast.success(`${player.name} berhasil diarsipkan.`);
      onOpenChange(false);
    } catch {
      toast.error("Gagal mengarsipkan data pemain. Silakan coba kembali.");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md border-border/50 bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-lg font-semibold text-destructive">
            Arsip Data Pemain
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            Data pemain tidak dihapus permanen, hanya disembunyikan dari daftar aktif.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-4 py-6">
          <div className="flex flex-col gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm font-medium leading-relaxed text-foreground">
              Apakah Anda yakin ingin mengarsipkan data <span className="font-semibold">{player.name}</span>?
            </p>
            <div className="flex items-center gap-3">
              <div className="size-2 rounded-full bg-destructive" />
              <span className="text-xs font-medium text-destructive">Data tetap aman dan dapat dipulihkan</span>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-lg border border-border/50 bg-secondary/10 p-4">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">
              Statistik performa dan riwayat absensi tetap terjaga dalam audit log.
            </p>
          </div>
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
          <AlertDialogCancel disabled={isPending} className="h-10 border-border/50 text-sm font-semibold sm:mr-2">
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isPending}
            className="h-10 text-sm font-semibold"
          >
            {isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 size-4" />
            )}
            Arsipkan Data
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
