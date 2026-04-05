"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

interface CalendarViewProps {
  events: any[];
}

export function CalendarView({ events }: CalendarViewProps) {
  return (
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
      buttonText={{
        today: "Kembali ke Hari Ini",
        month: "Bulan",
        week: "Minggu",
        day: "Hari",
      }}
    />
  );
}
