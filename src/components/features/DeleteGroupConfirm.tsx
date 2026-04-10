"use client";

import { useDeleteGroup, type Group } from "@/hooks/use-groups";
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
import { Loader2, Trash2, AlertTriangle } from "lucide-react";

interface DeleteGroupConfirmProps {
  group: Group;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteGroupConfirm({ group, open, onOpenChange }: DeleteGroupConfirmProps) {
  const { mutateAsync: deleteGroup, isPending } = useDeleteGroup();

  const handleDelete = async () => {
    try {
      await deleteGroup(group.id);
      toast.success(`Grup ${group.name} berhasil dihapus.`);
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
            <AlertTriangle className="size-5" />
            Hapus Grup
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs font-medium tracking-wide uppercase opacity-70">
            Aksi ini membutuhkan konfirmasi.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-6 flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20 flex flex-col gap-2">
            <p className="text-sm font-semibold text-foreground">
              Apakah Anda yakin ingin menghapus grup <span className="font-black underline scale-110 px-1">{group.name}</span>?
            </p>
            <div className="flex items-center gap-3 mt-2">
              <div className="size-1.5 rounded-full bg-destructive animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-destructive">
                Tidak dapat dipulihkan
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex gap-4 items-start">
            <AlertTriangle className="size-5 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-[11px] font-medium leading-tight text-muted-foreground">
              Pastikan tidak ada atlet di grup ini sebelum menghapus. Jika ada, pindahkan mereka terlebih dahulu.
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
            Hapus Grup
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
