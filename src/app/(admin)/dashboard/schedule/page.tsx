"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useSchedule } from "@/hooks/use-schedule";
import { type ScheduleEvent } from "@/types/dashboard";
import { CalendarDays, Loader2, Trash2, Pencil, Clock, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { getEventConfig, EVENT_TYPES } from "@/lib/config/events";
import { getJakartaToday, getCountdownLabel } from "@/lib/date-utils";
import { EventFormCard } from "@/components/features/EventFormCard";
import { EventPreviewDialog } from "@/components/features/EventPreviewDialog";
import { EventDeleteConfirm } from "@/components/features/EventDeleteConfirm";

const CalendarView = dynamic(() => import("@/components/features/calendar-view").then((mod) => mod.CalendarView), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-20">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  ),
});

type UIState =
  | { type: "edit";    event: ScheduleEvent }
  | { type: "delete";  targetId: string     }
  | { type: "preview"; event: ScheduleEvent }
  | null;

export default function SchedulePage() {
  const [uiState, setUiState] = useState<UIState>(null);
  const { data: events, isLoading } = useSchedule();

  const mappedEvents = useMemo(
    () =>
      (events || []).map((ev) => {
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
      }),
    [events],
  );

  const upcomingEvents = useMemo(() => {
    const today = getJakartaToday();
    return (events || [])
      .filter((ev) => new Date(ev.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [events]);

  const editEvent   = uiState?.type === "edit"    ? uiState.event    : undefined;
  const previewEvent = uiState?.type === "preview" ? uiState.event    : null;
  const deleteTarget = uiState?.type === "delete"  ? uiState.targetId : null;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
          <div>
            <h1 className="font-heading text-4xl text-foreground tracking-widest uppercase">Agenda Klub</h1>
            <p className="text-muted-foreground text-sm font-medium tracking-wide">Kelola jadwal latihan, tanding, dan agenda resmi klub.</p>
          </div>
        </div>

        {/* Form Card */}
        <EventFormCard editEvent={editEvent} onSuccess={() => setUiState(null)} />

        <div className="flex flex-col xl:flex-row gap-6 items-start">
          {/* Kalender */}
          <div className="flex-1 w-full min-w-0">
            <div className="glass-card p-5 rounded-card-lg border-border/40 shadow-sm overflow-hidden">
              <div className="w-full overflow-x-auto">
                <div className="min-w-160">
                  <CalendarView events={mappedEvents} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center mt-4 pt-3 border-t border-border/30">
                {Object.values(EVENT_TYPES).map((leg) => {
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

          {/* Agenda Mendatang */}
          <div className="w-full xl:w-95 shrink-0 flex flex-col gap-4 min-w-0">
            <div className="h-px w-full bg-linear-to-r from-border/50 via-border to-transparent" />
            <div className="flex items-center justify-between px-1 mb-2">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-icon flex items-center justify-center shrink-0 shadow-lg shadow-black/20 bg-primary">
                  <CalendarDays className="size-5 text-primary-foreground" strokeWidth={2.5} />
                </div>
                <h2 className="font-heading text-[17px] font-semibold tracking-wide text-foreground">Agenda Mendatang</h2>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-2 rounded-2xl border border-dashed border-border/50 text-center">
                  <CalendarDays className="size-8 text-muted-foreground/30 mb-1" />
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tidak ada agenda mendatang</p>
                  <p className="text-[10px] text-muted-foreground/60">Buat agenda menggunakan form di atas.</p>
                </div>
              ) : (
                upcomingEvents.map((ev) => {
                  const cfg = getEventConfig(ev.type);
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={ev.id}
                      onClick={() => setUiState({ type: "preview", event: ev })}
                      className="group flex items-start gap-4 p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:bg-muted/20 transition-all duration-base cursor-pointer min-w-0 overflow-hidden"
                    >
                      <div className="shrink-0 flex items-center justify-center size-10 rounded-xl text-white shadow-lg transition-transform group-hover:scale-110 duration-base" style={{ backgroundColor: cfg.color, boxShadow: `0 4px 14px ${cfg.color}55` }}>
                        <Icon className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-sm leading-snug wrap-break-word mb-1.5">{ev.title}</p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/80 font-bold tracking-wide uppercase px-1.5 py-0.5 bg-muted/30 rounded-md mb-1.5">
                          <Clock className="size-2.5" />
                          {getCountdownLabel(ev.date)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="size-3 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground font-medium">{format(new Date(ev.date), "EEE, dd MMM yyyy", { locale: idLocale })}</span>
                        </div>
                        {ev.location && (
                          <div className="flex items-start gap-1.5 mt-0.5 min-w-0">
                            <MapPin className="size-3 text-muted-foreground shrink-0 mt-0.5" />
                            <span className="text-xs text-muted-foreground truncate">{ev.location}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <ChevronRight className="size-4 text-border group-hover:text-primary transition-colors duration-base" />
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setUiState({ type: "edit", event: ev }); }}
                          className="size-6 text-primary/40 hover:text-primary hover:bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <Pencil className="size-3" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setUiState({ type: "delete", targetId: ev.id }); }}
                          className="size-6 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <EventPreviewDialog
        event={previewEvent}
        onClose={() => setUiState(null)}
        onEdit={(ev) => setUiState({ type: "edit", event: ev })}
      />

      <EventDeleteConfirm
        targetId={deleteTarget}
        onClose={() => setUiState(null)}
      />
    </>
  );
}
