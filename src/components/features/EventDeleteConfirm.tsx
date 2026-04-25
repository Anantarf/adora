"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { useDeleteEvent } from "@/hooks/use-schedule";
import { toast } from "sonner";

interface EventDeleteConfirmProps {
  targetId: string | null;
  onClose: () => void;
}

export function EventDeleteConfirm({ targetId, onClose }: EventDeleteConfirmProps) {
  const { mutateAsync: deleteEvent } = useDeleteEvent();

  const handleConfirm = async () => {
    if (!targetId) return;
    try {
      await deleteEvent(targetId);
      onClose();
      toast.success("Agenda telah dihapus.");
    } catch {
      toast.error("Gagal menghapus agenda. Silakan coba kembali.");
    }
  };

  return (
    <AlertDialog open={!!targetId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogContent className="sm:max-w-md bg-card border-border/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-heading uppercase tracking-widest flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            Hapus Agenda
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs font-medium tracking-wide uppercase opacity-70">
            Agenda yang dihapus tidak bisa dikembalikan.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-6 flex flex-col gap-4">
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground leading-relaxed">Apakah Anda yakin ingin menghapus agenda ini secara permanen?</p>
            <div className="flex items-center gap-3">
              <div className="size-2 rounded-full bg-destructive" />
              <span className="text-xs font-semibold uppercase tracking-widest text-destructive">Tidak dapat dipulihkan</span>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="sm:flex-row flex-col gap-2 sm:gap-0">
          <AlertDialogCancel className="sm:mr-2 h-11 font-bold uppercase tracking-widest text-xs border-border/50">Batal</AlertDialogCancel>
          <AlertDialogAction
            className="h-11 font-bold tracking-widest uppercase text-xs"
            onClick={handleConfirm}
          >
            <Trash2 className="size-4 mr-2" /> Hapus Permanen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
