"use client";

import { AlertTriangle, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardMetrics } from "@/actions/dashboard";

interface AtRiskPlayersProps {
  metrics: DashboardMetrics | undefined;
  isLoading: boolean;
}

export function AtRiskPlayers({ metrics, isLoading }: AtRiskPlayersProps) {
  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const atRiskPlayers = metrics?.atRiskPlayers || [];

  if (atRiskPlayers.length === 0) {
    return null; // Sembunyikan kalau tidak ada anak yang bermasalah absennya
  }

  return (
    <Card className="border-red-500/20 bg-red-500/5 shadow-sm">
      <CardHeader className="pb-3 border-b border-red-500/10 flex flex-row items-center gap-2 space-y-0">
        <AlertTriangle className="size-5 text-red-500 shrink-0" />
        <CardTitle className="text-red-500 flex-1 font-heading tracking-widest text-lg uppercase">
          Peringatan Absensi
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-sm text-muted-foreground mb-4">
          Pemain berikut ini tercatat <span className="font-semibold text-foreground">Alpa 3 kali atau lebih</span> dalam 30 hari terakhir. Mohon pertimbangkan untuk follow-up ke orang tua.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {atRiskPlayers.map((player) => (
            <div key={player.id} className="flex items-center justify-between p-3 rounded-md bg-background border border-red-500/20">
              <div className="overflow-hidden pr-2">
                <p className="font-semibold text-sm truncate">{player.name}</p>
                <p className="text-xs text-muted-foreground truncate">{player.groupName}</p>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 text-red-500 shrink-0">
                <UserX className="size-3" />
                <span className="text-xs font-bold">{player.alpaCount}x</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
