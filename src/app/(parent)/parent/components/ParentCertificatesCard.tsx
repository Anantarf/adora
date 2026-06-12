"use client";

import { Award } from "lucide-react";

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
    <Card className="border-border/50 bg-card shadow-sm">
      <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
        <CardTitle className="text-lg font-heading uppercase tracking-wide text-primary">
          Sertifikat Prestasi
        </CardTitle>
        <CardDescription className="text-xs">
          Sertifikat dan penghargaan yang pernah diterima {playerName}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        {!certificates?.length ? (
          <div className="rounded-xl border border-dashed border-border/50 bg-background/30 px-4 py-7 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Belum ada sertifikat yang tersedia.
            </p>
            <p className="mt-1 text-xs text-muted-foreground/80">
              Sertifikat untuk {playerName} akan tampil di sini setelah ditambahkan oleh tim ADORA.
            </p>
          </div>
        ) : (
          certificates.map((certificate) => (
            <a
              key={certificate.id}
              href={certificate.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/30 px-4 py-4 transition-colors hover:bg-muted/20"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <Award className="size-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{certificate.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ditambahkan pada{" "}
                  {formatFullDate(certificate.uploadedAt)}
                </p>
              </div>
            </a>
          ))
        )}
      </CardContent>
    </Card>
  );
}
