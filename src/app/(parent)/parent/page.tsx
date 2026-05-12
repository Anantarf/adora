"use client";

import { useState, useMemo } from "react";
import { Loader2, User, FileText, Activity, ClipboardCheck } from "lucide-react";
import { useFamily, usePlayerAttendance, type FamilyPlayer } from "@/hooks/use-family";
import { usePlayerStats } from "@/hooks/use-player-stats";
import type { MetricsJson } from "@/types/dashboard";
import type { AttendanceStatus } from "@/types/dashboard";
import { FLAT_METRIC_DEFS, flattenMetrics, overallScore, averageScore } from "@/lib/metrics";
import { GradeBadge } from "@/components/features/dashboard/GradeBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ATTENDANCE_STATUS_STYLE as STATUS_STYLE } from "@/lib/constants/badge-configs";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { getEventConfig } from "@/lib/config/events";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";

// ─── Page ─────────────────────────────────────────────
export default function ParentDashboard() {
  const { data: children, isLoading: familyLoading } = useFamily();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const effectiveChildId = useMemo(() => {
    const validIds = children?.map((c) => c.id) ?? [];
    if (selectedChildId && validIds.includes(selectedChildId)) return selectedChildId;
    return validIds[0] ?? null;
  }, [children, selectedChildId]);

  const { data: stats, isLoading: statsLoading } = usePlayerStats(effectiveChildId);
  const { data: attendances, isLoading: attendanceLoading } = usePlayerAttendance(effectiveChildId);

  // Radar dari latest stat — 11 aspek individual
  const radarData = useMemo(() => {
    if (!stats?.length) return [];
    const m = stats[0].metricsJson as MetricsJson;
    return FLAT_METRIC_DEFS.map((def) => ({
      subject: def.shortLabel,
      A: def.getValue(m),
      fullMark: def.max,
    }));
  }, [stats]);

  // Line chart — perkembangan overall score per periode
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

  const handleDownloadPDF = () => {
    if (!effectiveChildId) return;
    window.open(`/api/report/pdf?playerId=${effectiveChildId}`, "_blank");
  };

  if (familyLoading) {
    return (
      <div className="flex w-full items-center justify-center p-20 gap-3 text-primary font-semibold">
        <Loader2 className="animate-spin size-6" /> Memverifikasi Profil Keluarga...
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

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border pb-8">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl md:text-4xl text-foreground uppercase tracking-tight">Pantauan Pemain</h1>
          <p className="text-muted-foreground text-sm font-medium">Laporan evaluasi performa individual anak Anda.</p>
        </div>

        {children.length > 1 ? (
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <span className="text-micro text-muted-foreground/70 ml-1">Pilih Profil Anak</span>
            <Select value={effectiveChildId || undefined} onValueChange={setSelectedChildId}>
              <SelectTrigger className="w-full md:w-72 h-11 border-border bg-card font-semibold text-foreground">
                <SelectValue placeholder="Pilih Profil...">{effectiveChildId && children?.find((c) => c.id === effectiveChildId)?.name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {children?.map((child: FamilyPlayer) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name} • {child.group?.name || "Tanpa Kelompok"}
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
        <div className="flex w-full items-center justify-center p-20 gap-3 text-primary font-semibold">
          <Loader2 className="animate-spin size-6" /> Memuat Data Rapor {activeChild.name}...
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
          {/* Skor Terkini — 11 aspek flat */}
          {latestMetrics && (
            <Card className="border-border/50 bg-card overflow-hidden shadow-sm">
              <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-heading uppercase tracking-wide text-primary">Nilai Terkini</CardTitle>
                    <CardDescription className="text-xs">{latestStat?.period?.name ?? (latestStat ? new Date(latestStat.date).toLocaleDateString("id-ID", { month: "long", year: "numeric" }) : "")}</CardDescription>
                  </div>
                  <GradeBadge score={averageScore(latestMetrics)} variant="full" />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {flatItems.map((item) => (
                    <div key={item.key} className="rounded-lg bg-muted/30 border border-border/40 p-3 text-center flex flex-col justify-center min-h-[80px]">
                      <p className="text-micro text-muted-foreground leading-tight mb-1">{item.label}</p>
                      <p className="text-2xl font-bold tabular-nums text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Radar Chart — 11 aspek */}
          <Card className="border-border/50 bg-card overflow-hidden shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
              <CardTitle className="text-lg font-heading uppercase tracking-wide text-primary">Komposisi Kemampuan</CardTitle>
              <CardDescription className="text-xs">Perbandingan skor antar aspek teknik dasar.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={280} minWidth={0} minHeight={0}>
                <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                  <PolarGrid stroke="var(--muted-foreground)" strokeOpacity={0.2} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--muted-foreground)", fontSize: 9, fontWeight: 700 }} />
                  <Radar name="Skor" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.35} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--card-foreground)", fontSize: "12px", fontWeight: "bold" }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Line Chart — Perkembangan per Periode */}
          {progressionData.length > 1 && (
            <Card className="border-border/50 bg-card overflow-hidden shadow-sm lg:col-span-2">
              <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
                <CardTitle className="text-lg font-heading uppercase tracking-wide text-primary">Grafik Perkembangan</CardTitle>
                <CardDescription className="text-xs">Total skor keseluruhan per periode evaluasi.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 h-72">
                <ResponsiveContainer width="100%" height={250} minWidth={0} minHeight={0}>
                  <LineChart data={progressionData} margin={{ top: 5, right: 15, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--muted-foreground)" strokeOpacity={0.1} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontWeight: 600 }} tickLine={false} axisLine={false} dy={10} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--card-foreground)" }} itemStyle={{ fontSize: "12px", fontWeight: "bold" }} />
                    <Line type="monotone" name="Total Skor" dataKey="Overall" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "var(--background)" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Rekap Kehadiran */}
          <Card className="border-border/50 bg-card overflow-hidden shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="size-5 text-primary" />
                <div>
                  <CardTitle className="text-lg font-heading uppercase tracking-wide text-primary">Rekap Kehadiran</CardTitle>
                  <CardDescription className="text-xs">Riwayat kehadiran {activeChild.name} dalam 50 agenda terakhir.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {attendanceLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-primary font-bold text-xs uppercase tracking-widest">
                  <Loader2 className="size-4 animate-spin" /> Memuat data kehadiran...
                </div>
              ) : !attendances?.length ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                  <ClipboardCheck className="size-8 text-muted-foreground/30 mb-1" />
                  <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Belum ada data kehadiran</p>
                  <p className="text-xs text-muted-foreground/75">Data kehadiran akan muncul setelah pelatih mengisi presensi agenda.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {/* Summary strip */}
                  <div className="flex flex-wrap gap-3 items-center">
                    {(["HADIR", "IZIN", "SAKIT", "ALPA"] as AttendanceStatus[]).map((s) => (
                      <div key={s} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${STATUS_STYLE[s].badge}`}>
                        <span className="text-micro">{STATUS_STYLE[s].label}</span>
                        <span className="text-sm font-black tabular-nums">{attendanceSummary?.counts[s] ?? 0}</span>
                      </div>
                    ))}
                    <div className="ml-auto flex items-center gap-2 px-4 py-1.5 rounded-lg border border-primary/20 bg-primary/5">
                      <span className="text-micro text-muted-foreground">Tingkat Kehadiran</span>
                      <span className={`text-sm font-black tabular-nums ${(attendanceSummary?.rate ?? 0) >= 75 ? "text-emerald-500" : (attendanceSummary?.rate ?? 0) >= 50 ? "text-amber-500" : "text-destructive"}`}>
                        {attendanceSummary?.rate ?? 0}%
                      </span>
                    </div>
                  </div>

                  {/* Record list */}
                  <div className="flex flex-col gap-1.5">
                    <p className="text-micro text-muted-foreground/50 px-1 mb-1">10 Agenda Terakhir</p>
                    {attendances.slice(0, 10).map((a) => {
                      const eventLabel = a.event ? getEventConfig(a.event.type).label : "Agenda";
                      const eventTitle = a.event?.title ?? eventLabel;
                      return (
                        <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 transition-colors">
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-foreground truncate">{eventTitle}</span>
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{format(new Date(a.date), "EEEE, dd MMM yyyy", { locale: idLocale })}</span>
                          </div>
                          <span className={`shrink-0 text-micro px-2.5 py-1 rounded-lg border ${STATUS_STYLE[a.status as AttendanceStatus].badge}`}>{STATUS_STYLE[a.status as AttendanceStatus].label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Catatan Pelatih + PDF */}
          <Card className="border-border/50 bg-card overflow-hidden shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div>
                  <CardTitle className="text-lg font-heading uppercase tracking-wide text-primary">Catatan Pelatih</CardTitle>
                  <CardDescription className="text-xs">Evaluasi tekstual dari rapor terakhir.</CardDescription>
                </div>
                <Button size="sm" className="h-9 px-4 uppercase font-bold tracking-widest text-[10px] shrink-0" onClick={handleDownloadPDF}>
                  <FileText className="mr-2 size-3" /> Unduh Rapor PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative p-6 bg-primary/5 rounded-xl border border-primary/10">
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
