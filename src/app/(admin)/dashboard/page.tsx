"use client";

import { useSession } from "next-auth/react";

import { AtRiskPlayers } from "@/components/features/dashboard/AtRiskPlayers";
import { MetricCards } from "@/components/features/dashboard/MetricCards";
import { RecentRegistrations } from "@/components/features/dashboard/RecentRegistrations";
import { UpcomingAgenda } from "@/components/features/dashboard/UpcomingAgenda";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { formatFullDate, getJakartaToday } from "@/lib/date-utils";

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const { data: metrics, isLoading, isError, refetch } = useDashboardMetrics();

  const displayName = session?.user?.username || "Admin";
  const todayLabel = formatFullDate(getJakartaToday());

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
      <div className="flex flex-col items-start justify-between gap-3 border-b border-border/50 pb-5 md:flex-row md:items-end md:pb-6">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Selamat datang, <span className="font-semibold text-foreground">{displayName}</span>.
          </p>
          <p className="text-sm text-muted-foreground">
            Lihat hal yang perlu ditindak, lalu lanjutkan pekerjaan dari sini.
          </p>
        </div>
        <p className="text-xs font-medium text-muted-foreground md:text-sm">{todayLabel}</p>
      </div>

      {isError ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <span>Gagal memuat ringkasan dashboard. Coba muat ulang.</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-lg border border-destructive/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-destructive hover:bg-destructive/10"
          >
            Muat Ulang
          </button>
        </div>
      ) : null}

      {isLoading || (metrics?.atRiskPlayers && metrics.atRiskPlayers.length > 0) ? (
        <AtRiskPlayers metrics={metrics} isLoading={isLoading} />
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentRegistrations
            registrations={metrics?.recentRegistrations ?? []}
            isLoading={isLoading}
          />
        </div>
        <div className="xl:col-span-1">
          <UpcomingAgenda />
        </div>
      </div>

      <MetricCards metrics={metrics} isLoading={isLoading} />
    </div>
  );
}
