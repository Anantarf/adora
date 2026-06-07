"use client";

import { AtRiskPlayers } from "@/components/features/dashboard/AtRiskPlayers";
import { MetricCards } from "@/components/features/dashboard/MetricCards";
import { RecentRegistrations } from "@/components/features/dashboard/RecentRegistrations";
import { UpcomingAgenda } from "@/components/features/dashboard/UpcomingAgenda";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { formatFullDate, getJakartaToday } from "@/lib/date-utils";

function getSummaryText(
  recentRegistrationCount: number,
  atRiskPlayerCount: number,
  isLoading: boolean,
) {
  if (isLoading) {
    return "Memuat ringkasan pemain, pendaftar, agenda, dan progres penilaian.";
  }

  if (recentRegistrationCount === 0 && atRiskPlayerCount === 0) {
    return "Tidak ada pendaftar yang menunggu proses dan belum ada peringatan absensi hari ini.";
  }

  if (recentRegistrationCount === 0) {
    return `${atRiskPlayerCount} pemain perlu follow-up absensi dalam 30 hari terakhir.`;
  }

  if (atRiskPlayerCount === 0) {
    return `${recentRegistrationCount} pendaftar baru menunggu tindak lanjut admin.`;
  }

  return `${recentRegistrationCount} pendaftar menunggu proses dan ${atRiskPlayerCount} pemain perlu follow-up absensi.`;
}

export default function AdminDashboardPage() {
  const { data: metrics, isLoading, isError, refetch } = useDashboardMetrics();

  const todayLabel = formatFullDate(getJakartaToday());
  const recentRegistrationCount = metrics?.recentRegistrations.length ?? 0;
  const atRiskPlayerCount = metrics?.atRiskPlayers.length ?? 0;
  const summaryText = getSummaryText(recentRegistrationCount, atRiskPlayerCount, isLoading);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border/50 pb-5 md:flex-row md:items-end md:pb-6">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
            Dashboard Utama
          </p>
          <h2 className="font-heading text-2xl tracking-[0.08em] text-foreground md:text-[2rem]">
            Ringkasan Operasional Hari Ini
          </h2>
          <p className="max-w-3xl text-sm text-muted-foreground">{summaryText}</p>
        </div>
        <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground md:text-sm">
          {todayLabel}
        </div>
      </div>

      {isError ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <span>Gagal memuat ringkasan dashboard. Coba muat ulang.</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-lg border border-destructive/40 px-3 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/10"
          >
            Muat Ulang
          </button>
        </div>
      ) : null}

      {isLoading || atRiskPlayerCount > 0 ? (
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
