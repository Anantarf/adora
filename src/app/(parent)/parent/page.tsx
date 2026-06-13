"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Activity, Loader2, User } from "lucide-react";

import { ParentAttendanceSummary } from "./components/ParentAttendanceSummary";
import { ParentCertificatesCard } from "./components/ParentCertificatesCard";
import { ParentCoachCard } from "./components/ParentCoachCard";
import { ParentPlayerHero } from "./components/ParentPlayerHero";
import { GradeBadge } from "@/components/features/dashboard/GradeBadge";
import { ParentReportArchivesCard } from "./components/ParentReportArchivesCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlayerCertificates } from "@/hooks/use-certificates";
import { useFamily, usePlayerAttendance, type FamilyPlayer } from "@/hooks/use-family";
import { useReleasedReportArchives } from "@/hooks/use-report-archives";
import { useReportSettings } from "@/hooks/use-settings";
import { usePlayerStats } from "@/hooks/use-player-stats";
import { averageScore, flattenMetrics } from "@/lib/metrics";
import { getEvaluationSummary, isMetricsJsonV2 } from "@/lib/evaluation-rules";
import type { AttendanceStatus, MetricsJson } from "@/types/dashboard";

const ParentProgressionChart = dynamic(
  () =>
    import("./components/ParentProgressionChart").then(
      (mod) => mod.ParentProgressionChart,
    ),
  {
    ssr: false,
    loading: () => (
      <Card className="flex min-h-80 flex-col gap-4 border-border/50 bg-card p-6 lg:col-span-2">
        <Skeleton className="h-5 w-48 bg-muted/50" />
        <Skeleton className="h-44 w-full rounded bg-muted/30" />
      </Card>
    ),
  },
);

function formatWeight(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.?0+$/, "");
}

function formatShortPeriodLabel(period?: {
  name: string;
  startDate: Date | string;
  endDate: Date | string;
} | null) {
  if (!period?.startDate || !period.endDate) {
    return period?.name;
  }

  const startDate = new Date(period.startDate);
  const endDate = new Date(period.endDate);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return period.name;
  }

  const startMonth = startDate.toLocaleDateString("id-ID", { month: "short" });
  const endMonth = endDate.toLocaleDateString("id-ID", { month: "short" });
  const year = endDate.toLocaleDateString("id-ID", { year: "2-digit" });

  if (startMonth === endMonth) {
    return `${startMonth} '${year}`;
  }

  return `${startMonth}-${endMonth}`;
}

