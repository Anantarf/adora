"use client";

import { useState } from "react";
import { ChevronRight, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFullDate } from "@/lib/date-utils";
import type { FamilyPlayer } from "@/hooks/use-family";

type ArchiveItem = {
  id: string;
  fileUrl: string;
  releasedAt: Date | string | null;
  coachNameSnapshot?: string | null;
  coachSignUrlSnapshot?: string | null;
  groupNameSnapshot?: string | null;
  period: {
    id: string;
    name: string;
    startDate: Date | string;
    endDate: Date | string;
  };
};

export function ParentReportArchivesCard({
  archives,
  player,
}: {
  archives: ArchiveItem[] | undefined;
  player: FamilyPlayer;
}) {
  const [loadingArchiveId, setLoadingArchiveId] = useState<string | null>(null);

  const handleOpenRealReport = async (archive: ArchiveItem) => {
    if (!archive.fileUrl) {
      toast.error("File rapor belum tersedia.");
      return;
    }

    setLoadingArchiveId(archive.id);
    try {
      window.open(archive.fileUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Gagal membuka rapor. Coba lagi.");
    } finally {
      setLoadingArchiveId(null);
    }
  };

  return (
    <Card className="h-full border-border/50 bg-card shadow-sm">
      <CardHeader className="border-b border-border/50 bg-muted/10 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
            <FileText className="size-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-heading uppercase tracking-wide text-primary">
              Arsip Rapor
            </CardTitle>
            <CardDescription className="text-xs">
              Rapor resmi setiap periode evaluasi.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {!archives?.length ? (
          <div className="rounded-xl border border-dashed border-border/50 bg-background/30 px-4 py-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">Belum ada rapor yang tersedia.</p>
            <p className="mt-1 text-xs text-muted-foreground/80">
              Rapor {player.name} akan tampil di sini setelah dokumen evaluasi diterbitkan.
            </p>
          </div>
        ) : (
          archives.map((archive) => (
            <div
              key={archive.id}
              className="flex flex-col gap-3 rounded-xl border border-border/50 bg-background/30 px-4 py-3.5 transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{archive.period.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tersedia sejak{" "}
                  {archive.releasedAt ? formatFullDate(archive.releasedAt) : "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenRealReport(archive)}
                disabled={loadingArchiveId === archive.id}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-border/50 bg-card px-4 text-xs font-semibold text-foreground transition-colors hover:bg-muted/20"
              >
                {loadingArchiveId === archive.id ? (
                  <Loader2 className="mr-2 size-4 animate-spin text-primary" />
                ) : (
                  <FileText className="mr-2 size-4 text-primary" />
                )}
                Lihat Rapor
                <ChevronRight className="ml-1 size-3.5 text-muted-foreground" />
              </button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
