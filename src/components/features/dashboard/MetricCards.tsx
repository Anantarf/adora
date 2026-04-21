"use client";

import { Users, Layers, TrendingUp, FileCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import type { DashboardMetrics } from "@/actions/dashboard";

const METRIC_CARDS = [
  {
    key: "playerCount" as const,
    label: "Pemain Aktif",
    subtitle: "Terdaftar di klub",
    icon: Users,
  },
  {
    key: "groupCount" as const,
    label: "Kelompok Latihan",
    subtitle: "Kelompok berjalan",
    icon: Layers,
  },
  {
    key: "attendanceRate" as const,
    label: "Kehadiran Latihan",
    subtitle: "Rata-rata 30 hari terakhir",
    icon: TrendingUp,
    suffix: "%",
  },
  {
    key: "publishedStatsCount" as const,
    label: "Rapor Diterbitkan",
    subtitle: "Nilai yang sudah final",
    icon: FileCheck,
  },
] as const;

function attendanceColor(rate: number, hasData: boolean): string {
  if (!hasData) return "text-foreground";
  if (rate >= 80) return "text-primary";
  if (rate >= 50) return "text-yellow-500";
  return "text-destructive";
}

interface MetricCardsProps {
  metrics: DashboardMetrics | undefined;
  isLoading: boolean;
}

export function MetricCards({ metrics, isLoading }: MetricCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {METRIC_CARDS.map((c) => (
          <Card key={c.key} className="border-border/50 bg-card shadow-sm">
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <StaggerContainer className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {METRIC_CARDS.map((c) => {
        const Icon = c.icon;
        const raw = metrics?.[c.key] ?? 0;
        const display = "suffix" in c ? `${raw}${c.suffix}` : String(raw);
        const valueClass =
          c.key === "attendanceRate"
            ? attendanceColor(raw as number, !!metrics)
            : "text-foreground";

        return (
          <StaggerItem key={c.key}>
            <Card className="border-border/50 bg-card shadow-sm hover:border-primary/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    {c.label}
                  </p>
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="size-4 text-primary" />
                  </div>
                </div>
                <p className={`font-heading text-4xl tracking-wider ${valueClass}`}>
                  {display}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{c.subtitle}</p>
              </CardContent>
            </Card>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
