"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Activity, AlertCircle, RefreshCw, User } from "lucide-react";

import { AdminPageHeader } from "@/components/features/admin-page-header";
import { AdminStatePanel } from "@/components/features/admin-state-panel";
import { useParentPanel } from "@/components/features/parent-panel-context";

import { ParentAttendanceSummary } from "./components/ParentAttendanceSummary";
import { ParentPlayerHero } from "./components/ParentPlayerHero";
import { GradeBadge } from "@/components/features/dashboard/GradeBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlayerCertificates } from "@/hooks/use-certificates";
import { useFamily, usePlayerAttendance, type FamilyPlayer } from "@/hooks/use-family";
import { useReleasedReportArchives } from "@/hooks/use-report-archives";
import { usePlayerStats, type PlayerStatRecord } from "@/hooks/use-player-stats";
import { averageScore, flattenMetrics } from "@/lib/metrics";
import { getEvaluationSummary, isMetricsJsonV2 } from "@/lib/evaluation-rules";
import type { AttendanceStatus, MetricsJson } from "@/types/dashboard";

// Tipe untuk data awal yang di-prefetch di server. Diserialisasi via props server->client,
// jadi Date/string ambigu. Konsumen (hook) menerima `Date | string` dan normalisasi sendiri.
export type ParentDashboardInitialData = {
  family: FamilyPlayer[];
  effectiveChildId: string | null;
  stats: PlayerStatRecord[];
  attendances: Awaited<ReturnType<typeof import("@/actions/family").getPlayerAttendanceAction>>;
  certificates: Awaited<ReturnType<typeof import("@/actions/certificates").getPlayerCertificatesAction>>;
  releasedArchives: Awaited<
    ReturnType<typeof import("@/actions/report-archives").getReleasedReportArchivesForPlayerAction>
  >;
};

// Chart Recharts hanya dimuat saat panel riwayat dibuka; tidak ikut bundle awal.
const ParentProgressionChart = dynamic(
  () =>
    import("./components/ParentProgressionChart").then(
      (mod) => mod.ParentProgressionChart,
    ),
  {
    ssr: false,
    loading: () => (
      <Card className="min-h-80 border-border/50 bg-card p-6">
        <Skeleton className="h-7 w-44 rounded-lg bg-muted/25" />
        <Skeleton className="mt-5 h-56 w-full rounded-xl bg-muted/15" />
      </Card>
    ),
  },
);

// Kartu dokumen dimuat lazily karena hanya muncul di tab "Rapor & Sertifikat".
const ParentReportArchivesCard = dynamic(
  () => import("./components/ParentReportArchivesCard").then((mod) => mod.ParentReportArchivesCard),
  {
    ssr: false,
    loading: () => (
      <Card className="min-h-64 border-border/50 bg-card p-6">
        <Skeleton className="h-6 w-40 rounded-lg bg-muted/25" />
        <Skeleton className="mt-4 h-40 w-full rounded-xl bg-muted/15" />
      </Card>
    ),
  },
);

const ParentCoachCard = dynamic(
  () => import("./components/ParentCoachCard").then((mod) => mod.ParentCoachCard),
  {
    ssr: false,
    loading: () => (
      <Card className="min-h-64 border-border/50 bg-card p-6">
        <Skeleton className="h-6 w-32 rounded-lg bg-muted/25" />
        <Skeleton className="mt-4 h-40 w-full rounded-xl bg-muted/15" />
      </Card>
    ),
  },
);

