"use client";

import dynamic from "next/dynamic";
import { useSchedule } from "@/hooks/use-schedule";
import { CalendarDays, ChevronRight, Clock, Loader2, CheckSquare, MapPin, AlignLeft } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { getEventConfig, EVENT_TYPES } from "@/lib/config/events";
import { getJakartaToday, getCountdownLabel } from "@/lib/date-utils";
import { type ScheduleEvent } from "@/types/dashboard";

// Dynamic import for Heavy Calendar component
const CalendarView = dynamic(() => import("@/components/features/calendar-view").then((mod) => mod.CalendarView), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-xs text-muted-foreground animate-pulse">Menyiapkan Kalender ADORA...</p>
    </div>
  ),
});

// Formatter dibuat di luar komponen — tidak re-instantiate setiap render
const DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function UpcomingEventCard({ ev, delay, onClick }: { ev: ScheduleEvent; delay: number; onClick: () => void }) {
  const cfg = getEventConfig(ev.type);
  const Icon = cfg.icon;
  const countdownLabel = getCountdownLabel(ev.date);
  const evDate = new Date(ev.date);

  return (
    <div
      onClick={onClick}
      className="group flex items-start gap-4 p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:bg-muted/20 transition-all duration-300 cursor-pointer animate-card-in min-w-0 overflow-hidden"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" } as React.CSSProperties}
    >
      <div className="shrink-0 flex items-center justify-center size-10 rounded-xl text-white shadow-lg transition-transform group-hover:scale-110 duration-300" style={{ backgroundColor: cfg.color, boxShadow: `0 4px 14px ${cfg.color}55` }}>
        <Icon className="size-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground text-sm leading-snug wrap-break-word mb-1.5">
          {ev.title}
          {ev.group ? ` · ${ev.group.name}` : ""}
        </p>
        <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground/80 font-bold tracking-wide uppercase px-1.5 py-0.5 bg-muted/30 rounded-md mb-1.5">
          <Clock className="size-2.5" />
          {countdownLabel}
        </span>

        <div className="flex items-center gap-1.5">
          <CalendarDays className="size-3 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground font-medium">{DATE_FORMATTER.format(evDate)}</span>
        </div>
        {ev.location && (
          <div className="flex items-start gap-1.5 mt-0.5 min-w-0">
            <MapPin className="size-3 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-xs text-muted-foreground truncate">{ev.location}</span>
          </div>
        )}
      </div>

      <ChevronRight className="size-4 text-border group-hover:text-primary transition-colors duration-300 shrink-0" />
    </div>
  );
}

