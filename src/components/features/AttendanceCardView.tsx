"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Loader2, Search, CalendarDays } from "lucide-react";
import { useEventsWithAttendance } from "@/hooks/use-events-with-attendance";
import { AttendanceDetailModal } from "./AttendanceDetailModal";
import { Button } from "@/components/ui/button";
import type { getEventsWithAttendanceAction } from "@/actions/schedule";
import { getEventConfig } from "@/lib/config/events";

type EventItem = Awaited<ReturnType<typeof getEventsWithAttendanceAction>>[number];

export function AttendanceCardView() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: events, isLoading } = useEventsWithAttendance();
  const eventList = events ?? [];

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return eventList;
    const q = searchQuery.toLowerCase();
    return eventList.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.groups.some((g) => g.name.toLowerCase().includes(q))
    );
  }, [eventList, searchQuery]);

  const groupedByMonth = useMemo(
    () =>
      filteredEvents.reduce<Record<string, EventItem[]>>((acc, event) => {
        const key = format(new Date(event.date), "MMMM yyyy", { locale: idLocale });
        (acc[key] ??= []).push(event);
        return acc;
      }, {}),
    [filteredEvents],
  );

  const months = useMemo(
    () =>
      Object.keys(groupedByMonth).sort((a, b) => {
        const dateA = groupedByMonth[a]?.[0]?.date;
        const dateB = groupedByMonth[b]?.[0]?.date;
        if (!dateA || !dateB) return 0;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }),
    [groupedByMonth],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-5 animate-spin" />
        <span className="ml-2">Memuat agenda...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10" />
        <input
          type="text"
          placeholder="Cari Agenda atau Nama Kelompok..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/50 bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm font-medium"
        />
      </div>

      {months.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 rounded-2xl border border-dashed border-border/50 text-center">
          <CalendarDays className="size-10 text-muted-foreground/30 mb-1" />
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            {searchQuery ? "Hasil tidak ditemukan" : "Belum ada agenda yang tercatat"}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {searchQuery ? "Coba gunakan kata kunci pencarian yang berbeda." : "Silakan buat agenda baru di menu Jadwal."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {months.map((monthKey) => (
            <div key={monthKey}>
              <h2 className="font-heading text-lg font-bold uppercase tracking-widest text-foreground mb-2.5 pl-2 border-l-4 border-primary">{monthKey}</h2>
              <div className="space-y-2">
                {groupedByMonth[monthKey].map((event) => {
              const eventDate = new Date(event.date);
              const markedAtDate = event.attendanceMarkedAt ? new Date(event.attendanceMarkedAt) : null;
              const cfg = getEventConfig(event.type);
              const Icon = cfg.icon;

              return (
                <Button key={event.id} variant="outline" onClick={() => setSelectedEventId(event.id)} className="w-full h-auto p-3 sm:p-3.5 justify-start hover:bg-muted/50 transition-all rounded-xl border border-border/50 group" style={{ borderLeftColor: cfg.color, borderLeftWidth: "4px" }}>
                  <div className="grid w-full grid-cols-1 sm:grid-cols-[64px_minmax(0,1fr)_auto] gap-3 items-center text-left">
                    <div className="hidden sm:flex flex-col items-center justify-center rounded-lg px-2 py-2 border transition-colors" style={{ backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}30` }}>
                      <span className="text-lg leading-none font-black" style={{ color: cfg.color }}>{format(eventDate, "dd", { locale: idLocale })}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cfg.color }}>{format(eventDate, "MMM", { locale: idLocale })}</span>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex w-fit px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-[0.15em] border leading-none" style={{ backgroundColor: `${cfg.color}15`, color: cfg.color, borderColor: `${cfg.color}30` }}>
                          {cfg.label}
                        </span>
                        <div className="font-heading text-base sm:text-lg tracking-wide uppercase text-foreground truncate">
                          {event.title}
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-muted-foreground">{format(eventDate, "dd MMM yyyy • HH:mm", { locale: idLocale })}</div>
                      {event.groups.length > 0 && <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/75 truncate">{event.groups.map((g) => g.name).join(", ")}</div>}
                    </div>

                    <div className="justify-self-start sm:justify-self-end">
                      {event.isAttendanceSubmitted ? (
                        <div className="inline-flex items-center rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-500">
                          Sudah Diisi
                          {markedAtDate ? ` • ${format(markedAtDate, "dd MMM HH:mm", { locale: idLocale })}` : ""}
                        </div>
                      ) : (
                        <div className="inline-flex items-center rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-500">Belum Diisi</div>
                      )}
                    </div>
                  </div>
                </Button>
              );
            })}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedEventId && <AttendanceDetailModal eventId={selectedEventId} onClose={() => setSelectedEventId(null)} />}
    </div>
  );
}
