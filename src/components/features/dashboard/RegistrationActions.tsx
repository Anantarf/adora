"use client";

import { useTransition } from "react";
import { CheckCircle2, Clock, Trash2, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { markRegistrationPaid, markRegistrationUnpaid, deleteRegistration } from "@/actions/register";

type Props = {
  regId: string;
  status: "PENDING" | "REVIEWED" | "COMPLETED";
};

export function RegistrationActions({ regId, status }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: string | null) => {
    if (!newStatus) return;
    
    if (newStatus === "DELETED") {
      if (confirm("Apakah Anda yakin ingin menghapus pendaftar ini secara permanen?")) {
        startTransition(async () => {
          await deleteRegistration(regId);
        });
      }
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

  const isUnpaid = status === "PENDING";
  
  return (
    <div className="flex items-center gap-2 ml-2">
      <Select
        disabled={isPending}
        value={status}
        onValueChange={handleStatusChange}
      >
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
              <span>Batal Daftar</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
