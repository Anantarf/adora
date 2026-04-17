"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubmitStatistic } from "@/hooks/use-statistics";
import type { Player, MetricsJson } from "@/types/dashboard";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Loader2, Pencil, Plus } from "lucide-react";

// ─── Schema ───────────────────────────────────────────
const score = z.coerce.number().min(0, "Min 0").max(999, "Terlalu besar");

const statSchema = z.object({
  dribble: z.object({
    inAndOut: score, crossover: score, vLeft: score, vRight: score,
    betweenLegsLeft: score, betweenLegsRight: score,
  }),
  passing: z.object({
    chestPass: score, bouncePass: score, overheadPass: score,
  }),
  layUp: score,
  shooting: score,
  notes: z.string().optional(),
});

type StatForm = z.infer<typeof statSchema>;

const DRIBBLE_DEFAULTS = { inAndOut: 0, crossover: 0, vLeft: 0, vRight: 0, betweenLegsLeft: 0, betweenLegsRight: 0 };
const PASSING_DEFAULTS = { chestPass: 0, bouncePass: 0, overheadPass: 0 };
const DEFAULT_METRICS: StatForm = { dribble: DRIBBLE_DEFAULTS, passing: PASSING_DEFAULTS, layUp: 0, shooting: 0, notes: "" };

// ─── Helper: sum number values of an object ──────────
const sumValues = (obj: Record<string, number>) => Object.values(obj).reduce((a, b) => a + b, 0);

// ─── Sub-section Component ────────────────────────────
function ScoreSection({ title, total, children }: { title: string; total: number; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border/30">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</span>
        <span className="text-sm font-bold text-primary tabular-nums">Total: {total}</span>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2">{children}</div>
    </div>
  );
}

function ScoreField({ label, error, ...props }: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium text-muted-foreground">{label}</label>
      <Input type="number" min={0} step={1} {...props} className="h-9 text-center font-bold tabular-nums" />
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}

// ─── Dialog ───────────────────────────────────────────
type ExistingStat = { id: string; metrics: MetricsJson; status: "Draft" | "Published" };

export function AddStatDialog({
  player,
  periodId,
  existingStat,
}: {
  player: Player;
  periodId: string;
  existingStat?: ExistingStat;
}) {
  const [open, setOpen] = useState(false);
  const { mutateAsync, isPending } = useSubmitStatistic();
  const isEdit = !!existingStat;

  const defaultValues: StatForm = existingStat?.metrics ?? DEFAULT_METRICS;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<StatForm>({
    resolver: zodResolver(statSchema) as any,
    defaultValues,
  });

  const values = watch();

  const dribbleTotal = useMemo(() => sumValues(values.dribble ?? {}), [values.dribble]);
  const passingTotal = useMemo(() => sumValues(values.passing ?? {}), [values.passing]);

  const onSubmit = async (data: StatForm) => {
    try {
      await mutateAsync({ playerId: player.id, periodId, metrics: data as MetricsJson, status: "Published" });
      toast.success(`Nilai ${player.name} berhasil ${isEdit ? "diperbarui" : "disimpan"}.`);
      setOpen(false);
      if (!isEdit) reset(DEFAULT_METRICS);
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan nilai.");
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant={isEdit ? "outline" : "default"}
        className="h-8 font-bold uppercase tracking-widest text-xs gap-1.5"
        onClick={() => setOpen(true)}
      >
        {isEdit ? <><Pencil className="size-3" /><span className="hidden sm:inline">Edit</span></> : <><Plus className="size-3" /><span className="hidden sm:inline">Input Nilai</span></>}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto bg-card border-border/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary/10 rounded-lg"><LineChart className="size-5 text-primary" /></div>
            <div>
              <DialogTitle className="text-base font-bold uppercase tracking-widest">{isEdit ? "Edit" : "Input"} Nilai — {player.name}</DialogTitle>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {player.group?.name ?? "Tanpa Kelompok"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 mt-1">
            {/* Dribble */}
            <ScoreSection title="Dribble" total={dribbleTotal}>
              <ScoreField label="In & Out" {...register("dribble.inAndOut")} error={errors.dribble?.inAndOut?.message} />
              <ScoreField label="Crossover" {...register("dribble.crossover")} error={errors.dribble?.crossover?.message} />
              <ScoreField label="V Dribble Kiri" {...register("dribble.vLeft")} error={errors.dribble?.vLeft?.message} />
              <ScoreField label="V Dribble Kanan" {...register("dribble.vRight")} error={errors.dribble?.vRight?.message} />
              <ScoreField label="Between Legs Kiri" {...register("dribble.betweenLegsLeft")} error={errors.dribble?.betweenLegsLeft?.message} />
              <ScoreField label="Between Legs Kanan" {...register("dribble.betweenLegsRight")} error={errors.dribble?.betweenLegsRight?.message} />
            </ScoreSection>

            {/* Passing */}
            <ScoreSection title="Passing" total={passingTotal}>
              <ScoreField label="Chest Pass" {...register("passing.chestPass")} error={errors.passing?.chestPass?.message} />
              <ScoreField label="Bounce Pass" {...register("passing.bouncePass")} error={errors.passing?.bouncePass?.message} />
              <ScoreField label="Overhead Pass" {...register("passing.overheadPass")} error={errors.passing?.overheadPass?.message} />
            </ScoreSection>

            {/* Lay Up & Shooting */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/40 bg-muted/20 p-3 flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lay Up</span>
                <Input type="number" min={0} {...register("layUp")} className="h-9 text-center font-bold tabular-nums" />
                {errors.layUp && <p className="text-[10px] text-destructive">{errors.layUp.message}</p>}
              </div>
              <div className="rounded-lg border border-border/40 bg-muted/20 p-3 flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Shooting</span>
                <Input type="number" min={0} {...register("shooting")} className="h-9 text-center font-bold tabular-nums" />
                {errors.shooting && <p className="text-[10px] text-destructive">{errors.shooting.message}</p>}
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Catatan / Saran Pelatih (opsional)</label>
              <Textarea {...register("notes")} placeholder="Fokus pada konsistensi dribble tangan kiri..." className="h-20 resize-none" />
            </div>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
              {[
                { label: "Dribble", val: dribbleTotal },
                { label: "Passing", val: passingTotal },
                { label: "Lay Up", val: values.layUp ?? 0 },
                { label: "Shooting", val: values.shooting ?? 0 },
              ].map(({ label, val }) => (
                <div key={label} className="text-center">
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
                  <p className="text-lg font-bold text-primary tabular-nums">{val}</p>
                </div>
              ))}
            </div>

            <Button type="submit" disabled={isPending} className="w-full font-bold uppercase tracking-widest text-xs h-11 mt-1">
              {isPending ? <><Loader2 className="animate-spin size-4 mr-2" /> Menyimpan...</> : isEdit ? "Simpan Perubahan" : "Simpan & Publish"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
