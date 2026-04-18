"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { useEventsWithAttendance } from "@/hooks/use-events-with-attendance";
import { AttendanceDetailModal } from "./AttendanceDetailModal";
import { Button } from "@/components/ui/button";
import type { getEventsWithAttendanceAction } from "@/actions/schedule";

type EventItem = Awaited<ReturnType<typeof getEventsWithAttendanceAction>>[number];

export function AttendanceCardView() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const { data: events, isLoading } = useEventsWithAttendance();
  const eventList = events ?? [];

  const groupedByMonth = useMemo(() => {
    const grouped: Record<string, EventItem[]> = {};
    for (const event of eventList) {
      const key = format(new Date(event.date), "MMMM yyyy", { locale: idLocale });
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(event);
    }
    return grouped;
  }, [eventList]);

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

  if (months.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 rounded-2xl border border-dashed border-border/50 text-center">
        <p className="text-sm text-muted-foreground font-medium">Belum ada agenda tercatat.</p>
        <p className="text-xs text-muted-foreground">Buat agenda di halaman Jadwal, lalu pilih kelompok pesertanya.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {months.map((monthKey) => (
        <div key={monthKey}>
          <h2 className="font-heading text-lg font-bold uppercase tracking-widest text-foreground mb-2.5 pl-2 border-l-4 border-primary">{monthKey}</h2>
          <div className="space-y-2">
            {groupedByMonth[monthKey].map((event) => {
              const eventDate = new Date(event.date);
              const markedAtDate = event.attendanceMarkedAt ? new Date(event.attendanceMarkedAt) : null;

              return (
                <Button key={event.id} variant="outline" onClick={() => setSelectedEventId(event.id)} className="w-full h-auto p-3 sm:p-3.5 justify-start hover:bg-muted/50 transition-colors rounded-xl border border-border/50">
                  <div className="grid w-full grid-cols-1 sm:grid-cols-[64px_minmax(0,1fr)_auto] gap-3 items-center text-left">
                    <div className="hidden sm:flex flex-col items-center justify-center rounded-lg border border-border/50 bg-background/50 px-2 py-2">
                      <span className="text-lg leading-none font-black text-foreground">{format(eventDate, "dd", { locale: idLocale })}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{format(eventDate, "MMM", { locale: idLocale })}</span>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="font-heading text-base sm:text-lg tracking-wide uppercase text-foreground truncate">{event.title}</div>
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

      {selectedEventId && <AttendanceDetailModal eventId={selectedEventId} onClose={() => setSelectedEventId(null)} />}
    </div>
  );
}
