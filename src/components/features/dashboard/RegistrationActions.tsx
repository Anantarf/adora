"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
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
import { markRegistrationCompleted, markRegistrationPaid, markRegistrationUnpaid, deleteRegistration } from "@/actions/register";
import {
  REGISTRATION_STATUS_META,
  type RegistrationStatus,
} from "@/lib/registration-status";

type Props = {
  regId: string;
  status: RegistrationStatus;
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
      } else if (newStatus === "COMPLETED") {
        await markRegistrationCompleted(regId);
      }
    });
  };

  const handleConfirmDelete = () => {
    startTransition(async () => {
      await deleteRegistration(regId);
    });
    setShowDeleteDialog(false);
  };


  return (
    <>
      <div className="ml-2 flex items-center gap-2">
        <Select disabled={isPending} value={status} onValueChange={handleStatusChange}>
          <SelectTrigger
            className={`h-9 w-[168px] rounded-lg text-xs font-medium transition-colors ${REGISTRATION_STATUS_META[status].badgeClassName}`}
          >
            <SelectValue>
              {(() => {
                if (isPending) {
                  return (
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </div>
                  );
                }
                const meta = REGISTRATION_STATUS_META[status];
                const Icon = meta.icon;
                return (
                  <div className="flex items-center gap-1.5">
                    <Icon className="size-3.5" />
                    <span>{meta.label}</span>
                  </div>
                );
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="min-w-[168px] rounded-xl border-border/50">
            {(Object.entries(REGISTRATION_STATUS_META) as [RegistrationStatus, typeof REGISTRATION_STATUS_META[RegistrationStatus]][]).map(([key, meta]) => {
              const Icon = meta.icon;
              return (
                <SelectItem key={key} value={key} className={`cursor-pointer text-xs font-medium ${meta.selectClassName}`}>
                  <div className="flex items-center gap-1.5">
                    <Icon className="size-3.5" />
                    <span>{meta.label}</span>
                  </div>
                </SelectItem>
              );
            })}
            <SelectItem value="DELETED" className="cursor-pointer text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive">
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
