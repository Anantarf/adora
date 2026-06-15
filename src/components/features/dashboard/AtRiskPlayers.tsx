"use client";

import { AlertTriangle, UserX } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardMetrics } from "@/actions/dashboard";

interface AtRiskPlayersProps {
  metrics: DashboardMetrics | undefined;
  isLoading: boolean;
}

export function AtRiskPlayers({ metrics, isLoading }: AtRiskPlayersProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card shadow-sm p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-44" />
            <Skeleton className="h-2.5 w-64" />
          </div>
          <Skeleton className="h-6 w-8 rounded-md shrink-0" />
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border/50 bg-background/60 px-3 py-2.5">
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-2.5 w-20" />
              </div>
              <Skeleton className="h-6 w-10 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const atRiskPlayers = metrics?.atRiskPlayers ?? [];

  if (atRiskPlayers.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-destructive/20 bg-card shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-destructive/10 px-5 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-destructive" />
            <h2 className="text-sm font-semibold text-foreground">Perlu Tindak Lanjut Absensi</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Pemain dengan status alpa 3 kali atau lebih dalam 30 hari terakhir.
          </p>
        </div>
        <span className="rounded-md border border-destructive/20 bg-destructive/5 px-2 py-1 text-xs font-semibold text-destructive">
          {atRiskPlayers.length}
        </span>
      </div>

      <div className="grid gap-3 px-5 py-4 md:grid-cols-2 lg:grid-cols-3">
        {atRiskPlayers.map((player) => (
          <div
            key={player.id}
            className="flex items-center justify-between rounded-lg border border-border/50 bg-background/60 px-3 py-2.5"
          >
            <div className="overflow-hidden pr-2">
              <p className="truncate text-sm font-semibold text-foreground">{player.name}</p>
              <p className="truncate text-xs text-muted-foreground">{player.groupName}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-destructive">
              <UserX className="size-3" />
              <span className="text-xs font-bold">{player.alpaCount}x</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
