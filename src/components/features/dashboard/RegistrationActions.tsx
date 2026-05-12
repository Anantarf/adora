"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Clock, Trash2, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { markRegistrationPaid, markRegistrationUnpaid, deleteRegistration } from "@/actions/register";

type Props = {
  regId: string;
  status: "PENDING" | "REVIEWED" | "COMPLETED";
};

export function RegistrationActions({ regId, status }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleStatusChange = (newStatus: string | null) => {
    if (!newStatus) return;

    if (newStatus === "DELETED") {
      setShowDeleteDialog(true);
      return;
    }

    startTransition(async () => {
      if (newStatus === "REVIEWED") {
        await markRegistrationPaid(regId);
      } else if (newStatus === "PENDING") {
        await markRegistrationUnpaid(regId);
      }
    });
  };

  const handleConfirmDelete = () => {
    startTransition(async () => {
      await deleteRegistration(regId);
    });
    setShowDeleteDialog(false);
  };

  const isUnpaid = status === "PENDING";

  return (
    <>
      <div className="flex items-center gap-2 ml-2">
        <Select disabled={isPending} value={status} onValueChange={handleStatusChange}>
          <SelectTrigger
            className={`w-[155px] h-8 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              isUnpaid
                ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
            }`}
          >
            <SelectValue>
              <div className="flex items-center gap-1.5">
                {isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : status === "PENDING" ? (
                  <>
                    <Clock className="size-3.5" />
                    <span>Belum Bayar</span>
                  </>
                ) : status === "REVIEWED" ? (
                  <>
                    <CheckCircle2 className="size-3.5" />
                    <span>Sudah Bayar</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" />
                    <span>Batal Daftar</span>
                  </>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/50 min-w-[155px]">
            <SelectItem value="PENDING" className="text-[10px] font-bold uppercase tracking-wider text-amber-500 focus:text-amber-600 focus:bg-amber-500/10 cursor-pointer">
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                <span>Belum Bayar</span>
              </div>
            </SelectItem>
            <SelectItem value="REVIEWED" className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 focus:text-emerald-600 focus:bg-emerald-500/10 cursor-pointer">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" />
                <span>Sudah Bayar</span>
              </div>
            </SelectItem>
            <SelectItem value="DELETED" className="text-[10px] font-bold uppercase tracking-wider text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
              <div className="flex items-center gap-1.5">
                <Trash2 className="size-3.5" />
                <span>Hapus Pendaftar</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data pendaftar ini?</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/80 font-medium leading-relaxed">
              Data pendaftar akan dihapus secara <span className="text-destructive font-bold">permanen</span> dan tidak bisa dikembalikan.
            </AlertDialogDescription>
            <div className="mt-4 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
              <p className="text-amber-500/90 text-xs font-medium leading-relaxed">
                <strong className="font-bold">Catatan:</strong> Pastikan Anda sudah mencatat informasi yang diperlukan sebelum menghapus.
              </p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Hapus Pendaftar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
