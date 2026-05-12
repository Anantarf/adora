"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Clock, Trash2, Loader2, AlertCircle } from "lucide-react";
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
      <div className="flex items-center gap-2">
        <Select disabled={isPending} value={status} onValueChange={handleStatusChange}>
          <SelectTrigger
            className={`w-[155px] h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
              isUnpaid
                ? "bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20"
                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20"
            }`}
          >
            <SelectValue>
              <div className="flex items-center gap-2">
                {isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Processing...</span>
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
                    <span>Dibatalkan</span>
                  </>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-border/50 min-w-[170px] p-1 shadow-2xl backdrop-blur-xl bg-card/95">
            <SelectItem value="PENDING" className="rounded-xl text-[10px] font-black uppercase tracking-widest text-amber-500 focus:text-amber-600 focus:bg-amber-500/10 cursor-pointer py-3">
              <div className="flex items-center gap-2">
                <Clock className="size-4" />
                <span>Belum Bayar</span>
              </div>
            </SelectItem>
            <SelectItem value="REVIEWED" className="rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-500 focus:text-emerald-600 focus:bg-emerald-500/10 cursor-pointer py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4" />
                <span>Sudah Bayar (Lunas)</span>
              </div>
            </SelectItem>
            <div className="my-1 border-t border-border/40 mx-2" />
            <SelectItem value="DELETED" className="rounded-xl text-[10px] font-black uppercase tracking-widest text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer py-3">
              <div className="flex items-center gap-2">
                <Trash2 className="size-4" />
                <span>Hapus Pendaftar</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-3xl border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl">
          <AlertDialogHeader>
            <div className="size-14 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive mb-4 mx-auto">
              <AlertCircle className="size-8" />
            </div>
            <AlertDialogTitle className="text-xl font-heading uppercase text-center tracking-widest">Hapus Data Pendaftar?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium text-center leading-relaxed">
              Tindakan ini tidak bisa dibatalkan. Data pendaftar akan <span className="text-destructive font-black">dihapus permanen</span> dari sistem database ADORA BBC.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 flex-col sm:flex-row gap-3">
            <AlertDialogCancel className="rounded-xl border-border/60 font-bold uppercase tracking-widest text-[10px] h-12 flex-1">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="rounded-xl bg-destructive text-white hover:bg-destructive/90 font-bold uppercase tracking-widest text-[10px] h-12 flex-1 shadow-lg shadow-destructive/20"
            >
              Ya, Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
