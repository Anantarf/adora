"use client";

import { useMemo, useState } from "react";
import { Info, Loader2, Plus, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AUTO_ATTENDANCE_REDUCED_THRESHOLD,
  DEFAULT_EVALUATION_CONFIG_V2,
  FIXED_ASPECT_MAX_SCORE,
  normalizeEvaluationConfig,
  type EvaluationConfigV2,
} from "@/lib/evaluation-rules";
import { useEvaluationConfig, useUpdateEvaluationConfig } from "@/hooks/use-evaluation-config";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

function nextId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatWeight(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.?0+$/, "");
}

export function EvaluationConfigDialog() {
  const [open, setOpen] = useState(false);
  const { data } = useEvaluationConfig();
  const { mutateAsync, isPending } = useUpdateEvaluationConfig();

  // Hitung nilai awal saat dialog dibuka. useMemo tidak memicu cascading render.
  const initialDraft = useMemo(
    () => normalizeEvaluationConfig(data ?? DEFAULT_EVALUATION_CONFIG_V2),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open], // sengaja hanya bergantung pada `open` agar draft di-reset setiap kali dialog dibuka
  );
  const [draft, setDraft] = useState<EvaluationConfigV2>(initialDraft);

  // Sinkronkan state lokal jika initialDraft berubah (dialog dibuka kembali)
  const [prevInitialDraft, setPrevInitialDraft] = useState(initialDraft);
  if (prevInitialDraft !== initialDraft) {
    setPrevInitialDraft(initialDraft);
    setDraft(initialDraft);
  }

  const updateDraft = (updater: (current: EvaluationConfigV2) => EvaluationConfigV2) => {
    setDraft((current) => normalizeEvaluationConfig(updater(current)));
  };

  const handleSave = async () => {
    try {
      await mutateAsync(normalizeEvaluationConfig(draft));
      toast.success("Aturan penilaian berhasil disimpan.");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan aturan penilaian.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" className="h-11 rounded-xl border-border/50">
            <Settings2 className="mr-2 size-4" />
            Aturan Penilaian
          </Button>
        }
      />
      <DialogContent className="custom-scrollbar max-h-[90vh] overflow-y-auto border-border/50 bg-card sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Aturan Penilaian
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Bobot kategori, presensi, dan skala aspek dikunci oleh sistem. Perubahan hanya akan dipakai oleh periode baru.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 size-4 text-primary" />
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Aturan bobot otomatis aktif.</p>
                <p>
                  Jika kategori teknis aktif sampai {AUTO_ATTENDANCE_REDUCED_THRESHOLD}, presensi bernilai{" "}
                  <span className="font-semibold text-foreground">10%</span>. Jika lebih dari{" "}
                  {AUTO_ATTENDANCE_REDUCED_THRESHOLD}, presensi turun jadi{" "}
                  <span className="font-semibold text-foreground">5%</span> dan sisa bobot dibagi rata ke semua kategori teknis.
                </p>
                <p>
                  Semua aspek memakai skala tetap{" "}
                  <span className="font-semibold text-foreground">0-{FIXED_ASPECT_MAX_SCORE}</span>.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Maksimum Karakter Catatan</label>
              <Input
                type="number"
                min={40}
                max={1000}
                value={draft.notesMaxLength}
                onChange={(event) =>
                  updateDraft((previous) => ({
                    ...previous,
                    notesMaxLength: Math.max(40, Math.min(1000, Number(event.target.value) || 160)),
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Kategori Penilaian</h3>
                <p className="text-xs text-muted-foreground">Kelola nama kategori dan daftar aspek. Bobot dihitung otomatis oleh sistem.</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  updateDraft((previous) => ({
                    ...previous,
                    categories: [
                      ...previous.categories,
                      {
                        id: nextId("category"),
                        label: `Kategori ${previous.categories.length + 1}`,
                        weight: 0,
                        items: [{ id: nextId("item"), label: "Aspek Baru", maxScore: FIXED_ASPECT_MAX_SCORE }],
                      },
                    ],
                  }))
                }
              >
                <Plus className="mr-1.5 size-3.5" />
                Tambah Kategori
              </Button>
            </div>

            <div className="space-y-4">
              {draft.categories.map((category, categoryIndex) => (
                <div key={category.id} className="space-y-3 rounded-xl border border-border/40 bg-background/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={category.label}
                        onChange={(event) =>
                          updateDraft((previous) => ({
                            ...previous,
                            categories: previous.categories.map((entry, index) =>
                              index === categoryIndex ? { ...entry, label: event.target.value } : entry,
                            ),
                          }))
                        }
                        placeholder="Nama kategori"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Bobot otomatis {formatWeight(category.weight)}% • {category.items.length} aspek • Skala 0-{FIXED_ASPECT_MAX_SCORE}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() =>
                        updateDraft((previous) => ({
                          ...previous,
                          categories: previous.categories.filter((_, index) => index !== categoryIndex),
                        }))
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {category.items.map((item, itemIndex) => (
                      <div key={item.id} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_auto]">
                        <Input
                          value={item.label}
                          onChange={(event) =>
                            updateDraft((previous) => ({
                              ...previous,
                              categories: previous.categories.map((entry, index) =>
                                index === categoryIndex
                                  ? {
                                      ...entry,
                                      items: entry.items.map((entryItem, innerIndex) =>
                                        innerIndex === itemIndex
                                          ? { ...entryItem, label: event.target.value }
                                          : entryItem,
                                      ),
                                    }
                                  : entry,
                              ),
                            }))
                          }
                          placeholder="Nama aspek"
                        />
                        <div className="flex h-10 items-center justify-center rounded-xl border border-border/50 bg-muted/30 text-xs font-semibold text-muted-foreground">
                          Skala 0-{FIXED_ASPECT_MAX_SCORE}
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() =>
                            updateDraft((previous) => ({
                              ...previous,
                              categories: previous.categories.map((entry, index) =>
                                index === categoryIndex
                                  ? { ...entry, items: entry.items.filter((_, innerIndex) => innerIndex !== itemIndex) }
                                  : entry,
                              ),
                            }))
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      updateDraft((previous) => ({
                        ...previous,
                        categories: previous.categories.map((entry, index) =>
                          index === categoryIndex
                            ? {
                                ...entry,
                                items: [
                                  ...entry.items,
                                  { id: nextId("item"), label: `Aspek ${entry.items.length + 1}`, maxScore: FIXED_ASPECT_MAX_SCORE },
                                ],
                              }
                            : entry,
                        ),
                      }))
                    }
                  >
                    <Plus className="mr-1.5 size-3.5" />
                    Tambah Aspek
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border/50 p-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Presensi</h3>
              <p className="text-xs text-muted-foreground">Presensi selalu aktif dan dihitung otomatis dari data kehadiran dalam rentang periode.</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-background/30 p-3 text-sm text-muted-foreground">
              Bobot presensi saat ini: <span className="font-semibold text-foreground">{formatWeight(draft.attendance.weight)}%</span>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border/50 p-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Predikat</h3>
              <p className="text-xs text-muted-foreground">Nilai minimum dibaca dari atas ke bawah.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {draft.grading.map((grade, index) => (
                <div key={`${grade.letter}-${index}`} className="space-y-2 rounded-lg border border-border/40 bg-background/30 p-3">
                  <Input
                    value={grade.letter}
                    onChange={(event) =>
                      updateDraft((previous) => ({
                        ...previous,
                        grading: previous.grading.map((entry, gradeIndex) =>
                          gradeIndex === index ? { ...entry, letter: event.target.value.toUpperCase() } : entry,
                        ),
                      }))
                    }
                    placeholder="Huruf"
                  />
                  <Input
                    value={grade.label}
                    onChange={(event) =>
                      updateDraft((previous) => ({
                        ...previous,
                        grading: previous.grading.map((entry, gradeIndex) =>
                          gradeIndex === index ? { ...entry, label: event.target.value.toUpperCase() } : entry,
                        ),
                      }))
                    }
                    placeholder="Label"
                  />
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={grade.minScore}
                    onChange={(event) =>
                      updateDraft((previous) => ({
                        ...previous,
                        grading: previous.grading.map((entry, gradeIndex) =>
                          gradeIndex === index
                            ? { ...entry, minScore: Math.max(0, Math.min(100, Number(event.target.value) || 0)) }
                            : entry,
                        ),
                      }))
                    }
                    placeholder="Nilai minimum"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Aturan"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
