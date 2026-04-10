"use client";

import { useDeletePlayer } from "@/hooks/use-players";
import { type Player } from "@/types/dashboard";
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
      <AlertDialogContent className="sm:max-w-[425px] bg-card border-border/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-heading uppercase tracking-widest flex items-center gap-2 text-destructive">
             Arsip Data Atlet
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs font-medium tracking-wide uppercase opacity-70">
            Aksi ini membutuhkan konfirmasi tingkat tinggi.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-6 flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20 flex flex-col gap-2">
                <p className="text-sm font-semibold text-foreground">
                    Apakah Anda yakin ingin mengarsipkan data <span className="font-black underline scale-110 px-1">{player.name}</span>?
                </p>
                <div className="flex items-center gap-3 mt-2">
                     <div className="size-1.5 rounded-full bg-destructive animate-pulse" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-destructive">Bukan penghapusan permanen</span>
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/10 border border-border/50 flex gap-4 items-center">
                <ShieldAlert className="size-6 text-muted-foreground opacity-50 shrink-0" />
                <p className="text-[11px] font-medium leading-tight text-muted-foreground">
                    Statistik performa dan riwayat absensi atlet ini tetap terjaga dalam arsip auditLog.
                </p>
            </div>
        </div>

        <AlertDialogFooter className="sm:flex-row flex-col gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isPending} className="sm:mr-2 h-11 font-bold uppercase tracking-widest text-[10px] border-border/50">
            Batalkan
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
                e.preventDefault();
                handleDelete();
            }}
            disabled={isPending}
            className="h-11 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold tracking-widest uppercase text-xs shadow-lg shadow-destructive/20"
          >
            {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : <Trash2 className="size-4 mr-2" />}
            Izin Arsipkan Data
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
