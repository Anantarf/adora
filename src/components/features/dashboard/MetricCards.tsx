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
  tone: string;
  iconClassName: string;
  getDisplay: (metrics: DashboardMetrics) => string;
  getColorClass: (metrics: DashboardMetrics) => string;
  getHelper: (metrics: DashboardMetrics) => string;
};

const metricCards: MetricCard[] = [
  {
    key: "playerCount",
    label: "Pemain Aktif",
    subtitle: "Terdaftar di klub",
    icon: Users,
    tone: "from-primary/14 to-transparent",
    iconClassName: "bg-primary/10 text-primary",
    getDisplay: (metrics) => String(metrics.playerCount),
    getColorClass: () => "text-foreground",
    getHelper: () => "Basis data pemain aktif",
  },
  {
    key: "groupCount",
    label: "Kelompok Latihan",
    subtitle: "Kelompok berjalan",
    icon: Layers,
    tone: "from-sky-500/12 to-transparent",
    iconClassName: "bg-sky-500/10 text-sky-300",
    getDisplay: (metrics) => String(metrics.groupCount),
    getColorClass: () => "text-foreground",
    getHelper: () => "Struktur latihan berjalan",
  },
  {
    key: "attendanceRate",
    label: "Kehadiran Latihan",
    subtitle: "Rata-rata 30 hari terakhir",
    icon: TrendingUp,
    tone: "from-emerald-500/12 to-transparent",
    iconClassName: "bg-emerald-500/10 text-emerald-300",
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
    getHelper: (metrics) => metrics.attendanceRate >= 80 ? "Kondisi kehadiran sehat" : "Perlu pantau absensi",
  },
  {
    key: "publishedStatsCount",
    label: "Progress Penilaian",
    subtitle: "Selesai / draft",
    icon: FileCheck,
    tone: "from-amber-500/12 to-transparent",
    iconClassName: "bg-amber-500/10 text-amber-300",
    getDisplay: (metrics) =>
      `${metrics.publishedStatsCount} / ${metrics.draftStatsCount}`,
    getColorClass: (metrics) =>
      metrics.draftStatsCount > 0 ? "text-amber-500" : "text-foreground",
    getHelper: (metrics) => metrics.draftStatsCount > 0 ? "Ada rapor belum terbit" : "Tidak ada draft tertahan",
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
          <Card key={card.key} className="overflow-hidden border-border/50 bg-card shadow-sm">
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
        const helper = metrics ? card.getHelper(metrics) : card.subtitle;

        return (
          <Card
            key={card.key}
            className={`group overflow-hidden border-border/50 bg-card bg-gradient-to-br ${card.tone} shadow-sm transition-colors hover:border-primary/30`}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.subtitle}</p>
                </div>
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${card.iconClassName}`}>
                  <Icon className="size-4" />
                </div>
              </div>
              <p className={`font-heading text-3xl leading-none tracking-tight ${valueClassName}`}>
                {display}
              </p>
              <p className="mt-3 border-t border-border/40 pt-3 text-xs font-medium text-muted-foreground">
                {helper}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
