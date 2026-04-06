"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAddStatistic } from "@/hooks/use-statistics";
import { type Player } from "@/types/dashboard";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LineChart, Loader2 } from "lucide-react";

const statSchema = z.object({
  shooting: z.coerce.number().min(0).max(100, "Maksimal skor 100"),
  dribbling: z.coerce.number().min(0).max(100),
  passing: z.coerce.number().min(0).max(100),
  stamina: z.coerce.number().min(0).max(100),
  attitude: z.coerce.number().min(0).max(100),
  notes: z.string().optional(),
});

type StatForm = z.infer<typeof statSchema>;

export function AddStatDialog({ player, date }: { player: Player; date: string }) {
  const [open, setOpen] = useState(false);
  const { mutateAsync: addStat, isPending } = useAddStatistic();

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(statSchema),
    defaultValues: { shooting: 70, dribbling: 70, passing: 70, stamina: 70, attitude: 70, notes: "" }
  });

  const onSubmit = async (data: StatForm) => {
    if (!date) {
      toast.warning("Pilih tanggal di bagian atas halaman terlebih dahulu!");
      return;
    }
    
    try {
      await addStat({
        playerId: player.id,
        date: date,
        status: "Published",
        metrics: {
          shooting: data.shooting,
          dribbling: data.dribbling,
          passing: data.passing,
          stamina: data.stamina,
          attitude: data.attitude,
          notes: data.notes || ""
        }
      });
      reset();
      setOpen(false);
      toast.success("Statistik sukses dipublikasikan.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Terjadi kesalahan tak dikenal.";
      toast.error("Gagal mempublikasikan: " + msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button size="sm" variant="outline" className="h-8 border-primary/30 text-primary hover:bg-primary/10 font-bold uppercase tracking-widest text-[10px]">
            <LineChart className="size-3 lg:mr-2" /> <span className="hidden lg:inline">Input Nilai</span>
          </Button>
        } 
      />

      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading uppercase text-foreground tracking-widest">Evaluasi Kinerja: {player.name}</DialogTitle>
          <DialogDescription className="text-sm font-medium tracking-wide">
            Masukkan skala nilai kemampuan motorik dan mental (Skala 0 - 100).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="shooting" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground cursor-pointer">Shooting</label>
              <Input id="shooting" type="number" {...register("shooting")} className="h-10 text-center font-bold" />
              {errors.shooting && <p className="text-destructive text-[10px]">{errors.shooting.message}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="dribbling" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground cursor-pointer">Dribbling</label>
              <Input id="dribbling" type="number" {...register("dribbling")} className="h-10 text-center font-bold" />
            </div>
            <div className="space-y-2">
               <label htmlFor="passing" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground cursor-pointer">Passing</label>
              <Input id="passing" type="number" {...register("passing")} className="h-10 text-center font-bold" />
            </div>
            <div className="space-y-2">
               <label htmlFor="stamina" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground cursor-pointer">Ketahanan (Stamina)</label>
              <Input id="stamina" type="number" {...register("stamina")} className="h-10 text-center font-bold" />
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-border/50">
               <label htmlFor="attitude" className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground cursor-pointer">Attitude & Mental Block</label>
              <Input id="attitude" type="number" {...register("attitude")} className="h-10 text-center font-bold" />
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground cursor-pointer">Catatan Laporan / Saran Pelatih</label>
            <Textarea id="notes" {...register("notes")} placeholder="Fokus pada transisi bertahan minggu depan..." className="h-24 resize-none" />
          </div>

          <div className="pt-4 flex w-full justify-end">
            <Button type="submit" disabled={isPending} className="w-full font-bold uppercase tracking-widest text-xs h-11">
              {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
              Simpan & Publish
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
