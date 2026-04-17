"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, CalendarRange, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCreatePeriod } from "@/hooks/use-evaluation-periods";
import { toYYYYMMDD, getJakartaToday } from "@/lib/date-utils";

const schema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  endDate: z.string().min(1, "Tanggal selesai wajib diisi"),
  setActive: z.boolean(),
}).refine(d => d.endDate >= d.startDate, {
  message: "Tanggal selesai harus setelah tanggal mulai",
  path: ["endDate"],
});

type FormValues = z.infer<typeof schema>;

export function AddPeriodDialog() {
  const [open, setOpen] = useState(false);
  const { mutateAsync, isPending } = useCreatePeriod();
  const today = toYYYYMMDD(getJakartaToday());

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", startDate: today, endDate: today, setActive: true },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await mutateAsync(values);
      toast.success(`Periode "${values.name}" berhasil dibuat.`);
      setOpen(false);
      reset();
    } catch (e: any) {
      toast.error(e.message || "Gagal membuat periode.");
    }
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="gap-2 h-9">
        <Plus className="size-4" /> Periode Baru
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary/10 rounded-lg"><CalendarRange className="size-5 text-primary" /></div>
            <DialogTitle className="text-lg font-bold">Buat Periode Evaluasi</DialogTitle>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nama Periode</label>
              <Input placeholder="Contoh: Semester 1 2025" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tanggal Mulai</label>
                <Input type="date" {...register("startDate")} />
                {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tanggal Selesai</label>
                <Input type="date" {...register("endDate")} />
                {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/40">
              <Switch
                id="setActive"
                checked={watch("setActive")}
                onCheckedChange={v => setValue("setActive", v)}
              />
              <Label htmlFor="setActive" className="text-sm cursor-pointer">
                Jadikan periode aktif <span className="text-muted-foreground text-xs">(periode aktif lain akan dinonaktifkan)</span>
              </Label>
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? <><Loader2 className="size-4 animate-spin mr-2" /> Menyimpan...</> : "Buat Periode"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
