"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";

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


// Heading dirender inline (tanpa AdminPageHeader): kartu ringkasan berperan sebagai hero, jadi judul + chip + CTA digabung dalam section pertama.
export default function AdminDashboardPage() {
  const { data: metrics, isLoading, isError, refetch } = useDashboardMetrics();

  const todayLabel = formatFullDate(getJakartaToday());
  const recentRegistrationCount = metrics?.recentRegistrations.length ?? 0;
  const atRiskPlayerCount = metrics?.atRiskPlayers.length ?? 0;
  const summaryText = getSummaryText(recentRegistrationCount, atRiskPlayerCount, isLoading);
  const hasAttention = recentRegistrationCount > 0 || atRiskPlayerCount > 0;
  const readinessLabel = hasAttention ? "Perlu dicek" : "Operasional aman";
  const readinessClassName = hasAttention
    ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
    : "border-primary/25 bg-primary/10 text-primary";

  return (

    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 pb-10 md:gap-6">
      <section className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
        <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,480px)] lg:items-start">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                Dashboard Utama
              </span>
            </div>
            <div className="space-y-2">
              <h1 className="max-w-full text-balance break-words font-heading text-2xl leading-tight tracking-[0.03em] text-foreground sm:text-[1.9rem] md:text-[2.15rem] lg:tracking-[0.06em] xl:text-[2.35rem]">
                Ringkasan Operasional Hari Ini
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {summaryText}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className={`rounded-2xl border p-4 sm:col-span-2 ${readinessClassName}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">Status Operasional</p>
              <p className="mt-2 text-sm font-bold text-foreground">{readinessLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {hasAttention ? "Ada item yang perlu diproses admin hari ini." : "Tidak ada item prioritas saat ini."}
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/45 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Pendaftar</p>
              <p className="mt-2 font-heading text-2xl leading-none text-foreground">{isLoading ? "-" : recentRegistrationCount}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/45 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Follow-up</p>
              <p className={`mt-2 font-heading text-2xl leading-none ${atRiskPlayerCount > 0 ? "text-destructive" : "text-primary"}`}>
                {isLoading ? "-" : atRiskPlayerCount}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-border/50 bg-background/35 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center md:px-6">
          <span className="text-xs font-medium text-muted-foreground">{todayLabel}</span>
          <Link
            href="/dashboard/registrations"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
          >
            <UserPlus className="size-4" />
            Proses Pendaftar
          </Link>
        </div>
      </section>

      {isError ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <span>Gagal memuat ringkasan dashboard. Coba muat ulang.</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-destructive/40 text-destructive hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive"
          >
            Muat Ulang
          </Button>
        </div>
      ) : null}

      <MetricCards metrics={metrics} isLoading={isLoading} />

      {isLoading || atRiskPlayerCount > 0 ? (
        <AtRiskPlayers metrics={metrics} isLoading={isLoading} />
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentRegistrations
            registrations={metrics?.recentRegistrations ?? []}
            isLoading={isLoading}
            isError={isError}
          />
        </div>
        <div className="xl:col-span-1">
          <UpcomingAgenda />
        </div>
      </div>
    </div>
  );
}
