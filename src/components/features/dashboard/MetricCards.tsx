"use client";

import React from "react";
import { Users, Layers, TrendingUp, FileCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import type { DashboardMetrics } from "@/actions/dashboard";

type MetricCard = {
  key: keyof DashboardMetrics;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  getDisplay: (metrics: DashboardMetrics) => string;
  getColorClass: (metrics: DashboardMetrics) => string;
};

const METRIC_CARDS: MetricCard[] = [
  {
    key: "playerCount",
    label: "Pemain Aktif",
    subtitle: "Terdaftar di klub",
    icon: Users,
    getDisplay: (m) => String(m.playerCount),
    getColorClass: () => "text-foreground",
  },
  {
    key: "groupCount",
    label: "Kelompok Latihan",
    subtitle: "Kelompok berjalan",
    icon: Layers,
    getDisplay: (m) => String(m.groupCount),
    getColorClass: () => "text-foreground",
  },
  {
    key: "attendanceRate",
    label: "Kehadiran Latihan",
    subtitle: "Rata-rata 30 hari terakhir",
    icon: TrendingUp,
    getDisplay: (m) => `${m.attendanceRate}%`,
    getColorClass: (m) => {
      if (m.attendanceRate >= 80) return "text-primary";
      if (m.attendanceRate >= 50) return "text-yellow-500";
      return "text-destructive";
    },
  },
  {
    key: "publishedStatsCount",
    label: "Progress Evaluasi",
    subtitle: "Selesai / Draft",
    icon: FileCheck,
    getDisplay: (m) => `${m.publishedStatsCount} / ${m.draftStatsCount}`,
    getColorClass: (m) => (m.draftStatsCount > 0 ? "text-yellow-500" : "text-foreground"),
  },
];

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
        const display = metrics ? c.getDisplay(metrics) : "—";
        const valueClass = metrics ? c.getColorClass(metrics) : "text-foreground";

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
