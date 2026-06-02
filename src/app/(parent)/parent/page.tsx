"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Activity, FileText, Loader2, User } from "lucide-react";
import { toast } from "sonner";

import { ParentAttendanceSummary } from "./components/ParentAttendanceSummary";
import { GradeBadge } from "@/components/features/dashboard/GradeBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlayerCertificates } from "@/hooks/use-certificates";
import { useFamily, usePlayerAttendance, type FamilyPlayer } from "@/hooks/use-family";
import { usePlayerStats } from "@/hooks/use-player-stats";
import { useReportSettings } from "@/hooks/use-settings";
import { FLAT_METRIC_DEFS, averageScore, flattenMetrics, overallScore } from "@/lib/metrics";
import type { AttendanceStatus, MetricsJson } from "@/types/dashboard";

const ParentRadarChart = dynamic(
  () => import("./components/ParentRadarChart").then((mod) => mod.ParentRadarChart),
  {
    ssr: false,
    loading: () => (
      <Card className="flex min-h-80 flex-col items-center justify-center gap-4 border-border/50 bg-card p-6">
        <Skeleton className="h-5 w-40 self-start bg-muted/50" />
        <Skeleton className="size-56 rounded-full bg-muted/40" />
      </Card>
    ),
  },
);

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

export default function ParentDashboard() {
  const { data: children, isLoading: familyLoading } = useFamily();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

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
  const { data: reportSettings } = useReportSettings();

  const radarData = useMemo(() => {
    if (!stats?.length) {
      return [];
    }

    const metrics = stats[0].metricsJson as MetricsJson;
    return FLAT_METRIC_DEFS.map((definition) => ({
      subject: definition.shortLabel,
      A: definition.getValue(metrics),
      fullMark: definition.max,
    }));
  }, [stats]);

  const progressionData = useMemo(() => {
    if (!stats?.length) {
      return [];
    }

    return [...stats].reverse().map((stat) => ({
      name:
        stat.period?.name ??
        new Date(stat.date).toLocaleDateString("id-ID", {
          month: "short",
          year: "2-digit",
        }),
      Overall: overallScore(stat.metricsJson as MetricsJson),
    }));
  }, [stats]);

  const attendanceSummary = useMemo(() => {
    if (!attendances?.length) {
      return null;
    }

    const counts = attendances.reduce(
      (summary, attendance) => {
        summary[attendance.status as AttendanceStatus] += 1;
        return summary;
      },
      { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 } as Record<AttendanceStatus, number>,
    );

    const total = attendances.length;
    const rate = Math.round((counts.HADIR / total) * 100);
    return { counts, total, rate };
  }, [attendances]);

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
          Belum Ada Profil Terhubung
        </h2>
        <p className="max-w-md text-sm font-medium leading-relaxed text-muted-foreground">
          Akun ini belum terhubung dengan profil pemain.
        </p>
        <p className="max-w-md text-sm font-medium leading-relaxed text-muted-foreground">
          Hubungi admin untuk menghubungkan akun dengan putra atau putri Anda.
        </p>
      </div>
    );
  }

  const activeChild =
    children.find((child: FamilyPlayer) => child.id === effectiveChildId) || children[0];
  const latestStat = stats?.[0];
  const latestMetrics = latestStat?.metricsJson as MetricsJson | undefined;
  const flatItems = latestMetrics ? flattenMetrics(latestMetrics) : [];
  const currentPeriodLabel =
    latestStat?.period?.name ??
    (latestStat
      ? new Date(latestStat.date).toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric",
        })
      : "Periode Evaluasi");

  const handleDownloadPDF = async () => {
    if (!latestMetrics) {
      return;
    }

    setIsPdfLoading(true);
    try {
      const { generateRaporPDF } = await import("@/lib/generate-rapor-pdf");

      await generateRaporPDF({
        playerName: activeChild.name,
        groupName: activeChild.group?.name || "Tanpa Kelompok",
        schoolOrigin: activeChild.schoolOrigin,
        periodName: currentPeriodLabel,
        metrics: latestMetrics,
        attendanceRate: attendanceSummary?.rate ?? null,
        certificates: certificates?.map((certificate) => ({
          title: certificate.title,
          uploadedAt: certificate.uploadedAt,
        })),
        assets: {
          headerUrl: reportSettings?.rapor_header_url ?? undefined,
          ceoSignUrl: reportSettings?.rapor_ceo_sign_url ?? undefined,
          coachSignUrl: reportSettings?.rapor_coach_sign_url ?? undefined,
          stampUrl: reportSettings?.rapor_stamp_url ?? undefined,
        },
        signers: {
          coachName: reportSettings?.rapor_coach_name ?? undefined,
          ceoName: reportSettings?.rapor_ceo_name ?? undefined,
        },
      });
    } catch (error) {
      console.error("[PARENT_REPORT_DOWNLOAD_ERROR]", error);
      toast.error("Gagal membuat rapor PDF. Coba lagi.");
    } finally {
      setIsPdfLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 md:gap-8">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-center md:pb-8">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl uppercase tracking-widest text-foreground md:text-3xl">
            Pantauan Pemain
          </h1>
          <p className="text-sm text-muted-foreground">
            Lihat ringkasan perkembangan, kehadiran, dan rapor terbaru anak Anda.
          </p>
        </div>

        {children.length > 1 ? (
          <div className="flex w-full flex-col gap-2 md:w-auto">
            <span className="ml-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Pilih Anak
            </span>
            <Select value={effectiveChildId || undefined} onValueChange={setSelectedChildId}>
              <SelectTrigger className="h-11 w-full border-border bg-card font-semibold text-foreground md:w-72">
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
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Profil Aktif
            </span>
            <div className="flex h-11 items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4">
              <span className="font-semibold text-foreground">{activeChild.name}</span>
              <span className="rounded-full bg-primary/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                {activeChild.group?.name || "Tanpa Kelompok"}
              </span>
            </div>
          </div>
        )}
      </div>

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

          <Card className="flex min-h-80 flex-col items-center justify-center gap-4 border-border/50 bg-card p-6">
            <Skeleton className="h-5 w-40 self-start bg-muted/50" />
            <Skeleton className="size-56 rounded-full bg-muted/40" />
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
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground/50">
            <Activity className="size-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-heading uppercase text-foreground">
              Belum Ada Evaluasi
            </h3>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              Pelatih belum mengunggah nilai terbaru untuk{" "}
              <span className="font-semibold text-foreground">{activeChild.name}</span>.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
          {latestMetrics ? (
            <Card className="overflow-hidden border-border/50 bg-card shadow-sm">
              <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-heading uppercase tracking-wide text-primary">
                      Ringkasan Nilai
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {currentPeriodLabel}
                    </CardDescription>
                  </div>
                  <GradeBadge score={averageScore(latestMetrics)} variant="full" />
                </div>
              </CardHeader>
              <CardContent className="p-3 md:p-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {flatItems.map((item) => (
                    <div
                      key={item.key}
                      className="flex min-h-18 flex-col justify-center rounded-lg border border-border/40 bg-muted/30 p-2.5 text-center md:min-h-20 md:p-3"
                    >
                      <p className="mb-1 text-xs leading-tight text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="text-xl font-bold tabular-nums text-foreground md:text-2xl">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <ParentRadarChart data={radarData} />

          <ParentProgressionChart data={progressionData} />

          <ParentAttendanceSummary
            attendanceSummary={attendanceSummary}
            attendances={attendances}
            attendanceLoading={attendanceLoading}
            activeChildName={activeChild.name}
          />

          <Card className="overflow-hidden border-border/50 bg-card shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-heading uppercase tracking-wide text-primary">
                    Catatan Pelatih
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Ringkasan evaluasi dari rapor terbaru.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  className="h-10 w-full shrink-0 px-4 text-[10px] font-bold uppercase tracking-widest sm:w-auto"
                  onClick={handleDownloadPDF}
                  disabled={isPdfLoading || !latestMetrics}
                >
                  {isPdfLoading ? (
                    <Loader2 className="mr-2 size-3 animate-spin" />
                  ) : (
                    <FileText className="mr-2 size-3" />
                  )}
                  Unduh Rapor PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 md:p-5">
                <p className="text-sm leading-relaxed text-foreground/85">
                  {latestMetrics?.notes ||
                    "Belum ada catatan khusus pada evaluasi terbaru."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
