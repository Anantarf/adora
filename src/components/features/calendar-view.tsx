"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput } from "@fullcalendar/core";
import { getEventConfig } from "@/lib/config/events";

interface CalendarViewProps {
  events: EventInput[];
}

export function CalendarView({ events }: CalendarViewProps) {
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
        eventContent={(arg) => {
          const type = arg.event.extendedProps.type;
          const cfg = getEventConfig(type || "KHUSUS");
          const Icon = cfg.icon;

          return (
            <div className="flex items-center gap-2 p-[2.5px] pl-[2.5px] pr-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm w-fit max-w-[95%] overflow-hidden hover:bg-white/20 transition-all cursor-pointer group shadow-sm my-1 mx-1.5">
              <div 
                className="flex items-center justify-center size-[18px] flex-shrink-0 rounded-full text-white shadow-sm"
                style={{ backgroundColor: cfg.color }}
              >
                <Icon className="size-[10px]" strokeWidth={2.5} />
              </div>
              <span className="text-[8.5px] font-bold tracking-widest uppercase text-white group-hover:text-white transition-colors leading-none">
                {cfg.label}
              </span>
            </div>
          );
        }}
      />
    </>
  );
}
