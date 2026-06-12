"use client";

import { MapPin, UserRound } from "lucide-react";

import type { FamilyPlayer } from "@/hooks/use-family";
import { Card, CardContent } from "@/components/ui/card";

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

export function ParentPlayerHero({ player }: { player: FamilyPlayer }) {
  return (
    <Card className="border-border/50 bg-card shadow-sm">
      <CardContent className="grid gap-4 p-4 sm:p-5 md:grid-cols-[112px_minmax(0,1fr)] md:items-center">
        <div className="flex justify-center md:justify-start">
          <div className="flex h-32 w-28 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
            {player.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={player.photoUrl} alt={player.name} className="h-full w-full object-cover" />
            ) : (
              <UserRound className="size-12 text-muted-foreground/35" />
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                {player.group?.name || "Tanpa Kelompok"}
              </span>
              {player.gender ? (
                <span className="rounded-full border border-border/50 bg-background px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  {player.gender}
                </span>
              ) : null}
            </div>
            <h2 className="truncate text-2xl font-heading uppercase tracking-wide text-foreground md:text-[2rem]">
              {player.name}
            </h2>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-border/50 bg-background/40 px-3 py-3">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Tempat / Tanggal Lahir
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">{formatBirthLabel(player)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
