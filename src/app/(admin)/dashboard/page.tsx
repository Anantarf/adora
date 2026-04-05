"use client";

import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { useSchedule, type ScheduleEvent } from "@/hooks/use-schedule";
import { 
  CalendarDays, 
  ChevronRight, 
  Clock, 
  Loader2, 
  Cone, 
  Swords, 
  Trophy, 
  AlertCircle, 
  CheckSquare,
  type LucideIcon
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";

// Dynamic import for Heavy Calendar component
const CalendarView = dynamic(
  () => import("@/components/features/calendar-view").then((mod) => mod.CalendarView),
  { 
    ssr: false, 
    loading: () => (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground animate-pulse">Menyiapkan Kalender ADORA...</p>
      </div>
    ) 
  }
);

// ─── Konfigurasi Kategori Terpusat ─────────────────────────────────────────

type CategoryKey = "latihan" | "sparing" | "turnamen" | "event" | "default";

const CATEGORY_CONFIG: Record<CategoryKey, { color: string; icon: LucideIcon; label: string }> = {
  latihan:  { color: "#D4AF37", icon: Cone,         label: "Latihan"            },
  sparing:  { color: "#F97316", icon: Swords,       label: "Sparing"            },
  turnamen: { color: "#E11D48", icon: Trophy,        label: "Turnamen/Kejuaraan" },
  event:    { color: "#3B82F6", icon: AlertCircle,   label: "Event"              },
  default:  { color: "#8B5CF6", icon: CalendarDays,  label: "Agenda"             },
};

function getCategoryKey(type: string): CategoryKey {
  const t = type.toLowerCase();
  if (t.includes("latihan")) return "latihan";
  if (t.includes("sparing")) return "sparing";
  // "pertandingan" = nilai yang dikirim form untuk Kejuaraan/Match Day
  if (t.includes("turnamen") || t.includes("kejuaraan") || t.includes("tournament") || t.includes("pertandingan")) return "turnamen";
  // "evaluasi" = Ujian Evaluasi, "khusus" = Acara Ekstra, "event" = fallback
  if (t.includes("evaluasi") || t.includes("event") || t.includes("khusus")) return "event";
  return "default";
}

// Formatter dibuat di luar komponen — tidak re-instantiate setiap render
const DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "long",
});

// ─── Komponen Kartu Upcoming Event ──────────────────────────────────────────

function UpcomingEventCard({ ev, delay }: { ev: ScheduleEvent; delay: number }) {
  const key = getCategoryKey(ev.type);
  const cfg = CATEGORY_CONFIG[key];
  const Icon = cfg.icon;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const evDate = new Date(ev.date);
  evDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((evDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const countdownLabel =
    diffDays === 0 ? "Hari Ini" :
    diffDays === 1 ? "Besok" :
    `${diffDays} hari lagi`;

  return (
    <div
      className="group flex items-center gap-4 p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:bg-muted/20 transition-all duration-300 cursor-default animate-card-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" } as React.CSSProperties}
    >
      <div className="flex-shrink-0 flex items-center justify-center size-10 rounded-xl text-white shadow-lg transition-transform group-hover:scale-110 duration-300"
        style={{ backgroundColor: cfg.color, boxShadow: `0 4px 14px ${cfg.color}55` }}>
        <Icon className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground text-sm truncate">
          {ev.title}{ev.group ? ` · ${ev.group.name}` : ""}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <CalendarDays className="size-3 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground">{DATE_FORMATTER.format(evDate)}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
          style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}>
          {cfg.label}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium tracking-wide">
          <Clock className="size-2.5" />
          {countdownLabel}
        </span>
      </div>
      <ChevronRight className="size-4 text-border group-hover:text-primary transition-colors duration-300 flex-shrink-0" />
    </div>
  );
}

// ─── Dashboard Utama ────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const { data: scheduleData } = useSchedule();
  const [liveDate, setLiveDate] = useState("");

  useEffect(() => {
    setLiveDate(new Intl.DateTimeFormat("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    }).format(new Date()));
  }, []);

  const mappedEvents = useMemo(() => scheduleData?.map((ev) => {
    const cfg = CATEGORY_CONFIG[getCategoryKey(ev.type)];
    return {
      id: ev.id,
      title: ev.group ? `${ev.title} (${ev.group.name})` : ev.title,
      start: ev.date,
      allDay: true,
      backgroundColor: cfg.color,
      borderColor: "transparent",
    };
  }) || [], [scheduleData]);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (scheduleData || [])
      .filter((ev) => new Date(ev.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [scheduleData]);

  const legends = useMemo(() => 
    (Object.entries(CATEGORY_CONFIG) as [CategoryKey, typeof CATEGORY_CONFIG[CategoryKey]][])
    .filter(([k]) => k !== "default")
    .map(([, cfg]) => cfg), []);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-6">
      {/* Legend Bar + Live Date */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-1 gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          {legends.map((leg, idx) => (
            <div key={idx} className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-full border border-border shadow-sm">
              <div className="p-1 rounded-full text-white shadow-sm" style={{ backgroundColor: leg.color }}>
                <leg.icon className="size-2.5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{leg.label}</span>
            </div>
          ))}
        </div>
        {liveDate && (
          <div className="flex items-center bg-muted/60 px-3 py-1.5 rounded-full border border-border/50 shadow-sm">
            <span className="text-[11px] md:text-sm font-bold text-foreground tracking-tight">{liveDate}</span>
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        
        {/* Main Section (Left) - Calendar */}
        <div className="flex-1 w-full min-w-0">
          <div className="glass-card p-6 rounded-[2.5rem] border-border/40 shadow-sm relative overflow-hidden group h-full">
            <div className="flex items-center gap-2 mb-6">
              <CheckSquare className="size-4 text-primary" />
              <h2 className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Statistik Kehadiran & Jadwal</h2>
            </div>
            
            <div className="w-full">
               <div className="overflow-x-auto">
                 <div className="min-w-[640px]">
                    <CalendarView events={mappedEvents} />
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Sidebar Section (Right) - Greeting + Upcoming */}
        <div className="w-full xl:w-[320px] flex-shrink-0 flex flex-col gap-4">
          {/* Welcome Greeting */}
          <div className="mb-10">
            <h3 className="text-muted-foreground text-[10px] uppercase font-medium tracking-[0.2em] leading-none mb-1">
              Halo, selamat datang kembali
            </h3>
            <p className="font-heading text-3xl tracking-wider text-foreground uppercase truncate">
              {(session?.user as { username?: string })?.username || "Admin"} 👋
            </p>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-border/50 via-border to-transparent mb-2" />

          {/* Upcoming Events Header */}
          <div className="flex items-center justify-between px-1 mb-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-primary" />
                <h2 className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Upcoming Events</h2>
              </div>
              {upcomingEvents.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                  {upcomingEvents.length}
                </span>
              )}
          </div>

          {/* Event Cards List */}
          <div className="flex flex-col gap-2">
            {upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3 rounded-2xl border border-dashed border-border/50 text-center">
                <CalendarDays className="size-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground font-medium">Tidak ada event mendatang</p>
              </div>
            ) : (
              upcomingEvents.map((ev, i) => (
                <UpcomingEventCard key={ev.id} ev={ev} delay={i * 80} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
