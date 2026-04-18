"use client";

import { useDeleteGroup, type Group } from "@/hooks/use-groups";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
      toast.success(`Kelompok ${group.name} berhasil dihapus.`);
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
          <AlertDialogTitle className="text-xl font-heading uppercase tracking-widest flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            Hapus Kelompok
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs font-medium tracking-wide uppercase opacity-70">Aksi ini membutuhkan konfirmasi.</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-6 flex flex-col gap-4">
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground leading-relaxed">
              Apakah Anda yakin ingin menghapus kelompok <span className="font-heading tracking-widest uppercase">{group.name}</span>?
            </p>
            <div className="flex items-center gap-3">
              <div className="size-2 rounded-full bg-destructive" />
              <span className="text-xs font-semibold uppercase tracking-widest text-destructive">Tidak dapat dipulihkan</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-4 items-start">
            <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-muted-foreground">
              Menghapus kelompok akan mengubah status pemain di dalamnya menjadi <span className="font-bold underline">tanpa kelompok</span>. Data pemain tidak akan dihapus.
            </p>
          </div>
        </div>

        <AlertDialogFooter className="sm:flex-row flex-col gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isPending} className="sm:mr-2 h-11 font-bold uppercase tracking-widest text-xs border-border/50">
            Batalkan
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isPending}
            className="h-11 font-bold tracking-widest uppercase text-xs"
          >
            {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : <Trash2 className="size-4 mr-2" />}
            Hapus Kelompok
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
