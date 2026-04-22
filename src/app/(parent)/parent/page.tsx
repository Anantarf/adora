"use client";

import { useState, useMemo } from "react";
import { Loader2, User, FileText, Activity } from "lucide-react";
import { useFamily, type FamilyPlayer } from "@/hooks/use-family";
import { usePlayerStats } from "@/hooks/use-player-stats";
import type { MetricsJson } from "@/types/dashboard";
import { dribbleTotal, passingTotal, overallScore, averageScore } from "@/lib/metrics";
import { GradeBadge } from "@/components/features/dashboard/GradeBadge";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line,
} from "recharts";

// ─── Page ─────────────────────────────────────────────
export default function ParentDashboard() {
  const { data: children, isLoading: familyLoading } = useFamily();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const effectiveChildId = selectedChildId ?? children?.[0]?.id ?? null;

  const { data: stats, isLoading: statsLoading } = usePlayerStats(effectiveChildId);

  // Radar dari latest stat — 4 aspek utama
  const radarData = useMemo(() => {
    if (!stats?.length) return [];
    const m = stats[0].metricsJson as MetricsJson;
    return [
      { subject: "Dribble", A: dribbleTotal(m.dribble), fullMark: 120 },
      { subject: "Passing", A: passingTotal(m.passing), fullMark: 40 },
      { subject: "Lay Up", A: m.layUp, fullMark: 20 },
      { subject: "Shooting", A: m.shooting, fullMark: 20 },
    ];
  }, [stats]);

  // Line chart — perkembangan overall score per periode
  const progressionData = useMemo(() => {
    if (!stats?.length) return [];
    return [...stats].reverse().map(s => ({
      name: s.period?.name ?? new Date(s.date).toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
      Overall: overallScore(s.metricsJson as MetricsJson),
      Dribble: dribbleTotal((s.metricsJson as MetricsJson).dribble),
    }));
  }, [stats]);

  const handleDownloadPDF = () => {
    if (!effectiveChildId) return;
    window.open(`/api/report/pdf?playerId=${effectiveChildId}`, "_blank");
  };

  if (familyLoading) {
    return (
      <div className="flex w-full items-center justify-center p-20 gap-3 text-muted-foreground font-semibold">
        <Loader2 className="animate-spin size-6" /> Memverifikasi Profil Keluarga...
      </div>
    );
  }

  if (!children || children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="size-20 rounded-full bg-secondary/5 flex items-center justify-center mb-8 text-primary/60 border border-primary/20 shadow-sm">
          <User className="size-10" />
        </div>
        <h2 className="text-3xl font-heading text-foreground uppercase mb-4">Akses Terbatas</h2>
        <p className="text-muted-foreground text-sm max-w-md leading-relaxed font-medium">
          Akun ini belum terhubung dengan profil siswa. <br className="hidden md:block" />
          Hubungi <span className="text-primary font-bold uppercase tracking-wider">Admin</span> untuk menghubungkan akun dengan putra/putri Anda.
        </p>
      </div>
    );
  }

  const activeChild = children?.find((c: FamilyPlayer) => c.id === effectiveChildId) || children?.[0];
  const latestStat = stats?.[0];
  const latestMetrics = latestStat?.metricsJson as MetricsJson | undefined;

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border pb-8">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl md:text-4xl text-foreground uppercase tracking-tight">Pantauan Pemain</h1>
          <p className="text-muted-foreground text-sm font-medium">Laporan evaluasi performa individual anak Anda.</p>
        </div>

        {children.length > 1 ? (
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground ml-1">Pilih Profil Anak</span>
            <Select value={effectiveChildId || undefined} onValueChange={setSelectedChildId}>
              <SelectTrigger className="w-full md:w-72 h-11 border-border bg-card font-semibold text-foreground">
                <SelectValue placeholder="Pilih Profil..." />
              </SelectTrigger>
              <SelectContent>
                {children?.map((child: FamilyPlayer) => (
                  <SelectItem key={child.id} value={child.id}>{child.name} • {child.group?.name || "Tanpa Kelas"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex flex-col gap-2 items-start md:items-end">
            <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Profil Aktif</span>
            <div className="h-11 flex items-center px-6 rounded-lg border border-primary/20 bg-primary/5 gap-3">
              <span className="font-bold text-foreground">{activeChild.name}</span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-primary/20 text-primary uppercase tracking-widest">{activeChild.group?.name || "Tanpa Kelas"}</span>
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
          {/* Skor Terkini per Aspek */}
          {latestMetrics && (
            <Card className="border-border/50 bg-card overflow-hidden shadow-sm">
              <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-heading uppercase tracking-wide text-secondary">Nilai Terkini</CardTitle>
                    <CardDescription className="text-xs">{latestStat?.period?.name ?? (latestStat ? new Date(latestStat.date).toLocaleDateString("id-ID", { month: "long", year: "numeric" }) : "")}</CardDescription>
                  </div>
                  <GradeBadge score={averageScore(latestMetrics)} variant="full" />
                </div>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-2 gap-3">
                {/* Dribble breakdown */}
                <div className="col-span-2 rounded-lg bg-primary/5 border border-primary/15 p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Dribble</span>
                    <span className="text-lg font-bold text-primary tabular-nums">{dribbleTotal(latestMetrics.dribble)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      ["In & Out", latestMetrics.dribble.inAndOut],
                      ["Crossover", latestMetrics.dribble.crossover],
                      ["V Kiri", latestMetrics.dribble.vLeft],
                      ["V Kanan", latestMetrics.dribble.vRight],
                      ["BTL Kiri", latestMetrics.dribble.betweenLegsLeft],
                      ["BTL Kanan", latestMetrics.dribble.betweenLegsRight],
                    ].map(([label, val]) => (
                      <div key={String(label)} className="text-center bg-background/60 rounded p-1.5">
                        <p className="text-[9px] text-muted-foreground">{label}</p>
                        <p className="text-sm font-bold tabular-nums">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Passing breakdown */}
                <div className="col-span-2 rounded-lg bg-secondary/5 border border-secondary/15 p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Passing</span>
                    <span className="text-lg font-bold text-secondary tabular-nums">{passingTotal(latestMetrics.passing)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      ["Chest Pass", latestMetrics.passing.chestPass],
                      ["Bounce Pass", latestMetrics.passing.bouncePass],
                      ["Overhead", latestMetrics.passing.overheadPass],
                    ].map(([label, val]) => (
                      <div key={String(label)} className="text-center bg-background/60 rounded p-1.5">
                        <p className="text-[9px] text-muted-foreground">{label}</p>
                        <p className="text-sm font-bold tabular-nums">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lay Up */}
                <div className="rounded-lg bg-muted/30 border border-border/40 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lay Up</p>
                  <p className="text-2xl font-bold tabular-nums text-foreground mt-1">{latestMetrics.layUp}</p>
                </div>

                {/* Shooting */}
                <div className="rounded-lg bg-muted/30 border border-border/40 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Shooting</p>
                  <p className="text-2xl font-bold tabular-nums text-foreground mt-1">{latestMetrics.shooting}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Radar Chart */}
          <Card className="border-border/50 bg-card overflow-hidden shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
              <CardTitle className="text-lg font-heading uppercase tracking-wide text-secondary">Komposisi Kemampuan</CardTitle>
              <CardDescription className="text-xs">Perbandingan skor antar aspek teknik dasar.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                  <PolarGrid stroke="var(--muted-foreground)" strokeOpacity={0.2} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontWeight: 700 }} />
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
                <CardTitle className="text-lg font-heading uppercase tracking-wide text-secondary">Grafik Perkembangan</CardTitle>
                <CardDescription className="text-xs">Total skor keseluruhan dan dribble per periode evaluasi.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 h-72">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={progressionData} margin={{ top: 5, right: 15, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--muted-foreground)" strokeOpacity={0.1} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontWeight: 600 }} tickLine={false} axisLine={false} dy={10} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--card-foreground)" }} itemStyle={{ fontSize: "12px", fontWeight: "bold" }} />
                    <Line type="monotone" name="Total Skor" dataKey="Overall" stroke="var(--secondary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "var(--background)" }} activeDot={{ r: 6 }} />
                    <Line type="monotone" name="Dribble" dataKey="Dribble" stroke="var(--primary)" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Catatan Pelatih + PDF */}
          <Card className="border-border/50 bg-card overflow-hidden shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-heading uppercase tracking-wide text-secondary">Catatan Pelatih</CardTitle>
                  <CardDescription className="text-xs">Evaluasi tekstual dari rapor terakhir.</CardDescription>
                </div>
                <Button size="sm" className="h-9 px-4 uppercase font-bold tracking-widest text-[10px]" onClick={handleDownloadPDF}>
                  <FileText className="mr-2 size-3" /> Unduh Rapor PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative p-6 bg-secondary/5 rounded-xl border border-secondary/10">
                <span className="absolute -top-3 -left-2 text-6xl text-primary/20 font-serif leading-none">&quot;</span>
                <p className="text-sm font-medium leading-relaxed text-secondary/80 relative z-10 pl-4 border-l-2 border-primary">
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