// ─── Dashboard Utama ────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const { data: scheduleData } = useSchedule();
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [liveDate] = useState(() =>
    new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date()),
  );

  const mappedEvents = useMemo(
    () =>
      scheduleData?.map((ev) => {
        const cfg = getEventConfig(ev.type);
        return {
          id: ev.id,
          title: cfg.label,
          start: ev.date,
          allDay: true,
          backgroundColor: "transparent",
          borderColor: "transparent",
          extendedProps: { type: ev.type, originalTitle: ev.title, location: ev.location, description: ev.description, date: ev.date },
        };
      }) || [],
    [scheduleData],
  );

  const upcomingEvents = useMemo(() => {
    const today = getJakartaToday();
    return (scheduleData || [])
      .filter((ev) => new Date(ev.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [scheduleData]);

  // Clean helper for user display name
  const getUserDisplayName = () => {
    const role = session?.user?.role;
    const username = session?.user?.username;
    return role === "ADMIN" ? "SUPERADMIN" : username || "ADMIN";
  };

  const legends = useMemo(() => Object.values(EVENT_TYPES), []);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-6">
      {/* Main Content Layout */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Main Section (Left) - Calendar */}
        <div className="flex-1 w-full min-w-0">
          <div className="glass-card p-5 rounded-[2.5rem] border-border/40 shadow-sm relative overflow-hidden group h-full">
            <div className="w-full">
              <div className="overflow-x-auto">
                <div className="min-w-160">
                  <CalendarView events={mappedEvents} />
                </div>
              </div>
            </div>

            {/* Legend Bar - bawah kalender */}
            <div className="flex flex-wrap gap-2 items-center mt-4 pt-3 border-t border-border/30">
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
          </div>
        </div>

        {/* Sidebar Section (Right) - Greeting + Upcoming */}
        <div className="w-full xl:w-[320px] shrink-0 flex flex-col gap-4 min-w-0 overflow-hidden">
          {/* Welcome Greeting */}
          <div className="mb-4">
            <h3 className="text-muted-foreground text-[10px] uppercase font-medium tracking-[0.2em] leading-none mb-1">Selamat Datang,</h3>
            <p className="font-heading text-3xl tracking-wider text-foreground uppercase truncate">{getUserDisplayName()} 👋</p>
            {liveDate && <p className="text-sm font-semibold text-muted-foreground mt-1.5 tracking-tight">{liveDate}</p>}
          </div>

          <div className="h-px w-full bg-linear-to-r from-border/50 via-border to-transparent mb-2" />

          {/* Upcoming Events Header */}
          <div className="flex items-center justify-between px-1 mb-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" />
              <h2 className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Agenda Mendatang</h2>
            </div>
          </div>

          {/* Event Cards List */}
          <div className="flex flex-col gap-2">
            {upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3 rounded-2xl border border-dashed border-border/50 text-center">
                <CalendarDays className="size-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground font-medium">Tidak ada agenda mendatang</p>
              </div>
            ) : (
              upcomingEvents.map((ev, i) => <UpcomingEventCard key={ev.id} ev={ev} delay={i * 80} onClick={() => setSelectedEvent(ev)} />)
            )}
          </div>
        </div>
      </div>

      {/* Modal Detail Event dari Agenda Mendatang */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        {selectedEvent &&
          (() => {
            const cfg = getEventConfig(selectedEvent.type);
            const Icon = cfg.icon;
            const formatJakarta = (iso: string | Date, options: Intl.DateTimeFormatOptions) => {
              try {
                return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", ...options }).format(new Date(iso));
              } catch {
                return "—";
              }
            };
            return (
              <DialogContent className="bg-background border-primary/20 text-white w-[calc(100vw-2rem)] sm:max-w-100 p-0 overflow-hidden">
                <div className="relative h-28 flex items-center justify-center overflow-hidden" style={{ backgroundColor: cfg.color + "22" }}>
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(45deg, #000 0px, #000 1px, transparent 1px, transparent 10px)" }} />
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="size-12 rounded-full flex items-center justify-center" style={{ backgroundColor: cfg.color }}>
                      <Icon className="size-6 text-white" strokeWidth={2} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full border" style={{ color: cfg.color, borderColor: cfg.color + "40", backgroundColor: cfg.color + "15" }}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-8 bg-linear-to-t from-[#0f0f11] to-transparent" />
                </div>

                <div className="p-6 pt-4 space-y-5 overflow-hidden">
                  <DialogTitle className="font-heading text-2xl tracking-widest uppercase text-white leading-tight wrap-break-word">{selectedEvent.title}</DialogTitle>

                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                      <CalendarDays size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-0.5">Hari & Tanggal</div>
                      <div className="text-sm font-semibold text-white/80 wrap-break-word">{formatJakarta(selectedEvent.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                      <Clock size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-0.5">Waktu</div>
                      <div className="text-sm font-semibold text-white/80">{formatJakarta(selectedEvent.date, { hour: "2-digit", minute: "2-digit", hour12: false })} WIB</div>
                    </div>
                  </div>

                  {selectedEvent.location && (
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                        <MapPin size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-0.5">Lokasi</div>
                        <div className="text-sm font-semibold text-white/80 wrap-break-word">{selectedEvent.location}</div>
                      </div>
                    </div>
                  )}

                  {selectedEvent.description && (
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                        <AlignLeft size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-0.5">Keterangan</div>
                        <p className="text-xs leading-relaxed text-white/50 wrap-break-word">{selectedEvent.description}</p>
                      </div>
                    </div>
                  )}

                  <button onClick={() => setSelectedEvent(null)} className="w-full py-3 text-[10px] font-bold uppercase tracking-[0.3em] bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white/60">
                    Tutup
                  </button>
                </div>
              </DialogContent>
            );
          })()}
      </Dialog>
    </div>
  );
}