const ParentCertificatesCard = dynamic(
  () => import("./components/ParentCertificatesCard").then((mod) => mod.ParentCertificatesCard),
  {
    ssr: false,
    loading: () => (
      <Card className="min-h-64 border-border/50 bg-card p-6">
        <Skeleton className="h-6 w-32 rounded-lg bg-muted/25" />
        <Skeleton className="mt-4 h-40 w-full rounded-xl bg-muted/15" />
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

function parentErrorMessage(label: string) {
  return `${label} belum bisa dimuat. Coba muat ulang atau hubungi admin ADORA jika masih terjadi.`;
}

function ParentDataIssueBanner({
  issues,
  onRetry,
}: {
  issues: string[];
  onRetry: () => void;
}) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-400" />
        <div className="min-w-0">
          <p className="font-semibold">Sebagian data belum tampil.</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {issues.join(" ")}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-amber-500/30 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-amber-500/15"
      >
        <RefreshCw className="size-3.5" />
        Muat Ulang
      </button>
    </div>
  );
}

type Props = { initialData: ParentDashboardInitialData };

export function ParentDashboardClient({ initialData }: Props) {
  const { activePanel } = useParentPanel();

  // State dipindah ke atas agar bisa dipakai sebagai playerId di hooks di bawah.
  const [selectedChildId, setSelectedChildId] = useState<string | null>(initialData.effectiveChildId);

  // Timestamp stabil: menandai initialData dari SSR sebagai fresh sehingga tidak langsung stale
  // dan tidak memicu refetch segera setelah mount (tanpa ini RQ menganggap data lahir di epoch 0).
  // eslint-disable-next-line react-hooks/purity -- one-time capture, not rendered, safe for SSR/hydration
  const serverDataTimestamp = useMemo(() => Date.now(), []);

  // Hanya kirim initialData untuk anak yang sudah di-prefetch di server (anak pertama).
  // Kalau user ganti anak, query fetch dari awal tanpa initialData.
  const isInitialChild = selectedChildId === initialData.effectiveChildId;

  const familyQuery = useFamily({
    initialData: initialData.family,
    initialDataUpdatedAt: serverDataTimestamp,
  });
  const statsQuery = usePlayerStats(selectedChildId, {
    initialData: isInitialChild ? initialData.stats : undefined,
    initialDataUpdatedAt: isInitialChild ? serverDataTimestamp : undefined,
  });
  const attendanceQuery = usePlayerAttendance(selectedChildId, {
    initialData: isInitialChild ? initialData.attendances : undefined,
    initialDataUpdatedAt: isInitialChild ? serverDataTimestamp : undefined,
  });
  const certificatesQuery = usePlayerCertificates(selectedChildId, {
    initialData: isInitialChild ? initialData.certificates : undefined,
    initialDataUpdatedAt: isInitialChild ? serverDataTimestamp : undefined,
  });
  const archivesQuery = useReleasedReportArchives(selectedChildId, {
    initialData: isInitialChild ? initialData.releasedArchives : undefined,
    initialDataUpdatedAt: isInitialChild ? serverDataTimestamp : undefined,
  });

  const children = familyQuery.data;
  const familyError = familyQuery.isError;
  const familyLoading = familyQuery.isPending;
  const refetchFamily = familyQuery.refetch;

  const stats = statsQuery.data;
  const statsError = statsQuery.isError;
  const statsLoading = statsQuery.isPending;
  const refetchStats = statsQuery.refetch;

  const attendances = attendanceQuery.data;
  const attendanceError = attendanceQuery.isError;
  const attendanceLoading = attendanceQuery.isPending;
  const refetchAttendance = attendanceQuery.refetch;

  const certificates = certificatesQuery.data;
  const certificatesError = certificatesQuery.isError;
  const refetchCertificates = certificatesQuery.refetch;

  const releasedArchives = archivesQuery.data;
  const archivesError = archivesQuery.isError;
  const refetchArchives = archivesQuery.refetch;

  // Pilih anak aktif: preferensi user kalau masih valid, fallback ke initialData.effectiveChildId.
  const effectiveChildId = (() => {
    const validIds = children?.map((child) => child.id) ?? [];
    if (selectedChildId && validIds.includes(selectedChildId)) {
      return selectedChildId;
    }
    if (initialData.effectiveChildId && validIds.includes(initialData.effectiveChildId)) {
      return initialData.effectiveChildId;
    }
    return validIds[0] ?? null;
  })();

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
      <div className="flex w-full flex-col gap-4 md:gap-5">
        <Skeleton className="h-24 w-full rounded-xl bg-muted/20" />
        <Skeleton className="h-32 w-full rounded-xl bg-muted/15" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl bg-muted/20" />
          ))}
        </div>
      </div>
    );
  }

  if (!children || children.length === 0) {
    return (
      <AdminStatePanel
        icon={User}
        title="Profil anak belum terhubung"
        description="Akun Anda belum terhubung ke profil anak. Hubungi tim ADORA untuk menghubungkannya ke profil putra atau putri Anda."
        className="min-h-[60vh]"
      />
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
  const queryIssues = [
    familyError ? parentErrorMessage("Data keluarga") : null,
    statsError ? parentErrorMessage("Evaluasi") : null,
    attendanceError ? parentErrorMessage("Presensi") : null,
    archivesError ? parentErrorMessage("Arsip rapor") : null,
    certificatesError ? parentErrorMessage("Sertifikat") : null,
  ].filter(Boolean) as string[];
  const retryParentData = () => {
    void refetchFamily();
    void refetchStats();
    void refetchAttendance();
    void refetchArchives();
    void refetchCertificates();
  };
  return (
    <div className="flex w-full flex-col gap-4 md:gap-5">
      <AdminPageHeader
        eyebrow="Portal Orang Tua"
        title={activePanel === "dokumen" ? "Rapor & Sertifikat" : activePanel === "riwayat" ? "Riwayat Performa" : "Ringkasan Pemain"}
        description="Perkembangan, dokumen, dan riwayat performa anak dalam satu portal."
        actions={
          children.length > 1 ? (
          <div className="flex w-full flex-col gap-2 md:w-auto md:items-end">
            <span className="ml-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Pilih Anak
            </span>
            <Select value={effectiveChildId ?? ""} onValueChange={setSelectedChildId}>
              <SelectTrigger className="h-10 w-full rounded-lg border-border/70 bg-card px-4 font-semibold text-foreground md:w-72">
                <SelectValue placeholder="Pilih anak">
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
            <div className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3.5 py-2">
              <span className="font-semibold text-foreground">{activeChild.name}</span>
              <span className="rounded-lg bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                {activeChild.group?.name || "Tanpa Kelompok"}
              </span>
            </div>
          </div>
        )
        }
      />

      <ParentDataIssueBanner issues={queryIssues} onRetry={retryParentData} />

      <ParentPlayerHero
        player={activeChild}
        latestScore={latestOverallScore}
        periodLabel={latestStat ? currentPeriodLabel : null}
      />

      {statsLoading && activePanel !== "dokumen" ? (
        <div className="grid gap-3 rounded-xl border border-border/50 bg-card p-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl bg-muted/20" />
          ))}
        </div>
      ) : !stats?.length && activePanel !== "dokumen" ? (
        <AdminStatePanel
          icon={Activity}
          title="Evaluasi belum tersedia"
          description={`Hasil evaluasi terbaru untuk ${activeChild.name} akan tampil di sini setelah penilaian berikutnya tersedia.`}
          className="bg-card/50"
        />
      ) : activePanel === "ringkasan" ? (
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
                              Bobot {formatWeight(getEvaluationSummary(latestMetrics).attendance!.weight)}% - {getEvaluationSummary(latestMetrics).attendance!.counts.HADIR} / {getEvaluationSummary(latestMetrics).attendance!.totalSessions} kegiatan dihadiri
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

        </div>
      ) : activePanel === "dokumen" ? (
        <div id="dokumen" className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-3">
          <ParentReportArchivesCard archives={releasedArchives} player={activeChild} />
          <ParentCoachCard player={activeChild} />
          <ParentCertificatesCard certificates={certificates} playerName={activeChild.name} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <ParentProgressionChart data={progressionData} />
          <ParentAttendanceSummary
            attendanceSummary={attendanceSummary}
            attendances={periodAttendance}
            attendanceLoading={attendanceLoading}
            activeChildName={activeChild.name}
            periodLabel={latestStat ? currentPeriodLabel : null}
          />
        </div>
      )}
    </div>
  );
}


