"use client";

import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import { Loader2, User, FileText, Activity } from "lucide-react";
import { useFamily, usePlayerAttendance, type FamilyPlayer } from "@/hooks/use-family";
import { usePlayerCertificates } from "@/hooks/use-certificates";
import { usePlayerStats } from "@/hooks/use-player-stats";
import { useReportSettings } from "@/hooks/use-settings";
import type { MetricsJson } from "@/types/dashboard";
import type { AttendanceStatus } from "@/types/dashboard";
import { FLAT_METRIC_DEFS, flattenMetrics, overallScore, averageScore } from "@/lib/metrics";
import { GradeBadge } from "@/components/features/dashboard/GradeBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ParentAttendanceSummary } from "./components/ParentAttendanceSummary";
import { toast } from "sonner";

const ParentRadarChart = dynamic(
  () => import("./components/ParentRadarChart").then((mod) => mod.ParentRadarChart),
  {
    ssr: false,
    loading: () => (
      <Card className="border-border/50 bg-card p-6 flex min-h-80 flex-col items-center justify-center gap-4">
        <Skeleton className="h-5 w-40 bg-muted/50 self-start" />
        <Skeleton className="size-56 rounded-full bg-muted/40" />
      </Card>
    ),
  },
);

const ParentProgressionChart = dynamic(
  () => import("./components/ParentProgressionChart").then((mod) => mod.ParentProgressionChart),
  {
    ssr: false,
    loading: () => (
      <Card className="border-border/50 bg-card p-6 flex min-h-80 flex-col gap-4 lg:col-span-2">
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
    const validIds = children?.map((c) => c.id) ?? [];
    if (selectedChildId && validIds.includes(selectedChildId)) return selectedChildId;
    return validIds[0] ?? null;
  }, [children, selectedChildId]);

  const { data: stats, isLoading: statsLoading } = usePlayerStats(effectiveChildId);
  const { data: attendances, isLoading: attendanceLoading } = usePlayerAttendance(effectiveChildId);
  const { data: certificates } = usePlayerCertificates(effectiveChildId);
  const { data: reportSettings } = useReportSettings();

  // Radar dari latest stat - 11 aspek individual
  const radarData = useMemo(() => {
    if (!stats?.length) return [];
    const m = stats[0].metricsJson as MetricsJson;
    return FLAT_METRIC_DEFS.map((def) => ({
      subject: def.shortLabel,
      A: def.getValue(m),
      fullMark: def.max,
    }));
  }, [stats]);

  // Line chart - perkembangan overall score per periode
  const progressionData = useMemo(() => {
    if (!stats?.length) return [];
    return [...stats].reverse().map((s) => ({
      name: s.period?.name ?? new Date(s.date).toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
      Overall: overallScore(s.metricsJson as MetricsJson),
    }));
  }, [stats]);

  const attendanceSummary = useMemo(() => {
    if (!attendances?.length) return null;
    const counts = attendances.reduce(
      (acc, a) => {
        acc[a.status as AttendanceStatus] += 1;
        return acc;
      },
      { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 } as Record<AttendanceStatus, number>,
    );
    const total = attendances.length;
    const rate = Math.round((counts.HADIR / total) * 100);
    return { counts, total, rate };
  }, [attendances]);

  if (familyLoading) {
    return (
      <div className="flex flex-col gap-6 md:gap-8 w-full animate-pulse p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 border-b border-border pb-6 md:pb-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-muted/60" />
            <Skeleton className="h-4 w-96 bg-muted/40" />
          </div>
          <Skeleton className="h-11 w-48 bg-muted/50 rounded-lg" />
        </div>
        <div className="flex w-full items-center justify-center py-20 gap-3 text-primary/70 font-semibold">
          <Loader2 className="animate-spin size-6 text-primary" />
          <span>Memverifikasi Profil Keluarga...</span>
        </div>
      </div>
    );
  }

  if (!children || children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="size-20 rounded-full bg-primary/5 flex items-center justify-center mb-8 text-primary/60 border border-primary/20 shadow-sm">
          <User className="size-10" />
        </div>
        <h2 className="text-xl font-heading text-foreground uppercase mb-4">Belum Ada Profil Terhubung</h2>
        <p className="text-muted-foreground text-sm max-w-md leading-relaxed font-medium">Akun ini belum terhubung dengan profil pemain manapun.</p>
        <p className="text-muted-foreground text-sm max-w-md leading-relaxed font-medium">
          Hubungi <span className="text-primary font-bold uppercase tracking-wider">Admin</span> untuk menghubungkan akun dengan putra/putri Anda.
        </p>
      </div>
    );
  }

  const activeChild = children?.find((c: FamilyPlayer) => c.id === effectiveChildId) || children?.[0];
  const latestStat = stats?.[0];
  const latestMetrics = latestStat?.metricsJson as MetricsJson | undefined;
  const flatItems = latestMetrics ? flattenMetrics(latestMetrics) : [];
  const currentPeriodLabel = latestStat?.period?.name ?? (latestStat ? new Date(latestStat.date).toLocaleDateString("id-ID", { month: "long", year: "numeric" }) : "Periode Evaluasi");

  const handleDownloadPDF = async () => {
    if (!latestMetrics) return;

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
    <div className="flex flex-col gap-6 md:gap-8 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 border-b border-border pb-6 md:pb-8">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl md:text-4xl text-foreground uppercase tracking-tight">Pantauan Pemain</h1>
          <p className="text-muted-foreground text-sm font-medium">Laporan evaluasi performa individual anak Anda.</p>
        </div>

        {children.length > 1 ? (
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <span className="text-micro text-muted-foreground/70 ml-1">Pilih Profil Anak</span>
            <Select value={effectiveChildId || undefined} onValueChange={setSelectedChildId}>
              <SelectTrigger className="w-full md:w-72 h-11 min-h-11 border-border bg-card font-semibold text-foreground">
                <SelectValue placeholder="Pilih Profil...">{effectiveChildId && children?.find((c) => c.id === effectiveChildId)?.name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {children?.map((child: FamilyPlayer) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name} - {child.group?.name || "Tanpa Kelompok"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex flex-col gap-2 items-start md:items-end">
            <span className="text-micro text-muted-foreground/70">Profil Aktif</span>
            <div className="h-11 flex items-center px-6 rounded-lg border border-primary/20 bg-primary/5 gap-3">
              <span className="font-bold text-foreground">{activeChild.name}</span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-primary/20 text-primary uppercase tracking-widest">{activeChild.group?.name || "Tanpa Kelompok"}</span>
            </div>
          </div>
        )}
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full animate-pulse">
          {/* Skor Terkini Skeleton */}
          <Card className="border-border/50 bg-card overflow-hidden shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/10 pb-4 flex flex-row items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32 bg-muted/60" />
                <Skeleton className="h-3.5 w-24 bg-muted/40" />
              </div>
              <Skeleton className="h-12 w-12 rounded bg-muted/50" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="rounded-lg bg-muted/30 border border-border/40 p-3 text-center flex flex-col justify-center min-h-20 gap-2">
                    <Skeleton className="h-3 w-16 mx-auto bg-muted/40" />
                    <Skeleton className="h-6 w-10 mx-auto bg-muted/50" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Radar Chart Skeleton */}
          <Card className="border-border/50 bg-card p-6 flex flex-col items-center justify-center min-h-80 gap-4">
            <Skeleton className="h-5 w-40 bg-muted/50 self-start" />
            <Skeleton className="size-56 rounded-full bg-muted/40" />
          </Card>

          {/* Progression Chart Skeleton */}
          <Card className="border-border/50 bg-card p-6 flex flex-col gap-4 min-h-80">
            <Skeleton className="h-5 w-48 bg-muted/50" />
            <Skeleton className="h-44 w-full bg-muted/30 rounded" />
          </Card>

          {/* Attendance Summary Skeleton */}
          <Card className="border-border/50 bg-card p-6 flex flex-col gap-4 min-h-80">
            <Skeleton className="h-5 w-40 bg-muted/50" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-full bg-muted/40 rounded-lg" />
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 bg-muted/30 rounded-lg" />
                ))}
              </div>
            </div>
          </Card>

          {/* Coach Notes Skeleton */}
          <Card className="border-border/50 bg-card overflow-hidden shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
              <Skeleton className="h-5 w-40 bg-muted/50" />
            </CardHeader>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full bg-muted/30 rounded-xl" />
            </CardContent>
          </Card>
        </div>
      ) : !stats?.length ? (
        <div className="p-12 border border-dashed border-border rounded-2xl bg-card/50 text-center flex flex-col items-center gap-4">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground/50">
            <Activity className="size-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-heading font-bold text-foreground uppercase">Belum Ada Evaluasi</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Pelatih belum mengunggah nilai rapor terbaru untuk <span className="text-foreground font-semibold">{activeChild.name}</span>.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* Skor Terkini - 11 aspek flat */}
          {latestMetrics && (
            <Card className="border-border/50 bg-card overflow-hidden shadow-sm">
              <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-heading uppercase tracking-wide text-primary">Nilai Terkini</CardTitle>
                    <CardDescription className="text-xs">{currentPeriodLabel}</CardDescription>
                  </div>
                  <GradeBadge score={averageScore(latestMetrics)} variant="full" />
                </div>
              </CardHeader>
              <CardContent className="p-3 md:p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {flatItems.map((item) => (
                    <div key={item.key} className="rounded-lg bg-muted/30 border border-border/40 p-2.5 md:p-3 text-center flex flex-col justify-center min-h-18 md:min-h-20">
                      <p className="text-micro text-muted-foreground leading-tight mb-1">{item.label}</p>
                      <p className="text-xl md:text-2xl font-bold tabular-nums text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <ParentRadarChart data={radarData} />

          {/* Line Chart - Perkembangan per Periode */}
          <ParentProgressionChart data={progressionData} />

          {/* Rekap Kehadiran */}
          <ParentAttendanceSummary 
            attendanceSummary={attendanceSummary} 
            attendances={attendances} 
            attendanceLoading={attendanceLoading} 
            activeChildName={activeChild.name} 
          />

          {/* Catatan Pelatih + PDF */}
          <Card className="border-border/50 bg-card overflow-hidden shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div>
                  <CardTitle className="text-lg font-heading uppercase tracking-wide text-primary">Catatan Pelatih</CardTitle>
                  <CardDescription className="text-xs">Evaluasi tekstual dari rapor terakhir.</CardDescription>
                </div>
                <Button
                  size="sm"
                  className="h-10 px-4 w-full sm:w-auto uppercase font-bold tracking-widest text-[10px] shrink-0"
                  onClick={handleDownloadPDF}
                  disabled={isPdfLoading || !latestMetrics}
                >
                  {isPdfLoading ? <Loader2 className="mr-2 size-3 animate-spin" /> : <FileText className="mr-2 size-3" />}
                  Unduh Rapor PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="relative p-4 md:p-6 bg-primary/5 rounded-xl border border-primary/10">
                <span className="absolute -top-3 -left-2 text-6xl text-primary/20 font-serif leading-none">&quot;</span>
                <p className="text-sm font-medium leading-relaxed text-muted-foreground relative z-10 pl-4 border-l-2 border-primary">
                  {latestMetrics?.notes || "Pelatih tidak menitipkan catatan khusus pada evaluasi ini. Anak berkembang dengan baik di sesi latihan reguler."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}



