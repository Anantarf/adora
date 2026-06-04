"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  DEFAULT_EVALUATION_CONFIG_V2,
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

export function EvaluationConfigDialog() {
  const [open, setOpen] = useState(false);
  const { data } = useEvaluationConfig();
  const { mutateAsync, isPending } = useUpdateEvaluationConfig();
  const [draft, setDraft] = useState<EvaluationConfigV2>(DEFAULT_EVALUATION_CONFIG_V2);

  useEffect(() => {
    if (open) {
      setDraft(normalizeEvaluationConfig(data ?? DEFAULT_EVALUATION_CONFIG_V2));
    }
  }, [data, open]);

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
            Aturan Penilaian Dinamis
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Atur kategori, aspek penilaian, bobot, presensi, dan predikat. Perubahan hanya akan dipakai oleh periode baru.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Maksimum Karakter Catatan</label>
              <Input
                type="number"
                min={40}
                max={1000}
                value={draft.notesMaxLength}
                onChange={(event) =>
                  setDraft((previous) => ({
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
                <p className="text-xs text-muted-foreground">Tambahkan kategori dan jenis penilaian sesuai kebutuhan periode baru.</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraft((previous) => ({
                    ...previous,
                    categories: [
                      ...previous.categories,
                      {
                        id: nextId("category"),
                        label: `Kategori ${previous.categories.length + 1}`,
                        weight: 10,
                        items: [{ id: nextId("item"), label: "Aspek Baru", maxScore: 10 }],
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
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_auto]">
                    <Input
                      value={category.label}
                      onChange={(event) =>
                        setDraft((previous) => ({
                          ...previous,
                          categories: previous.categories.map((entry, index) =>
                            index === categoryIndex ? { ...entry, label: event.target.value } : entry,
                          ),
                        }))
                      }
                      placeholder="Nama kategori"
                    />
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={category.weight}
                      onChange={(event) =>
                        setDraft((previous) => ({
                          ...previous,
                          categories: previous.categories.map((entry, index) =>
                            index === categoryIndex
                              ? { ...entry, weight: Math.max(0, Math.min(100, Number(event.target.value) || 0)) }
                              : entry,
                          ),
                        }))
                      }
                      placeholder="Bobot %"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() =>
                        setDraft((previous) => ({
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
                            setDraft((previous) => ({
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
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={item.maxScore}
                          onChange={(event) =>
                            setDraft((previous) => ({
                              ...previous,
                              categories: previous.categories.map((entry, index) =>
                                index === categoryIndex
                                  ? {
                                      ...entry,
                                      items: entry.items.map((entryItem, innerIndex) =>
                                        innerIndex === itemIndex
                                          ? { ...entryItem, maxScore: Math.max(1, Number(event.target.value) || 10) }
                                          : entryItem,
                                      ),
                                    }
                                  : entry,
                              ),
                            }))
                          }
                          placeholder="Maks"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() =>
                            setDraft((previous) => ({
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
                      setDraft((previous) => ({
                        ...previous,
                        categories: previous.categories.map((entry, index) =>
                          index === categoryIndex
                            ? {
                                ...entry,
                                items: [
                                  ...entry.items,
                                  { id: nextId("item"), label: `Aspek ${entry.items.length + 1}`, maxScore: 10 },
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
              <p className="text-xs text-muted-foreground">Nilai presensi dihitung otomatis dari data kehadiran dalam rentang periode.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={draft.attendance.enabled}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      attendance: { ...previous.attendance, enabled: event.target.checked },
                    }))
                  }
                />
                Aktifkan presensi dalam penilaian
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={draft.attendance.weight}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    attendance: {
                      ...previous.attendance,
                      weight: Math.max(0, Math.min(100, Number(event.target.value) || 0)),
                    },
                  }))
                }
                placeholder="Bobot presensi"
              />
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
                      setDraft((previous) => ({
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
                      setDraft((previous) => ({
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
                      setDraft((previous) => ({
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
