/* eslint-disable tailwindcss/no-custom-classname */
"use client";

import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput } from "@fullcalendar/core";
import { getEventConfig } from "@/lib/config/events";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, Clock, MapPin, AlignLeft } from "lucide-react";

interface CalendarViewProps {
  events: EventInput[];
}

type SelectedEvent = {
  type: string;
  originalTitle: string;
  location: string | null;
  description: string | null;
  date: string;
};

const formatJakarta = (iso: string, options: Intl.DateTimeFormatOptions) => {
  try {
    return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", ...options }).format(new Date(iso));
  } catch {
    return "—";
  }
};

export function CalendarView({ events }: CalendarViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);

  return (
    <>
      <style jsx global>{`
        .fc-event {
          background-color: transparent !important;
          border: none !important;
          padding: 0 !important;
          margin: 0 !important;
          box-shadow: none !important;
        }
        .fc-event-main {
          padding: 0 !important;
        }
        .fc-v-event,
        .fc-h-event {
          background-color: transparent !important;
          border: none !important;
        }
        .fc-daygrid-day-frame {
          min-height: 44px !important;
        }
        .fc-daygrid-day-top {
          padding: 2px 4px !important;
        }
        .fc-col-header-cell {
          padding: 4px 0 !important;
        }
        .fc-daygrid-day-events {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 2px !important;
          padding: 2px 3px !important;
        }
        .fc-daygrid-event-harness {
          margin: 0 !important;
          min-width: 0 !important;
          overflow: hidden !important;
          max-width: 100% !important;
        }
        .fc-event-main {
          min-width: 0 !important;
          overflow: hidden !important;
        }
        .fc-daygrid-event-harness-abs {
          position: static !important;
        }
        .fc-day-other .fc-daygrid-event-harness {
          opacity: 0.35 !important;
        }
        .fc-daygrid-more-link {
          display: none !important;
        }
        .fc-toolbar-title {
          font-weight: 600 !important;
          letter-spacing: 0.025em !important;
          color: hsl(var(--foreground)) !important;
        }
      `}</style>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next",
          center: "title",
          right: "today",
        }}
        events={events}
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }}
        height="auto"
        contentHeight="auto"
        aspectRatio={2.8}
        fixedWeekCount={false}
        dayMaxEvents={false}
        eventDisplay="block"
        eventTextColor="#fff"
        buttonIcons={false}
        buttonText={{
          today: "Hari Ini",
          month: "Bulan",
          week: "Minggu",
          day: "Hari",
          prev: "◀",
          next: "▶",
        }}
        eventClick={(arg) => {
          const p = arg.event.extendedProps;
          setSelectedEvent({
            type: p.type,
            originalTitle: p.originalTitle,
            location: p.location ?? null,
            description: p.description ?? null,
            date: p.date,
          });
        }}
        eventContent={(arg) => {
          const cfg = getEventConfig(arg.event.extendedProps.type);
          const Icon = cfg.icon;

          return (
            <div
              className="flex items-center gap-1.5 pl-0.75 pr-2 py-0.75 rounded-full cursor-pointer hover:brightness-110 transition-all mx-px my-px max-w-full min-w-0 bg-card border border-white/10"
              style={{ boxShadow: `0 0 6px ${cfg.color}33` }}
              title={arg.event.extendedProps.originalTitle}
            >
              <div className="flex items-center justify-center size-3.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }}>
                <Icon className="size-2 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-[9px] font-semibold leading-none truncate min-w-0 text-white/90">{arg.event.extendedProps.originalTitle}</span>
            </div>
          );
        }}
      />

      {/* Modal Detail Event */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        {selectedEvent && (
          <DialogContent className="bg-background border-primary/20 text-white w-[calc(100vw-2rem)] sm:max-w-100 p-0 overflow-hidden">
            {/* Header */}
            <div className="relative h-28 flex items-center justify-center overflow-hidden" style={{ backgroundColor: getEventConfig(selectedEvent.type).color + "22" }}>
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(45deg, #000 0px, #000 1px, transparent 1px, transparent 10px)" }} />
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="size-12 rounded-full flex items-center justify-center" style={{ backgroundColor: getEventConfig(selectedEvent.type).color }}>
                  {(() => {
                    const Icon = getEventConfig(selectedEvent.type).icon;
                    return <Icon className="size-6 text-white" strokeWidth={2} />;
                  })()}
                </div>
                <span
                  className="text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full border"
                  style={{ color: getEventConfig(selectedEvent.type).color, borderColor: getEventConfig(selectedEvent.type).color + "40", backgroundColor: getEventConfig(selectedEvent.type).color + "15" }}
                >
                  {getEventConfig(selectedEvent.type).label}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-8 bg-linear-to-t from-[#0f0f11] to-transparent" />
            </div>

            <div className="p-6 pt-4 space-y-5 overflow-hidden">
              <DialogTitle className="font-heading text-2xl tracking-widest uppercase text-white leading-tight wrap-break-word">{selectedEvent.originalTitle}</DialogTitle>

              {/* Tanggal */}
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                  <CalendarDays size={14} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-0.5">Hari & Tanggal</div>
                  <div className="text-sm font-semibold text-white/80 wrap-break-word">{formatJakarta(selectedEvent.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
                </div>
              </div>

              {/* Waktu */}
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                  <Clock size={14} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-0.5">Waktu</div>
                  <div className="text-sm font-semibold text-white/80">{formatJakarta(selectedEvent.date, { hour: "2-digit", minute: "2-digit", hour12: false })} WIB</div>
                </div>
              </div>

              {/* Lokasi */}
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

              {/* Keterangan */}
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
        )}
      </Dialog>
    </>
  );
}