export default function ParentDashboard() {
  const { data: children, isLoading: familyLoading } = useFamily();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const effectiveChildId = useMemo(() => {
    const validIds = children?.map((child) => child.id) ?? [];
    if (selectedChildId && validIds.includes(selectedChildId)) {
      return selectedChildId;
    }
    return validIds[0] ?? null;
  }, [children, selectedChildId]);

  const { data: stats, isLoading: statsLoading } = usePlayerStats(effectiveChildId);
  const { data: attendances, isLoading: attendanceLoading } =
    usePlayerAttendance(effectiveChildId);
  const { data: certificates } = usePlayerCertificates(effectiveChildId);
  const { data: releasedArchives } = useReleasedReportArchives(effectiveChildId);
  const { data: reportSettings } = useReportSettings();

  const progressionData = useMemo(() => {
    if (!stats?.length) {
      return [];
    }

    return [...stats].reverse().map((stat) => {
      const metrics = stat.metricsJson;
      const score = isMetricsJsonV2(metrics)
        ? getEvaluationSummary(metrics).overallScore
        : averageScore(metrics as MetricsJson);

      return {
        name:
          stat.period?.name ??
          new Date(stat.date).toLocaleDateString("id-ID", {
            month: "short",
            year: "2-digit",
          }),
        shortName:
          formatShortPeriodLabel(stat.period) ??
          new Date(stat.date).toLocaleDateString("id-ID", {
            month: "short",
            year: "2-digit",
          }),
        Overall: Math.max(0, Math.min(100, Math.round(score))),
      };
    });
  }, [stats]);

  const latestStat = stats?.[0];
  const latestMetrics = latestStat?.metricsJson as MetricsJson | undefined;
  const periodStartDate = latestStat?.period?.startDate;
  const periodEndDate = latestStat?.period?.endDate;
  const periodAttendance = useMemo(() => {
    if (!attendances?.length) {
      return [];
    }

    if (!periodStartDate || !periodEndDate) {
      return attendances;
    }

    const startDate = new Date(periodStartDate);
    const endDate = new Date(periodEndDate);
    endDate.setHours(23, 59, 59, 999);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return attendances;
    }

    return attendances.filter((attendance) => {
      const attendanceDate = new Date(attendance.date);
      return attendanceDate >= startDate && attendanceDate <= endDate;
    });
  }, [attendances, periodEndDate, periodStartDate]);

  const attendanceSummary = useMemo(() => {
    if (!periodAttendance.length) {
      return null;
    }

    const counts = periodAttendance.reduce(
      (summary, attendance) => {
        summary[attendance.status as AttendanceStatus] += 1;
        return summary;
      },
      { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 } as Record<AttendanceStatus, number>,
    );

    const total = periodAttendance.length;
    const rate = Math.round((counts.HADIR / total) * 100);
    return { counts, total, rate };
  }, [periodAttendance]);

  if (familyLoading) {
    return (
      <div className="flex w-full flex-col gap-6 animate-pulse p-4 md:gap-8">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-center md:pb-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-muted/60" />
            <Skeleton className="h-4 w-96 bg-muted/40" />
          </div>
          <Skeleton className="h-11 w-48 rounded-lg bg-muted/50" />
        </div>
        <div className="flex items-center justify-center gap-3 py-20 font-semibold text-primary/70">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span>Memuat data keluarga...</span>
        </div>
      </div>
    );
  }

  if (!children || children.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-8 flex size-20 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary/60 shadow-sm">
          <User className="size-10" />
        </div>
        <h2 className="mb-4 text-xl font-heading uppercase text-foreground">
          Profil Anak Belum Terhubung
        </h2>
        <p className="max-w-md text-sm font-medium leading-relaxed text-muted-foreground">
          Akun ini belum terhubung ke profil anak.
        </p>
        <p className="max-w-md text-sm font-medium leading-relaxed text-muted-foreground">
          Hubungi tim ADORA agar akun ini dapat dihubungkan ke profil putra atau putri Anda.
        </p>
      </div>
    );
  }

  const activeChild =
    children.find((child: FamilyPlayer) => child.id === effectiveChildId) || children[0];
  const latestOverallScore = latestMetrics
    ? Math.max(
        0,
        Math.min(
          100,
          Math.round(
            isMetricsJsonV2(latestMetrics)
              ? getEvaluationSummary(latestMetrics).overallScore
              : averageScore(latestMetrics),
          ),
        ),
      )
    : null;
  const currentPeriodLabel =
    latestStat?.period?.name ??
    (latestStat
      ? new Date(latestStat.date).toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric",
        })
      : "Periode Evaluasi");

  return (
    <div className="flex w-full flex-col gap-5 md:gap-6">
      <div className="flex flex-col items-start justify-between gap-3 border-b border-border/70 pb-4 md:flex-row md:items-end md:pb-5">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
            Portal Orang Tua
          </p>
          <h1 className="font-heading text-2xl uppercase tracking-[0.16em] text-foreground md:text-[2.35rem]">
            Pantauan Pemain
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Pantau perkembangan, kehadiran, dan hasil evaluasi terbaru anak Anda di satu tempat.
          </p>
        </div>

        {children.length > 1 ? (
          <div className="flex w-full flex-col gap-2 md:w-auto md:items-end">
            <span className="ml-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Pilih Anak
            </span>
            <Select value={effectiveChildId ?? ""} onValueChange={setSelectedChildId}>
              <SelectTrigger className="h-10 w-full rounded-full border-border/70 bg-card px-4 font-semibold text-foreground md:w-72">
                <SelectValue placeholder="Pilih profil">
                  {effectiveChildId
                    ? children.find((child) => child.id === effectiveChildId)?.name
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {children.map((child: FamilyPlayer) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name} - {child.group?.name || "Tanpa Kelompok"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex flex-col gap-2 md:items-end">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Profil Aktif
            </span>
            <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-2">
              <span className="font-semibold text-foreground">{activeChild.name}</span>
              <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                {activeChild.group?.name || "Tanpa Kelompok"}
              </span>
            </div>
          </div>
        )}
      </div>

      <ParentPlayerHero
        player={activeChild}
        latestScore={latestOverallScore}
        periodLabel={latestStat ? currentPeriodLabel : null}
      />

      {statsLoading ? (
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden border-border/50 bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/10 pb-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32 bg-muted/60" />
                <Skeleton className="h-3.5 w-24 bg-muted/40" />
              </div>
              <Skeleton className="h-12 w-12 rounded bg-muted/50" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                  <div
                    key={index}
                    className="flex min-h-20 flex-col justify-center gap-2 rounded-lg border border-border/40 bg-muted/30 p-3 text-center"
                  >
                    <Skeleton className="mx-auto h-3 w-16 bg-muted/40" />
                    <Skeleton className="mx-auto h-6 w-10 bg-muted/50" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="flex min-h-80 flex-col gap-4 border-border/50 bg-card p-6">
            <Skeleton className="h-5 w-48 bg-muted/50" />
            <Skeleton className="h-44 w-full rounded bg-muted/30" />
          </Card>

          <Card className="flex min-h-80 flex-col gap-4 border-border/50 bg-card p-6">
            <Skeleton className="h-5 w-40 bg-muted/50" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-full rounded-lg bg-muted/40" />
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((index) => (
                  <Skeleton key={index} className="h-16 rounded-lg bg-muted/30" />
                ))}
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden border-border/50 bg-card shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
              <Skeleton className="h-5 w-40 bg-muted/50" />
            </CardHeader>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full rounded-xl bg-muted/30" />
            </CardContent>
          </Card>
        </div>
      ) : !stats?.length ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground/50">
            <Activity className="size-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-heading uppercase text-foreground">
              Evaluasi Belum Tersedia
            </h3>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              Hasil evaluasi terbaru untuk{" "}
              <span className="font-semibold text-foreground">{activeChild.name}</span> akan
              tampil di sini setelah penilaian berikutnya tersedia.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid w-full grid-cols-1 gap-6">
            {latestMetrics ? (
              <Card className="overflow-hidden border-border/50 bg-card shadow-sm">
                <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg font-heading uppercase tracking-wide text-primary">
                        Evaluasi Terbaru
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Ringkasan nilai dan catatan pelatih untuk {currentPeriodLabel}.
                      </CardDescription>
                    </div>
                    <GradeBadge score={latestOverallScore ?? averageScore(latestMetrics)} variant="full" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-3 md:p-4">
                  {isMetricsJsonV2(latestMetrics) ? (
                    // V2: tampilkan ringkasan per kategori
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {getEvaluationSummary(latestMetrics).categorySummaries.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/25 px-3.5 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{category.label}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              Bobot {formatWeight(category.weight)}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold tabular-nums text-primary">
                              {category.averageScore}
                            </p>
                            <p className="text-[10px] text-muted-foreground">/100</p>
                          </div>
                        </div>
                      ))}
                      {getEvaluationSummary(latestMetrics).attendance ? (
                        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">
                              {getEvaluationSummary(latestMetrics).attendance!.label}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              Bobot {formatWeight(getEvaluationSummary(latestMetrics).attendance!.weight)}% • {getEvaluationSummary(latestMetrics).attendance!.counts.HADIR} / {getEvaluationSummary(latestMetrics).attendance!.totalSessions} kegiatan dihadiri
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold tabular-nums text-primary">
                              {getEvaluationSummary(latestMetrics).attendance!.score}
                            </p>
                            <p className="text-[10px] text-muted-foreground">/100</p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    // V1 legacy: tampilkan flat grid semua aspek
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {flattenMetrics(latestMetrics).map((item) => (
                        <div
                          key={item.key}
                          className="flex min-h-16 flex-col justify-center rounded-lg border border-border/40 bg-muted/25 p-2.5 text-center"
                        >
                          <p className="mb-1 text-xs leading-tight text-muted-foreground">
                            {item.label}
                          </p>
                          <p className="text-xl font-bold tabular-nums text-foreground">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                      Catatan Pelatih
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                      {latestMetrics.notes ||
                        "Belum ada catatan khusus dari pelatih pada evaluasi terbaru."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>

          <ParentAttendanceSummary
            attendanceSummary={attendanceSummary}
            attendances={periodAttendance}
            attendanceLoading={attendanceLoading}
            activeChildName={activeChild.name}
            periodLabel={latestStat ? currentPeriodLabel : null}
          />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <ParentReportArchivesCard
              archives={releasedArchives}
              player={activeChild}
              reportSettings={reportSettings}
              stats={stats}
            />
            <ParentCoachCard player={activeChild} />
            <ParentCertificatesCard certificates={certificates} playerName={activeChild.name} />
          </div>

          <ParentProgressionChart data={progressionData} />
        </div>
      )}
    </div>
  );
}
