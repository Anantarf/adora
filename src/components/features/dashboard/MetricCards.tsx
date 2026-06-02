"use client";

import React from "react";
import { Users, Layers, TrendingUp, FileCheck } from "lucide-react";

import type { DashboardMetrics } from "@/actions/dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type MetricCard = {
  key: keyof DashboardMetrics;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  getDisplay: (metrics: DashboardMetrics) => string;
  getColorClass: (metrics: DashboardMetrics) => string;
};

const metricCards: MetricCard[] = [
  {
    key: "playerCount",
    label: "Pemain Aktif",
    subtitle: "Terdaftar di klub",
    icon: Users,
    getDisplay: (metrics) => String(metrics.playerCount),
    getColorClass: () => "text-foreground",
  },
  {
    key: "groupCount",
    label: "Kelompok Latihan",
    subtitle: "Kelompok berjalan",
    icon: Layers,
    getDisplay: (metrics) => String(metrics.groupCount),
    getColorClass: () => "text-foreground",
  },
  {
    key: "attendanceRate",
    label: "Kehadiran Latihan",
    subtitle: "Rata-rata 30 hari terakhir",
    icon: TrendingUp,
    getDisplay: (metrics) => `${metrics.attendanceRate}%`,
    getColorClass: (metrics) => {
      if (metrics.attendanceRate >= 80) {
        return "text-primary";
      }
      if (metrics.attendanceRate >= 50) {
        return "text-amber-500";
      }
      return "text-destructive";
    },
  },
  {
    key: "publishedStatsCount",
    label: "Progress Penilaian",
    subtitle: "Selesai / draft",
    icon: FileCheck,
    getDisplay: (metrics) =>
      `${metrics.publishedStatsCount} / ${metrics.draftStatsCount}`,
    getColorClass: (metrics) =>
      metrics.draftStatsCount > 0 ? "text-amber-500" : "text-foreground",
  },
];

interface MetricCardsProps {
  metrics: DashboardMetrics | undefined;
  isLoading: boolean;
}

export function MetricCards({ metrics, isLoading }: MetricCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 md:gap-4">
        {metricCards.map((card) => (
          <Card key={card.key} className="border-border/50 bg-card shadow-sm">
            <CardContent className="space-y-3 p-4 md:p-5">
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 md:gap-4">
      {metricCards.map((card) => {
        const Icon = card.icon;
        const display = metrics ? card.getDisplay(metrics) : "-";
        const valueClassName = metrics ? card.getColorClass(metrics) : "text-foreground";

        return (
          <Card
            key={card.key}
            className="border-border/50 bg-card shadow-sm transition-colors hover:border-primary/30"
          >
            <CardContent className="p-4 sm:p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.subtitle}</p>
                </div>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
              </div>
              <p className={`font-heading text-3xl leading-none tracking-[0.12em] ${valueClassName}`}>
                {display}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
