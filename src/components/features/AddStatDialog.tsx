"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubmitStatistic } from "@/hooks/use-statistics";
import type { Player, MetricsJson } from "@/types/dashboard";
import { FLAT_METRIC_DEFS } from "@/lib/metrics";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Loader2, Pencil, Plus } from "lucide-react";

// ─── Schema ───────────────────────────────────────────
const scoreNormal = z.coerce.number().min(0, "Min 0").max(10, "Maks 10");
const scoreInAndOut = z.coerce.number().min(0, "Min 0").max(99, "Maks 99");

const statSchema = z.object({
  dribble: z.object({
    inAndOut: scoreInAndOut, crossover: scoreNormal, vLeft: scoreNormal, vRight: scoreNormal,
    betweenLegsLeft: scoreNormal, betweenLegsRight: scoreNormal,
  }),
  passing: z.object({
    chestPass: scoreNormal, bouncePass: scoreNormal, overheadPass: scoreNormal,
  }),
  layUp: scoreNormal,
  shooting: scoreNormal,
  notes: z.string().optional(),
});

type StatForm = z.infer<typeof statSchema>;

const DRIBBLE_DEFAULTS = { inAndOut: 0, crossover: 0, vLeft: 0, vRight: 0, betweenLegsLeft: 0, betweenLegsRight: 0 };
const PASSING_DEFAULTS = { chestPass: 0, bouncePass: 0, overheadPass: 0 };
const DEFAULT_METRICS: StatForm = { dribble: DRIBBLE_DEFAULTS, passing: PASSING_DEFAULTS, layUp: 0, shooting: 0, notes: "" };

// ─── ScoreField Component ─────────────────────────────
function ScoreField({ label, error, max: rawMax = 10, onChange: rhfOnChange, ...props }: { label: string; error?: string; max?: number | string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "max">) {
  const max = Number(rawMax);
  const maxDigits = max.toString().length;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length > maxDigits) e.target.value = e.target.value.slice(0, maxDigits);
    if (Number(e.target.value) > max) e.target.value = max.toString();
    rhfOnChange?.(e);
  };
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</label>
      <Input type="number" min={0} max={max} step={1} onChange={handleChange} {...props} className="h-10 text-center font-bold tabular-nums rounded-xl bg-black/20 border-primary/10 focus:border-primary/40 focus:bg-black/30 transition-all shadow-inner" />
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}

// ─── Helper: get nested error ─────────────────────────
function getNestedError(errors: Record<string, any>, path: string): string | undefined {
  const parts = path.split(".");
  let current: any = errors;
  for (const part of parts) {
    if (!current) return undefined;
    current = current[part];
  }
  return current?.message;
}

// ─── Dialog ───────────────────────────────────────────
type ExistingStat = { id: string; metrics: MetricsJson; status: "Draft" | "Published" };

export function AddStatDialog({
  player,
  periodId,
  isPeriodActive = true,
  existingStat,
}: {
  player: Player;
  periodId: string;
  isPeriodActive?: boolean;
  existingStat?: ExistingStat;
}) {
  const [open, setOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"Draft" | "Published" | null>(null);
  const { mutateAsync, isPending } = useSubmitStatistic();
  const isEdit = !!existingStat;

  const defaultValues: StatForm = existingStat?.metrics ?? DEFAULT_METRICS;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<StatForm>({
    resolver: zodResolver(statSchema) as any,
    defaultValues,
  });

  const values = watch();

  // Calculate total from all 11 flat metrics
  const grandTotal = useMemo(() => {
    return FLAT_METRIC_DEFS.reduce((sum, def) => {
      const parts = def.path.split(".");
      let val: any = values;
      for (const p of parts) val = val?.[p];
      return sum + (Number(val) || 0);
    }, 0);
  }, [values]);

  const onSubmit = async (data: StatForm, status: "Draft" | "Published") => {
    setPendingStatus(status);
    try {
      await mutateAsync({ playerId: player.id, periodId, metrics: data as MetricsJson, status });
      toast.success(`Nilai ${player.name} berhasil ${status === "Draft" ? "disimpan sementara" : "di-publish"}.`);
      setOpen(false);
      if (!isEdit) reset(DEFAULT_METRICS);
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan nilai.");
    } finally {
      setPendingStatus(null);
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
        {isEdit ? <><Pencil className="size-3" /><span className="hidden sm:inline">Ubah</span></> : <><Plus className="size-3" /><span className="hidden sm:inline">Input Nilai</span></>}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-dialog-lg overflow-y-auto custom-scrollbar bg-card border-border/50">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-primary/10 rounded-xl shrink-0"><LineChart className="size-6 text-primary" /></div>
            <div className="flex flex-col gap-0.5">
              <DialogTitle className="text-2xl font-heading uppercase tracking-widest text-foreground">{isEdit ? "Revisi" : "Input"} Nilai</DialogTitle>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {player.name} <span className="mx-1.5 text-primary/50">•</span> {player.group?.name ?? "Tidak Memiliki Kelompok"}
              </p>
            </div>
          </div>

          {!isPeriodActive && (
            <div className="p-3 mb-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium text-center tracking-wide">
              Periode evaluasi ini sudah tidak aktif. Data nilai tidak dapat diubah.
            </div>
          )}

          <form className="flex flex-col gap-3 mt-1">
            <fieldset disabled={!isPeriodActive} className="flex flex-col gap-3">
              {/* All 11 metrics in a flat grid — no section grouping */}
              <div className="rounded-lg border border-border/40 bg-muted/20 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border/30">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Aspek Penilaian</span>
                  <span className="text-sm font-bold text-primary tabular-nums">Total: {grandTotal}</span>
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  {FLAT_METRIC_DEFS.map((def) => (
                    <ScoreField
                      key={def.key}
                      label={def.label}
                      max={def.max}
                      {...register(def.path as any)}
                      error={getNestedError(errors as any, def.path)}
                    />
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Catatan / Saran Pelatih (Opsional)</label>
                <Textarea {...register("notes")} placeholder="Fokus pada konsistensi dribble tangan kiri..." className="h-20 resize-none" />
              </div>
            </fieldset>

            {/* Summary — single grand total */}
            <div className="flex items-center justify-center gap-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Skor</p>
                <p className="text-2xl font-bold text-primary tabular-nums">{grandTotal}</p>
              </div>
              <div className="w-px h-8 bg-border/50" />
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Aspek Dinilai</p>
                <p className="text-2xl font-bold text-foreground tabular-nums">{FLAT_METRIC_DEFS.length}</p>
              </div>
            </div>

            {isPeriodActive && (
              <div className="flex flex-col gap-2 mt-1">
                <Button type="button" onClick={handleSubmit((d) => onSubmit(d, "Published"))} disabled={isPending} className="w-full font-bold uppercase tracking-widest text-xs h-11 bg-primary hover:bg-primary/90 text-primary-foreground">
                  {pendingStatus === "Published" ? <><Loader2 className="animate-spin size-4 mr-2" /> Menyimpan...</> : "Simpan & Publish"}
                </Button>
                <Button type="button" variant="outline" onClick={handleSubmit((d) => onSubmit(d, "Draft"))} disabled={isPending} className="w-full font-bold uppercase tracking-widest text-xs h-11 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary transition-colors">
                  {pendingStatus === "Draft" ? <><Loader2 className="animate-spin size-4 mr-2" /> Menyimpan Draft...</> : "Simpan sebagai Draft"}
                </Button>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
