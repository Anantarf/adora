"use client";

import { useDeletePlayer } from "@/hooks/use-players";
import { type Player } from "@/types/dashboard";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Trash2, ShieldAlert } from "lucide-react";

interface DeletePlayerConfirmProps {
  player: Player;
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
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal menghapus.";
      toast.error("Error: " + msg);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md bg-card border-border/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-heading tracking-wide flex items-center gap-2 text-destructive">Arsip Data Pemain</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">Tindakan ini perlu konfirmasi.</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-6 flex flex-col gap-4">
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground leading-relaxed">
              Apakah Anda yakin ingin mengarsipkan data <span className="font-heading tracking-widest uppercase">{player.name}</span>?
            </p>
            <div className="flex items-center gap-3">
              <div className="size-2 rounded-full bg-destructive" />
              <span className="text-xs font-semibold text-destructive">Bukan penghapusan permanen</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-secondary/10 border border-border/50 flex gap-4 items-start">
            <ShieldAlert className="size-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-muted-foreground">Statistik performa dan riwayat absensi tetap terjaga dalam audit log.</p>
          </div>
        </div>

        <AlertDialogFooter className="sm:flex-row flex-col gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isPending} className="sm:mr-2 h-10 font-semibold text-sm border-border/50">
            Batalkan
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isPending}
            className="h-10 font-semibold text-sm"
          >
            {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : <Trash2 className="size-4 mr-2" />}
            Arsipkan Data
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
