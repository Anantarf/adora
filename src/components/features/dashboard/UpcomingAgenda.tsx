"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, Clock, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { getPublicEventsAction } from "@/actions/schedule";
import { getEventConfig } from "@/lib/config/events";
import { getCountdownLabel } from "@/lib/date-utils";
import { QUERY_KEYS } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

export function UpcomingAgenda() {
  const { data: events, isLoading } = useQuery({
    queryKey: QUERY_KEYS.PUBLIC_EVENTS,
    queryFn: getPublicEventsAction,
    staleTime: 1000 * 60 * 5,
  });

  const upcoming = (events ?? []).slice(0, 5);

  return (
    // Sama persis strukturnya dengan RecentRegistrations: flex flex-col h-full
    <div className="flex flex-col border border-border/50 rounded-xl bg-card/30 overflow-hidden h-full transition-all duration-300 hover:border-border/80">

      {/* Header */}
      <div className="p-6 border-b border-border/50 flex items-center justify-between bg-card/50">
        <div>
          <h2 className="font-heading text-base tracking-wider text-foreground flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary shrink-0" />
            AGENDA MENDATANG
          </h2>
          <p className="text-xs text-muted-foreground mt-1 tracking-wide">
            Jadwal latihan dan kegiatan klub berikutnya
          </p>
        </div>
        {upcoming.length > 0 && (
          <div className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded-md shrink-0 ml-2">
            {upcoming.length} EVENT
          </div>
        )}
      </div>

      {/* Content — flex-1 sama seperti RecentRegistrations */}
      <div className="flex-1 p-6 flex flex-col min-h-[380px]">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 rounded-xl border border-dashed border-border/50 text-center py-8">
            <CalendarDays className="size-8 text-muted-foreground/30 mb-1" />
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Tidak Ada Agenda Mendatang
            </p>
            <p className="text-xs text-muted-foreground/60">
              Semua agenda telah selesai atau belum dijadwalkan.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {upcoming.map((ev) => {
              if (!ev.id || !ev.date || !ev.type || !ev.title) return null;
              const cfg = getEventConfig(ev.type);
              const Icon = cfg.icon;
              const eventDate = new Date(ev.date);

              return (
                <Link
                  key={ev.id}
                  href="/dashboard/schedule"
                  className="group flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-muted/20 transition-all"
                >
                  <div
                    className="shrink-0 size-9 rounded-lg flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: cfg.color }}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate leading-snug">
                      {ev.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="size-3 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">
                        {format(eventDate, "EEE, dd MMM", { locale: idLocale })}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border leading-none"
                      style={{
                        color: cfg.color,
                        borderColor: `${cfg.color}40`,
                        backgroundColor: `${cfg.color}15`,
                      }}
                    >
                      {getCountdownLabel(ev.date)}
                    </span>
                    <ChevronRight className="size-3.5 text-border group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Button — identik dengan RecentRegistrations */}
      {upcoming.length > 0 && (
        <div className="px-6 pb-6 pt-2">
          <Link
            href="/dashboard/schedule"
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold tracking-widest uppercase bg-muted/50 hover:bg-primary hover:text-primary-foreground text-foreground rounded-lg transition-all"
          >
            Lihat Semua Agenda
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
