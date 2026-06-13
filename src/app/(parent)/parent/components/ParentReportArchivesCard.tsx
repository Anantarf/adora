"use client";

import { FileText } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFullDate } from "@/lib/date-utils";

type ArchiveItem = {
  id: string;
  fileUrl: string;
  releasedAt: Date | string | null;
  period: {
    id: string;
    name: string;
    startDate: Date | string;
    endDate: Date | string;
  };
};

export function ParentReportArchivesCard({
  archives,
  playerName,
}: {
  archives: ArchiveItem[] | undefined;
  playerName: string;
}) {
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
              Rapor {playerName} akan tampil di sini setelah dokumen evaluasi diterbitkan.
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
              <a
                href={archive.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center justify-center rounded-xl border border-border/50 bg-card px-4 text-xs font-semibold text-foreground transition-colors hover:bg-muted/20"
              >
                <FileText className="mr-2 size-4 text-primary" />
                Lihat Rapor
              </a>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
