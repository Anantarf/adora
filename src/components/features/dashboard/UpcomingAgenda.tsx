"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { getPublicEventsAction } from "@/actions/schedule";
import { QUERY_KEYS } from "@/lib/constants";
import { getEventConfig } from "@/lib/config/events";
import { getCountdownLabel } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";

export function UpcomingAgenda() {
  const { data: events, isLoading } = useQuery({
    queryKey: QUERY_KEYS.PUBLIC_EVENTS,
    queryFn: getPublicEventsAction,
    staleTime: 1000 * 60 * 5,
  });

  const upcoming = (events ?? []).slice(0, 5);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-border/50 px-5 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Agenda Mendatang</h2>
          </div>
          <p className="text-sm text-muted-foreground">Jadwal latihan dan agenda resmi yang paling dekat.</p>
        </div>
        {upcoming.length > 0 ? (
          <span className="rounded-md border border-border/60 bg-background px-2 py-1 text-xs font-semibold text-muted-foreground">
            {upcoming.length}
          </span>
        ) : null}
      </div>

      <div className="flex min-h-72 flex-1 flex-col px-5 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/50 bg-background/30 px-4 py-10 text-center">
            <CalendarDays className="size-8 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">Belum ada agenda mendatang</p>
            <p className="text-xs text-muted-foreground/75">Buat jadwal baru dari halaman agenda.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {upcoming.map((event) => {
              if (!event.id || !event.date || !event.type || !event.title) {
                return null;
              }

              const config = getEventConfig(event.type);
              const eventDate = new Date(event.date);

              return (
                <Link
                  key={event.id}
                  href="/dashboard/schedule"
                  className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-background/60 px-4 py-3 transition-colors hover:border-primary/30"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className="rounded-md border px-2 py-1 font-medium"
                        style={{
                          color: config.color,
                          borderColor: `${config.color}40`,
                          backgroundColor: `${config.color}12`,
                        }}
                      >
                        {config.label}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {format(eventDate, "EEE, dd MMM", { locale: idLocale })}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold text-foreground">{getCountdownLabel(event.date)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {upcoming.length > 0 ? (
        <div className="border-t border-border/50 px-5 py-4">
          <Link
            href="/dashboard/schedule"
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
          >
            Buka agenda lengkap
            <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
