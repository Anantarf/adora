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

// Badge label: "Agenda Lainnya" → 2 lines, others cap at 10 chars
const getBadgeLines = (label: string): string[] =>
  label === "Agenda Lainnya"
    ? ["Agenda", "Lainnya"]
    : [label.slice(0, 10)];

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
        .fc-v-event, .fc-h-event {
          background-color: transparent !important;
          border: none !important;
        }
        .fc-daygrid-event-harness {
          margin-bottom: 2px !important;
        }
      `}</style>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        height="auto"
        contentHeight="auto"
        aspectRatio={1.8}
        fixedWeekCount={false}
        dayMaxEvents={3}
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
          const cfg = getEventConfig(arg.event.extendedProps.type || "KHUSUS");
          const Icon = cfg.icon;
          const lines = getBadgeLines(cfg.label);
          const isMultiLine = lines.length > 1;

          return (
            <div className="flex items-center gap-2 p-[2.5px] pl-[2.5px] pr-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm w-fit max-w-[95%] overflow-hidden hover:bg-white/20 transition-all cursor-pointer group shadow-sm my-1 mx-1.5">
              <div
                className="flex items-center justify-center size-[18px] flex-shrink-0 rounded-full text-white shadow-sm"
                style={{ backgroundColor: cfg.color }}
              >
                <Icon className="size-[10px]" strokeWidth={2.5} />
              </div>
              <span className={`text-[8.5px] font-bold tracking-widest uppercase text-white group-hover:text-white transition-colors leading-none ${isMultiLine ? "flex flex-col gap-px" : ""}`}>
                {isMultiLine
                  ? lines.map((line) => <span key={line}>{line}</span>)
                  : lines[0]
                }
              </span>
            </div>
          );
        }}
      />

      {/* Modal Detail Event */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        {selectedEvent && (() => {
          const cfg = getEventConfig(selectedEvent.type);
          const Icon = cfg.icon;
          return (
            <DialogContent className="bg-background border-primary/20 text-white sm:max-w-[400px] p-0 overflow-hidden">
              {/* Header */}
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
                <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#0f0f11] to-transparent" />
              </div>

              <div className="p-6 pt-4 space-y-5">
                <DialogTitle className="font-heading text-2xl tracking-widest uppercase text-white leading-tight">
                  {selectedEvent.originalTitle}
                </DialogTitle>

                {/* Tanggal */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                    <CalendarDays size={14} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-0.5">Hari & Tanggal</div>
                    <div className="text-sm font-semibold text-white/80">
                      {formatJakarta(selectedEvent.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </div>
                </div>

                {/* Waktu */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                    <Clock size={14} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-0.5">Waktu</div>
                    <div className="text-sm font-semibold text-white/80">
                      {formatJakarta(selectedEvent.date, { hour: "2-digit", minute: "2-digit", hour12: false })} WIB
                    </div>
                  </div>
                </div>

                {/* Lokasi */}
                {selectedEvent.location && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                      <MapPin size={14} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-0.5">Lokasi</div>
                      <div className="text-sm font-semibold text-white/80">{selectedEvent.location}</div>
                    </div>
                  </div>
                )}

                {/* Keterangan */}
                {selectedEvent.description && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                      <AlignLeft size={14} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-0.5">Keterangan</div>
                      <p className="text-xs leading-relaxed text-white/50">{selectedEvent.description}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setSelectedEvent(null)}
                  className="w-full py-3 text-[10px] font-bold uppercase tracking-[0.3em] bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white/60"
                >
                  Tutup
                </button>
              </div>
            </DialogContent>
          );
        })()}
      </Dialog>
    </>
  );
}
