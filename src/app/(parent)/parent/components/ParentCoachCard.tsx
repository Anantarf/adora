"use client";

import { useState } from "react";
import { BadgeCheck, UserRound } from "lucide-react";

import type { FamilyPlayer } from "@/hooks/use-family";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ParentCoachCard({ player }: { player: FamilyPlayer }) {
  const [open, setOpen] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const resolutionSource = player.resolvedSigner?.resolutionSource;

  const coachResolution = (() => {
    const groupCoach = player.group?.coachAssignment?.coachProfile;
    if (groupCoach) {
      return { coach: groupCoach, label: "Pelatih Utama" };
    }
    if (resolutionSource === "HOMEBASE" && player.fallbackCoachProfile) {
      return { coach: player.fallbackCoachProfile, label: "Pelatih Region" };
    }
    if (resolutionSource === "GLOBAL") {
      return {
        coach: {
          id: "global",
          fullName: player.resolvedSigner?.coachNameSnapshot ?? "Head Coach Akademi",
          photoUrl: null,
          licenseUrl: null,
        },
        label: "Pelatih Umum Akademi",
      };
    }
    return { coach: null, label: "Pelatih Utama" };
  })();

  const coach = coachResolution.coach;
  const coachLabel = coachResolution.label;

  return (
    <>
      <Card className="border-border/50 bg-card shadow-sm">
        <CardHeader className="border-b border-border/50 bg-muted/10 pb-3">
          <CardTitle className="text-lg font-heading uppercase tracking-wide text-primary">
            Informasi Pelatih
          </CardTitle>
          <CardDescription className="text-xs">
            Pelatih utama yang saat ini mendampingi kelompok latihan {player.group?.name || "anak Anda"}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-16 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
              {coach?.photoUrl && !photoFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coach.photoUrl}
                  alt={coach.fullName}
                  className="h-full w-full object-cover"
                  onError={() => setPhotoFailed(true)}
                />
              ) : (
                <UserRound className="size-8 text-muted-foreground/35" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {coachLabel}
              </span>
              <p className="mt-1 truncate text-lg font-semibold text-foreground">
                {coach?.fullName || "Belum tersedia"}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-9 w-full rounded-xl border-border/50 bg-background/30 text-xs font-semibold"
            disabled={!coach?.licenseUrl}
            onClick={() => setOpen(true)}
          >
            <BadgeCheck className="mr-2 size-4" />
            {coach?.licenseUrl ? "Lihat Lisensi Pelatih" : "Lisensi Belum Tersedia"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-border/50 bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              Lisensi Pelatih
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Dokumen lisensi untuk pelatih {coach?.fullName || "-"}.
            </DialogDescription>
          </DialogHeader>
          {coach?.licenseUrl ? (
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-background/40 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coach.licenseUrl}
                alt={`Lisensi ${coach.fullName}`}
                className="max-h-[70vh] w-full rounded-xl object-contain"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
