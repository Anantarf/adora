"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { useEventsWithAttendance } from "@/hooks/use-events-with-attendance";
import { AttendanceDetailModal } from "./AttendanceDetailModal";
import { Button } from "@/components/ui/button";
import type { getEventsWithAttendanceAction } from "@/actions/schedule";
import { AttendanceStatus } from "@/types/dashboard";

type EventItem = Awaited<ReturnType<typeof getEventsWithAttendanceAction>>[number];

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string }> = {
  HADIR: { label: "HADIR", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  IZIN: { label: "IZIN", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  SAKIT: { label: "SAKIT", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  ALPA: { label: "ALPA", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

export function StatsBadge({ status, value }: { status: AttendanceStatus; value: number }) {
  const { label, color } = STATUS_CONFIG[status];
  return (
    <div className={`flex flex-col items-center px-2.5 py-1 rounded-lg border ${color}`}>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      <span className="text-sm font-black">{value}</span>
    </div>
  );
}

export function AttendanceCardView() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const { data: events, isLoading } = useEventsWithAttendance();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-5 animate-spin" />
        <span className="ml-2">Memuat agenda...</span>
      </div>
    );
  }

  const groupedByMonth = (events ?? []).reduce<Record<string, EventItem[]>>((acc, event) => {
    const key = format(new Date(event.date), "MMMM yyyy", { locale: idLocale });
    return { ...acc, [key]: [...(acc[key] ?? []), event] };
  }, {});

  const months = Object.keys(groupedByMonth).sort((a, b) => {
    const dateA = groupedByMonth[a]?.[0]?.date;
    const dateB = groupedByMonth[b]?.[0]?.date;
    if (!dateA || !dateB) return 0;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  if (months.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 rounded-2xl border border-dashed border-border/50 text-center">
        <p className="text-sm text-muted-foreground font-medium">Belum ada agenda tercatat.</p>
        <p className="text-xs text-muted-foreground">Buat agenda di halaman Jadwal, lalu pilih kelompok pesertanya.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {months.map((monthKey) => (
        <div key={monthKey}>
          <h2 className="font-heading text-xl font-bold uppercase tracking-widest text-foreground mb-4 pl-2 border-l-4 border-primary">{monthKey}</h2>
          <div className="space-y-3">
            {groupedByMonth[monthKey].map((event) => (
              <Button key={event.id} variant="outline" onClick={() => setSelectedEventId(event.id)} className="w-full h-auto p-4 sm:p-5 justify-start hover:bg-muted/60 transition-colors rounded-xl border border-border/50">
                <div className="flex flex-col md:flex-row w-full md:items-center justify-between gap-4 md:gap-6">
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-heading tracking-widest uppercase text-lg text-foreground mb-1 truncate">{event.title}</div>
                    <div className="text-xs font-bold text-muted-foreground opacity-80">{format(new Date(event.date), "dd MMM yyyy • HH:mm", { locale: idLocale })}</div>
                    {event.groups.length > 0 && <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50 mt-1.5 truncate">{event.groups.map((g) => g.name).join(", ")}</div>}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {(["HADIR", "IZIN", "SAKIT", "ALPA"] as AttendanceStatus[]).map((s) => (
                      <StatsBadge key={s} status={s} value={event.stats[s]} />
                    ))}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      ))}

      {selectedEventId && <AttendanceDetailModal eventId={selectedEventId} onClose={() => setSelectedEventId(null)} />}
    </div>
  );
}
