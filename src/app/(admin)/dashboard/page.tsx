"use client";

import { useSession } from "next-auth/react";
import { FadeIn } from "@/components/animations/fade-in";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { MetricCards } from "@/components/features/dashboard/MetricCards";
import { RecentRegistrations } from "@/components/features/dashboard/RecentRegistrations";
import { UpcomingAgenda } from "@/components/features/dashboard/UpcomingAgenda";
import { AtRiskPlayers } from "@/components/features/dashboard/AtRiskPlayers";
import { formatFullDate, getJakartaToday } from "@/lib/date-utils";

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const { data: metrics, isLoading } = useDashboardMetrics();

  const displayName = (session?.user?.username || "ADMIN").toUpperCase();

  const todayLabel = formatFullDate(getJakartaToday());

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      {/* Greeting */}
      <FadeIn direction="up">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border/50 pb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Selamat Datang,
            </p>
            <h1 className="font-heading text-4xl text-foreground tracking-widest uppercase">
              {displayName} 👋
            </h1>
            <p className="text-muted-foreground text-sm font-medium tracking-wide mt-1">
              Pantau kondisi klub secara menyeluruh dari halaman ini.
            </p>
          </div>
          <p className="text-sm font-semibold text-muted-foreground/60 shrink-0">{todayLabel}</p>
        </div>
      </FadeIn>

      {/* Metric Cards */}
      <FadeIn direction="none" delay={0.05}>
        <MetricCards metrics={metrics} isLoading={isLoading} />
      </FadeIn>

      {/* At-Risk Players Alert */}
      {(isLoading || (metrics?.atRiskPlayers && metrics.atRiskPlayers.length > 0)) && (
        <FadeIn direction="up" delay={0.07}>
          <AtRiskPlayers metrics={metrics} isLoading={isLoading} />
        </FadeIn>
      )}

      {/* Registrations + Agenda */}
      <FadeIn direction="up" delay={0.1}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
          <div className="xl:col-span-2 h-full">
            <RecentRegistrations
              registrations={metrics?.recentRegistrations ?? []}
              isLoading={isLoading}
            />
          </div>
          <div className="xl:col-span-1 h-full">
            <UpcomingAgenda />
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
