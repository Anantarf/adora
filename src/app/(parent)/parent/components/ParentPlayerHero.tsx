"use client";

import { useState } from "react";
import { CalendarDays, MapPin, UserRound } from "lucide-react";

import type { FamilyPlayer } from "@/hooks/use-family";
import { Card, CardContent } from "@/components/ui/card";
import { GradeBadge } from "@/components/features/dashboard/GradeBadge";

function formatBirthLabel(player: FamilyPlayer) {
  if (!player.dateOfBirth) {
    return player.placeOfBirth || "-";
  }

  const birthDate = new Date(player.dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) {
    return player.placeOfBirth || "-";
  }

  const dateLabel = birthDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return player.placeOfBirth ? `${player.placeOfBirth}, ${dateLabel}` : dateLabel;
}

export function ParentPlayerHero({
  player,
  latestScore,
  periodLabel,
}: {
  player: FamilyPlayer;
  latestScore: number | null;
  periodLabel: string | null;
}) {
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const photoUrl = player.photoUrl ?? "";
  const showPhoto = Boolean(photoUrl && failedPhotoUrl !== photoUrl);

  return (
    <Card className="overflow-hidden border-border/50 bg-card shadow-sm">
      <CardContent className="grid gap-4 p-4 md:grid-cols-[72px_minmax(0,1fr)_minmax(190px,0.28fr)] md:items-center">
        <div className="flex justify-start">
          <div className="flex size-18 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted/30 md:size-20">
            {showPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={player.name}
                className="h-full w-full object-cover"
                onError={() => setFailedPhotoUrl(photoUrl)}
              />
            ) : (
              <UserRound className="size-9 text-muted-foreground/35" />
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-2">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              {player.group?.name || "Tanpa Kelompok"}
            </p>
            <h2 className="truncate text-xl font-heading uppercase tracking-wide text-foreground">
              {player.name}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border/50 bg-background/40 px-3 py-1.5">
              <MapPin className="size-3.5 shrink-0 text-primary" />
              <span className="truncate text-xs font-medium text-muted-foreground">
                {formatBirthLabel(player)}
              </span>
            </div>
            {player.gender ? (
              <span className="inline-flex items-center rounded-lg border border-border/50 bg-background/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {player.gender}
              </span>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 md:justify-self-end">
          {latestScore != null ? (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Evaluasi Terbaru
                  </p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    {periodLabel || "Periode Evaluasi"}
                  </p>
                </div>
                <GradeBadge score={latestScore} />
              </div>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-black tabular-nums text-primary">{latestScore}</span>
                <span className="pb-1 text-sm font-bold text-muted-foreground">/100</span>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Evaluasi belum tersedia</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Nilai terbaru akan tampil setelah pelatih menerbitkan evaluasi.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
