"use client";

import { useMemo, useState, type ChangeEvent, type InputHTMLAttributes } from "react";
import { useForm, type Path, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LineChart, Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { useSubmitStatistic } from "@/hooks/use-statistics";
import { FLAT_METRIC_DEFS } from "@/lib/metrics";
import type { MetricsJson, PlayerSummary } from "@/types/dashboard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const scoreNormal = z.coerce.number().min(0, "Min 0").max(10, "Maks 10");
const scoreInAndOut = z.coerce.number().min(0, "Min 0").max(99, "Maks 99");

const statSchema = z.object({
  dribble: z.object({
    inAndOut: scoreInAndOut,
    crossover: scoreNormal,
    vLeft: scoreNormal,
    vRight: scoreNormal,
    betweenLegsLeft: scoreNormal,
    betweenLegsRight: scoreNormal,
  }),
  passing: z.object({
    chestPass: scoreNormal,
    bouncePass: scoreNormal,
    overheadPass: scoreNormal,
  }),
  layUp: scoreNormal,
  shooting: scoreNormal,
  notes: z.string().max(160, "Maksimal 160 karakter").optional(),
});

type StatForm = z.infer<typeof statSchema>;
type ExistingStat = { id: string; metrics: MetricsJson; status: "Draft" | "Published" };
type StatPlayer = Pick<PlayerSummary, "id" | "name" | "group">;

const DRIBBLE_DEFAULTS = {
  inAndOut: 0,
  crossover: 0,
  vLeft: 0,
  vRight: 0,
  betweenLegsLeft: 0,
  betweenLegsRight: 0,
};

const PASSING_DEFAULTS = {
  chestPass: 0,
  bouncePass: 0,
  overheadPass: 0,
};

const DEFAULT_METRICS: StatForm = {
  dribble: DRIBBLE_DEFAULTS,
  passing: PASSING_DEFAULTS,
  layUp: 0,
  shooting: 0,
  notes: "",
};

function ScoreField({
  label,
  error,
  max: rawMax = 10,
  onChange: formOnChange,
  name,
  ...props
}: {
  label: string;
  error?: string;
  max?: number | string;
  name?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "max">) {
  const max = Number(rawMax);
  const maxDigits = max.toString().length;
  const fieldId = `score-field-${name?.replace(/\./g, "-")}`;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.value.length > maxDigits) {
      event.target.value = event.target.value.slice(0, maxDigits);
    }

    if (Number(event.target.value) > max) {
      event.target.value = max.toString();
    }

    formOnChange?.(event);
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Input
        id={fieldId}
        name={name}
        type="number"
        min={0}
        max={max}
        step={1}
        onChange={handleChange}
        {...props}
        className="h-10 rounded-xl border-primary/10 bg-black/20 text-center font-bold tabular-nums shadow-inner transition-all focus:border-primary/40 focus:bg-black/30"
      />
      {error ? <p className="text-[10px] text-destructive">{error}</p> : null}
    </div>
  );
}

