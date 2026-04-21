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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function UpcomingAgenda() {
  const { data: events, isLoading } = useQuery({
    queryKey: QUERY_KEYS.PUBLIC_EVENTS,
    queryFn: getPublicEventsAction,
    staleTime: 1000 * 60 * 5,
  });

  const upcoming = (events ?? []).slice(0, 5);

  return (
    <Card className="border-border/50 bg-card shadow-sm h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-base uppercase tracking-widest text-foreground">
          Agenda Mendatang
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Jadwal latihan dan kegiatan klub berikutnya
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 min-h-[180px] gap-2 rounded-xl border border-dashed border-border/50 text-center py-8">
            <CalendarDays className="size-8 text-muted-foreground/30 mb-1" />
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Tidak Ada Agenda Mendatang
            </p>
            <p className="text-xs text-muted-foreground/60">
              Semua agenda telah selesai atau belum dijadwalkan.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 flex-1">
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

            <Link
              href="/dashboard/schedule"
              className="mt-auto pt-3 flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 hover:text-primary transition-colors"
            >
              Lihat Semua Agenda
              <ArrowRight className="size-3" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
