import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { UploadRowError } from "@/components/features/batch-upload/excel-utils";

type BatchUploadPreviewSummaryProps = {
  previewStats: { total: number; valid: number; invalid: number } | null;
  previewErrors: UploadRowError[];
};

type ErrorGroup = {
  key: "classMapping" | "parent" | "date" | "name" | "email" | "other";
  label: string;
};

const ERROR_GROUPS: ErrorGroup[] = [
  { key: "classMapping", label: "Kelas/Kelompok" },
  { key: "parent", label: "Data Orang Tua" },
  { key: "date", label: "Tanggal Lahir" },
  { key: "name", label: "Nama Pemain" },
  { key: "email", label: "Email" },
  { key: "other", label: "Lainnya" },
];

const detectErrorGroup = (message: string): ErrorGroup["key"] => {
  const normalized = message.toLowerCase();

  if (normalized.includes("kelas") || normalized.includes("kelompok")) return "classMapping";
  if (normalized.includes("orang tua")) return "parent";
  if (normalized.includes("tanggal")) return "date";
  if (normalized.includes("nama pemain")) return "name";
  if (normalized.includes("email")) return "email";
  return "other";
};

export function BatchUploadPreviewSummary({ previewStats, previewErrors }: BatchUploadPreviewSummaryProps) {
  if (!previewStats) {
    return null;
  }

  const groupedErrorCounts = previewErrors.reduce<Record<ErrorGroup["key"], number>>(
    (acc, error) => {
      const groupKey = detectErrorGroup(error.message);
      acc[groupKey] += 1;
      return acc;
    },
    {
      classMapping: 0,
      parent: 0,
      date: 0,
      name: 0,
      email: 0,
      other: 0,
    },
  );

  const sortedPreviewErrors = [...previewErrors].sort((a, b) => {
    const aGroup = detectErrorGroup(a.message);
    const bGroup = detectErrorGroup(b.message);

    if (aGroup === "classMapping" && bGroup !== "classMapping") return -1;
    if (aGroup !== "classMapping" && bGroup === "classMapping") return 1;
    return a.rowNumber - b.rowNumber;
  });

  return (
    <div className="rounded-xl border border-border/50 p-3 bg-background/40 space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <CheckCircle2 className="size-4 text-primary" />
        Hasil Cek Data
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-md border border-border/40 px-2 py-1.5">
          <p className="text-muted-foreground">Total</p>
          <p className="font-semibold">{previewStats.total}</p>
        </div>
        <div className="rounded-md border border-border/40 px-2 py-1.5">
          <p className="text-muted-foreground">Siap Disimpan</p>
          <p className="font-semibold text-primary">{previewStats.valid}</p>
        </div>
        <div className="rounded-md border border-border/40 px-2 py-1.5">
          <p className="text-muted-foreground">Perlu Diperbaiki</p>
          <p className="font-semibold text-destructive">{previewStats.invalid}</p>
        </div>
      </div>

      {previewErrors.length > 0 && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2.5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-destructive">
            <AlertTriangle className="size-4" />
            Ringkasan dan Contoh Data yang Perlu Diperbaiki
          </div>

          {groupedErrorCounts.classMapping > 0 && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-700 dark:text-amber-300">
              <span className="font-semibold">Prioritas:</span> Perbaiki error Kelas/Kelompok terlebih dahulu agar mapping grup berjalan.
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
            {ERROR_GROUPS.filter((group) => groupedErrorCounts[group.key] > 0).map((group) => (
              <div
                key={group.key}
                className={`rounded border px-2 py-1 text-[11px] ${group.key === "classMapping" ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300" : "border-destructive/20 bg-background/70 text-destructive"}`}
              >
                <span className="font-semibold">{group.label}:</span> {groupedErrorCounts[group.key]}
              </div>
            ))}
          </div>

          <ul className="space-y-1">
            {sortedPreviewErrors.map((error) => (
              <li key={`${error.rowNumber}-${error.message}`} className="text-xs text-destructive/90">
                {detectErrorGroup(error.message) === "classMapping" ? <span className="font-semibold text-amber-700 dark:text-amber-300 mr-1">Prioritas:</span> : null}
                Baris {error.rowNumber}: {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