function getNestedError(
  errors: Record<string, unknown>,
  path: string,
): string | undefined {
  const parts = path.split(".");
  let current: unknown = errors;

  for (const part of parts) {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return (current as { message?: string } | undefined)?.message;
}

export function AddStatDialog({
  player,
  periodId,
  isPeriodActive = true,
  existingStat,
  triggerClassName,
  alwaysShowLabel = false,
}: {
  player: StatPlayer;
  periodId?: string;
  isPeriodActive?: boolean;
  existingStat?: ExistingStat;
  triggerClassName?: string;
  alwaysShowLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"Draft" | "Published" | null>(null);
  const { mutateAsync, isPending } = useSubmitStatistic();
  const isEdit = !!existingStat;
  const defaultValues: StatForm = existingStat?.metrics ?? DEFAULT_METRICS;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<StatForm>({
    resolver: zodResolver(statSchema) as Resolver<StatForm>,
    defaultValues,
  });

  const values = watch();

  const grandTotal = useMemo(() => {
    return FLAT_METRIC_DEFS.reduce((sum, definition) => {
      const parts = definition.path.split(".");
      let value: unknown = values;

      for (const part of parts) {
        value = (value as Record<string, unknown>)?.[part];
      }

      return sum + (Number(value) || 0);
    }, 0);
  }, [values]);

  const onSubmit = async (data: StatForm, status: "Draft" | "Published") => {
    if (!periodId) {
      toast.error("Periode evaluasi belum dipilih.");
      return;
    }

    setPendingStatus(status);
    try {
      await mutateAsync({
        playerId: player.id,
        periodId,
        metrics: data as MetricsJson,
        status,
      });
      toast.success(
        `Nilai ${player.name} berhasil ${
          status === "Draft" ? "disimpan sebagai draft" : "diterbitkan"
        }.`,
      );
      setOpen(false);
      if (!isEdit) {
        reset(DEFAULT_METRICS);
      }
    } catch (error: unknown) {
      toast.error((error instanceof Error ? error.message : null) || "Gagal menyimpan nilai.");
    } finally {
      setPendingStatus(null);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant={isEdit ? "outline" : "default"}
        disabled={!periodId && !isEdit}
        className={`h-8 gap-1.5 text-xs font-semibold ${triggerClassName ?? ""}`}
        onClick={() => setOpen(true)}
      >
        {isEdit ? (
          <>
            <Pencil className="size-3" />
            <span className={alwaysShowLabel ? "" : "hidden sm:inline"}>Ubah</span>
          </>
        ) : (
          <>
            <Plus className="size-3" />
            <span className={alwaysShowLabel ? "" : "hidden sm:inline"}>Input Nilai</span>
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="custom-scrollbar max-h-dialog-lg overflow-y-auto border-border/50 bg-card sm:max-w-lg">
          <div className="mb-2 flex items-center gap-4">
            <div className="shrink-0 rounded-xl bg-muted/60 p-3">
              <LineChart className="size-6 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-0.5">
              <DialogTitle className="text-xl font-semibold text-foreground">
                {isEdit ? "Perbarui" : "Input"} Nilai
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {player.name} <span className="mx-1.5 text-primary/50">-</span>{" "}
                {player.group?.name ?? "Tidak Memiliki Kelompok"}
              </DialogDescription>
            </div>
          </div>

          {!isPeriodActive ? (
            <div className="mb-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-xs font-medium tracking-wide text-destructive">
              Periode evaluasi ini sudah tidak aktif. Data nilai tidak dapat diubah.
            </div>
          ) : null}

          <form className="mt-1 flex flex-col gap-3">
            <fieldset disabled={!isPeriodActive} className="flex flex-col gap-3">
              <div className="overflow-hidden rounded-lg border border-border/40 bg-muted/20">
                <div className="flex items-center justify-between border-b border-border/30 bg-muted/40 px-3 py-2">
                  <span className="text-xs font-medium text-muted-foreground">Aspek Penilaian</span>
                  <span className="text-sm font-bold tabular-nums text-primary">
                    Total: {grandTotal}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3">
                  {FLAT_METRIC_DEFS.map((definition) => (
                    <ScoreField
                      key={definition.key}
                      label={definition.label}
                      max={definition.max}
                      {...register(definition.path as Path<StatForm>)}
                      error={getNestedError(errors as Record<string, unknown>, definition.path)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Catatan / Saran Pelatih (Opsional)
                </label>
                <Textarea
                  {...register("notes")}
                  maxLength={160}
                  placeholder="Fokus pada konsistensi dribble tangan kiri..."
                  className="h-20 resize-none"
                />
              </div>
            </fieldset>

            <div className="flex items-center justify-center gap-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="text-center">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Total Skor
                </p>
                <p className="text-2xl font-bold tabular-nums text-primary">{grandTotal}</p>
              </div>
              <div className="h-8 w-px bg-border/50" />
              <div className="text-center">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Aspek Dinilai
                </p>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {FLAT_METRIC_DEFS.length}
                </p>
              </div>
            </div>

            {isPeriodActive ? (
              <div className="mt-1 flex flex-col gap-2">
                <Button
                  type="button"
                  onClick={handleSubmit((data) => onSubmit(data, "Published"))}
                  disabled={isPending}
                  className="h-11 w-full bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  {pendingStatus === "Published" ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    "Simpan & Terbitkan"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSubmit((data) => onSubmit(data, "Draft"))}
                  disabled={isPending}
                  className="h-11 w-full border-primary/30 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  {pendingStatus === "Draft" ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" /> Menyimpan Draft...
                    </>
                  ) : (
                    "Simpan sebagai Draft"
                  )}
                </Button>
              </div>
            ) : null}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
