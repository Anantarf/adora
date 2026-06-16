"use client";

import { Award, ChevronRight } from "lucide-react";

import { AdminStatePanel } from "@/components/features/admin-state-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFullDate } from "@/lib/date-utils";

type CertificateItem = {
  id: string;
  title: string;
  fileUrl: string;
  uploadedAt: Date | string;
};

export function ParentCertificatesCard({
  certificates,
  playerName,
}: {
  certificates: CertificateItem[] | undefined;
  playerName: string;
}) {
  return (
    <Card className="h-full border-border/50 bg-card shadow-sm">
      <CardHeader className="border-b border-border/50 bg-muted/10 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
            <Award className="size-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-heading uppercase tracking-wide text-primary">
              Sertifikat Prestasi
            </CardTitle>
            <CardDescription className="text-xs">
              Penghargaan yang pernah diterima {playerName}.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {!certificates?.length ? (
          <AdminStatePanel
            icon={Award}
            title="Sertifikat belum tersedia"
            description={`Sertifikat untuk ${playerName} akan tampil di sini setelah ditambahkan oleh tim ADORA.`}
            className="min-h-44 border-dashed bg-background/30"
          />
        ) : (
          certificates.map((certificate) => (
            <a
              key={certificate.id}
              href={certificate.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/30 px-4 py-3.5 transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <Award className="size-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{certificate.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ditambahkan pada{" "}
                  {formatFullDate(certificate.uploadedAt)}
                </p>
              </div>
              <ChevronRight className="mt-3 size-4 shrink-0 text-muted-foreground" />
            </a>
          ))
        )}
      </CardContent>
    </Card>
  );
}
