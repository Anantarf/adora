"use client";

import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { useSchedule } from "@/hooks/use-schedule";
import { 
  CalendarDays, 
  ChevronRight, 
  Clock, 
  Loader2, 
  CheckSquare,
  MapPin
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { getEventConfig, EVENT_TYPES } from "@/lib/config/events";
import { getJakartaToday, getCountdownLabel } from "@/lib/date-utils";
import { type ScheduleEvent, type UserSession } from "@/types/dashboard";

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

// Formatter dibuat di luar komponen — tidak re-instantiate setiap render
const DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function UpcomingEventCard({ ev, delay }: { ev: ScheduleEvent; delay: number }) {
  const cfg = getEventConfig(ev.type);
  const Icon = cfg.icon;
  const countdownLabel = getCountdownLabel(ev.date);
  const evDate = new Date(ev.date);

  return (
    <div
      className="group flex items-center gap-4 p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:bg-muted/20 transition-all duration-300 cursor-default animate-card-in relative"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" } as React.CSSProperties}
    >
      <div className="flex-shrink-0 flex items-center justify-center size-10 rounded-xl text-white shadow-lg transition-transform group-hover:scale-110 duration-300"
        style={{ backgroundColor: cfg.color, boxShadow: `0 4px 14px ${cfg.color}55` }}>
        <Icon className="size-5" />
      </div>
      
      <div className="flex-1 min-w-0 pr-2">
        <p className="font-bold text-foreground text-sm break-words leading-snug">
          {ev.title}{ev.group ? ` · ${ev.group.name}` : ""}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <CalendarDays className="size-3 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground font-medium">{DATE_FORMATTER.format(evDate)}</span>
        </div>
        {ev.location && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <MapPin className="size-3 text-muted-foreground flex-shrink-0 mt-0.5 self-start" />
            <span className="text-xs text-muted-foreground break-words">{ev.location}</span>
          </div>
        )}
      </div>

      <ChevronRight className="size-4 text-border group-hover:text-primary transition-colors duration-300 flex-shrink-0" />

      {/* Badge dipindahkan ke absolute agar tidak memblokir space baris kedua dan ketiga */}
      <span className="absolute top-4 right-12 flex items-center gap-1 text-[9px] text-muted-foreground/80 font-bold tracking-wide uppercase px-1.5 py-0.5 bg-muted/30 rounded-md">
        <Clock className="size-2.5" />
        {countdownLabel}
      </span>
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
    const cfg = getEventConfig(ev.type);
    return {
      id: ev.id,
      title: cfg.label,
      start: ev.date,
      allDay: true,
      backgroundColor: "transparent",
      borderColor: "transparent",
      extendedProps: { type: ev.type, originalTitle: ev.title }
    };
  }) || [], [scheduleData]);

  const upcomingEvents = useMemo(() => {
    const today = getJakartaToday();
    return (scheduleData || [])
      .filter((ev) => new Date(ev.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [scheduleData]);

  // Clean helper for user display name
  const getUserDisplayName = () => {
    const role = (session as unknown as UserSession)?.user?.role;
    const username = (session as unknown as UserSession)?.user?.username;
    return role === "ADMIN" ? "SUPERADMIN" : (username || "ADMIN");
  };

  const legends = useMemo(() => Object.values(EVENT_TYPES), []);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-6">
      {/* Legend Bar + Live Date */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-1 gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          {legends.map((leg) => {
            const Icon = leg.icon;
            return (
              <div key={leg.id} className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-full border border-border shadow-sm">
                <div className="p-1 rounded-full text-white shadow-sm" style={{ backgroundColor: leg.color }}>
                  <Icon className="size-2.5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{leg.label}</span>
              </div>
            );
          })}
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
              <h2 className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Kalender Kegiatan ADORA</h2>
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
              Selamat Datang,
            </h3>
            <p className="font-heading text-3xl tracking-wider text-foreground uppercase truncate">
              {getUserDisplayName()} 👋
            </p>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-border/50 via-border to-transparent mb-2" />

          {/* Upcoming Events Header */}
          <div className="flex items-center justify-between px-1 mb-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-primary" />
                <h2 className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Agenda Mendatang</h2>
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
