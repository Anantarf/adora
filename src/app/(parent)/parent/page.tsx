"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2, User, FileText, Activity } from "lucide-react";
import { useFamily } from "@/hooks/use-family";
import { usePlayerStats } from "@/hooks/use-player-stats";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from "recharts";

export default function ParentDashboard() {
  const { data: children, isLoading: familyLoading } = useFamily();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // Auto-select the first child if none is selected yet
  useEffect(() => {
    if (children && children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const { data: stats, isLoading: statsLoading } = usePlayerStats(selectedChildId);
  
  // Transform data for Recharts (Radar Chart -> Latest Stat)
  const radarData = useMemo(() => {
    if (!stats || stats.length === 0) return [];
    
    // Ambil data evaluasi paling baru
    const latest = (stats[stats.length - 1] as any).metricsJson;
    return [
      { subject: "Shooting", A: latest.shooting, fullMark: 100 },
      { subject: "Dribbling", A: latest.dribbling, fullMark: 100 },
      { subject: "Passing", A: latest.passing, fullMark: 100 },
      { subject: "Stamina", A: latest.stamina, fullMark: 100 },
      { subject: "Attitude", A: latest.attitude, fullMark: 100 },
    ];
  }, [stats]);

  // Transform data for Recharts (Line Chart -> Monthly Progression)
  const progressionData = useMemo(() => {
    if (!stats || stats.length === 0) return [];
    
    return stats.map((stat: any) => ({
      name: new Date(stat.date).toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
      Overall: (
        (stat.metricsJson.shooting + 
         stat.metricsJson.dribbling + 
         stat.metricsJson.passing + 
         stat.metricsJson.stamina + 
         stat.metricsJson.attitude) / 5
      ).toFixed(1),
      Stamina: stat.metricsJson.stamina
    }));
  }, [stats]);

  // Handler: Invoke Edge Function for PDF Generation
  const handleDownloadPDF = () => {
    if (!selectedChildId) return;
    // Opens printable report in new tab — user can Ctrl+P to save as PDF
    window.open(`/api/report/pdf?playerId=${selectedChildId}`, "_blank");
  };

  if (familyLoading) {
    return (
      <div className="flex w-full items-center justify-center p-20 gap-3 text-muted-foreground font-semibold">
        <Loader2 className="animate-spin size-6" /> Otentikasi Profil Keluarga...
      </div>
    );
  }

  if (!children || children.length === 0) {
    return (
      <Card className="border-border/50 bg-card p-10 text-center max-w-lg mx-auto mt-20">
        <div className="flex justify-center mb-4 text-muted-foreground opacity-50"><User className="size-12" /></div>
        <CardTitle className="mb-2 text-secondary">Akses Terkunci</CardTitle>
        <CardDescription>Halo, Akun ada belum tertambat dengan nama atlet manapun di *Database* Pelatih. Silakan hubungi Administrator untuk dihubungkan dengan putra/putri Anda.</CardDescription>
      </Card>
    );  
  }

  const activeChild = children?.find((c: any) => c.id === selectedChildId) || children?.[0];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Header & Family Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="font-heading text-4xl text-secondary tracking-wide uppercase">Pantauan Atlet</h1>
          <p className="text-muted-foreground text-sm font-medium">Laporan transparansi evaluasi kinerja spesifik anak Anda.</p>
        </div>

        {/* Family Mapping Dropdown */}
        {children.length > 1 && (
          <div className="flex flex-col gap-1 w-full md:w-auto">
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">Pilih Profil Anak</span>
            <Select value={selectedChildId || undefined} onValueChange={setSelectedChildId}>
              <SelectTrigger className="w-full md:w-[260px] h-12 border-primary/20 bg-primary/5 font-semibold text-secondary focus-visible:ring-primary/40">
                <SelectValue placeholder="Pilih Profil..." />
              </SelectTrigger>
              <SelectContent>
                {children?.map((child: any) => (
                  <SelectItem key={child.id} value={child.id}>{child.name} • <span className="text-xs font-normal opacity-70 border px-1.5 py-0.5 rounded ml-1 bg-secondary/10">{child.group?.name || "Tanpa Kelas"}</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* 2. Loading State */}
      {statsLoading ? (
         <div className="flex w-full items-center justify-center p-20 gap-3 text-primary font-semibold">
           <Loader2 className="animate-spin size-6" /> Mengunduh Basis Data Performa {activeChild.name}...
         </div>
      ) : (
        <>
          {/* Main Visual Dashboard */}
          {(!stats || stats.length === 0) ? (
            <div className="p-8 border border-border/50 rounded-xl bg-card text-center flex flex-col items-center gap-2">
              <Activity className="size-8 text-muted-foreground opacity-50" />
              <h3 className="font-bold text-secondary">Belum Ada Evaluasi</h3>
              <p className="text-sm text-muted-foreground">Pelatih belum mengunggah nilai rapor satupun untuk {activeChild.name}. Tunggu masa akhir bulan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
              
              {/* Radar Chart (Kompabilitas / Skillset) */}
              <Card className="border-border/50 bg-card overflow-hidden shadow-sm">
                <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-heading uppercase tracking-wide text-secondary">Komposisi Skill Terakhir</CardTitle>
                      <CardDescription className="text-xs">Dimensi teknik motorik menurut pelatih.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 h-[320px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                      <PolarGrid stroke="hsl(var(--muted-foreground)/0.2)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }} />
                      <Radar name="Skor" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", fontSize: "12px", fontWeight: "bold", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              {/* Line Chart (Tren Ketahanan Tubuh / Akumulasi) */}
              <Card className="border-border/50 bg-card overflow-hidden shadow-sm">
                <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-heading uppercase tracking-wide text-secondary">Tren Progresi Historis</CardTitle>
                      <CardDescription className="text-xs">Peningkatan Stamina vs Rata-Rata Umum (Per Bulan).</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                    <LineChart data={progressionData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }} tickLine={false} axisLine={false} dy={10} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                        itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
                      />
                      <Line type="monotone" name="Rata-Rata Keseluruhan" dataKey="Overall" stroke="hsl(var(--secondary))" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'white' }} activeDot={{ r: 6 }} />
                      <Line type="monotone" name="Stamina Otot" dataKey="Stamina" stroke="hsl(var(--primary))" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Rapor & Evaluasi Teks Card */}
              <Card className="border-border/50 bg-card overflow-hidden shadow-sm lg:col-span-2">
                <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
                  <div className="flex justify-between items-center">
                     <div>
                       <CardTitle className="text-lg font-heading uppercase tracking-wide text-secondary">Laporan Analisis Pelatih</CardTitle>
                       <CardDescription className="text-xs">Catatan tekstual untuk bulan evaluasi terakhir.</CardDescription>
                     </div>
                     <Button 
                        size="sm" 
                        className="h-9 px-4 uppercase font-bold tracking-widest text-[10px] shadow-lg shadow-primary/20"
                        onClick={handleDownloadPDF}
                      >
                       <FileText className="mr-2 size-3" />
                       Rekap PDF Rapor
                     </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="relative p-6 bg-secondary/5 rounded-xl border border-secondary/10">
                     <span className="absolute -top-3 -left-2 text-6xl text-primary/20 font-serif leading-none">"</span>
                     <p className="text-sm font-medium leading-relaxed text-secondary/80 relative z-10 pl-4 border-l-2 border-primary">
                       {(stats[stats.length - 1] as any).metricsJson.notes || "Pelatih tidak menitipkan pesan khusus/catatan tambahan pada evaluasi bulan ini. Anak berkembang dengan sangat baik di latihan regular."}
                     </p>
                  </div>
                </CardContent>
              </Card>
              
            </div>
          )}
        </>
      )}

    </div>
  );
}
