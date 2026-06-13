"use client";

import { useMemo, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFullDate } from "@/lib/date-utils";
import type { FamilyPlayer } from "@/hooks/use-family";
import type { PlayerStatRecord } from "@/hooks/use-player-stats";
import type { MetricsJson } from "@/types/dashboard";
import type { MetricsJsonV2 } from "@/lib/evaluation-rules";

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
  reportSettings,
  stats,
}: {
  archives: ArchiveItem[] | undefined;
  player: FamilyPlayer;
  reportSettings?: Record<string, string> | null;
  stats: PlayerStatRecord[] | undefined;
}) {
  const [loadingArchiveId, setLoadingArchiveId] = useState<string | null>(null);
  const statsByPeriodId = useMemo(
    () => new Map((stats ?? []).map((stat) => [stat.periodId, stat])),
    [stats],
  );

  const handleOpenRealReport = async (archive: ArchiveItem) => {
    const stat = statsByPeriodId.get(archive.period.id);

    if (!stat?.metricsJson) {
      if (archive.fileUrl) {
        window.open(archive.fileUrl, "_blank", "noopener,noreferrer");
        return;
      }

      toast.error("Data penilaian rapor belum tersedia.");
      return;
    }

    setLoadingArchiveId(archive.id);
    try {
      const { generateRaporPDF } = await import("@/lib/generate-rapor-pdf");
      await generateRaporPDF({
        playerName: player.name,
        groupName: archive.groupNameSnapshot ?? player.group?.name ?? "-",
        schoolOrigin: player.schoolOrigin ?? "-",
        periodName: archive.period.name,
        metrics: stat.metricsJson as MetricsJson | MetricsJsonV2,
        assets: {
          headerUrl: reportSettings?.rapor_header_url ?? undefined,
          ceoSignUrl: reportSettings?.rapor_ceo_sign_url ?? undefined,
          coachSignUrl:
            archive.coachSignUrlSnapshot ?? reportSettings?.rapor_coach_sign_url ?? undefined,
          stampUrl: reportSettings?.rapor_stamp_url ?? undefined,
        },
        signers: {
          coachName: archive.coachNameSnapshot ?? reportSettings?.rapor_coach_name ?? undefined,
          ceoName: reportSettings?.rapor_ceo_name ?? undefined,
        },
        action: "preview",
      });
    } catch {
      toast.error("Gagal membuka rapor. Coba lagi.");
    } finally {
      setLoadingArchiveId(null);
    }
  };

  return (
    <Card className="border-border/50 bg-card shadow-sm">
      <CardHeader className="border-b border-border/50 bg-muted/10 pb-3">
        <CardTitle className="text-lg font-heading uppercase tracking-wide text-primary">
          Arsip Rapor
        </CardTitle>
        <CardDescription className="text-xs">
          Kumpulan rapor resmi anak Anda untuk setiap periode evaluasi yang sudah tersedia.
        </CardDescription>
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
              className="flex flex-col gap-3 rounded-xl border border-border/50 bg-background/30 px-4 py-3.5"
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
              </button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
