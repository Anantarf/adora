"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  CalendarDays,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";

import { EventDeleteConfirm } from "@/components/features/EventDeleteConfirm";
import { EventFormCard } from "@/components/features/EventFormCard";
import { EventPreviewDialog } from "@/components/features/EventPreviewDialog";
import { Button } from "@/components/ui/button";
import { getEventConfig, EVENT_TYPES } from "@/lib/config/events";
import { getCountdownLabel, getJakartaToday, toJakartaDate } from "@/lib/date-utils";
import { useSchedule } from "@/hooks/use-schedule";
import type { ScheduleEvent } from "@/types/dashboard";

const CalendarView = dynamic(
  () => import("@/components/features/calendar-view").then((mod) => mod.CalendarView),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    ),
  },
);

type UIState =
  | { type: "edit"; event: ScheduleEvent }
  | { type: "delete"; targetId: string }
  | { type: "preview"; event: ScheduleEvent }
  | null;

export default function SchedulePage() {
  const [uiState, setUiState] = useState<UIState>(null);
  const { data: events, isLoading, isError } = useSchedule();

  const mappedEvents = useMemo(
    () =>
      (events || []).map((event) => {
        const config = getEventConfig(event.type);

        return {
          id: event.id,
          title: config.label,
          start: event.date,
          allDay: true,
          backgroundColor: "transparent",
          borderColor: "transparent",
          extendedProps: {
            type: event.type,
            originalTitle: event.title,
            location: event.location,
            description: event.description,
            date: event.date,
          },
        };
      }),
    [events],
  );

  const upcomingEvents = useMemo(() => {
    const today = getJakartaToday();

    return (events || [])
      .filter((event) => toJakartaDate(event.date) >= today)
      .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())
      .slice(0, 5);
  }, [events]);

  const editEvent = uiState?.type === "edit" ? uiState.event : undefined;
  const previewEvent = uiState?.type === "preview" ? uiState.event : null;
  const deleteTarget = uiState?.type === "delete" ? uiState.targetId : null;

  return (
    <>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-6">
        <div className="border-b border-border/50 pb-6">
          <p className="text-sm text-muted-foreground">
            Kelola jadwal latihan, tanding, dan agenda resmi klub dari satu halaman kerja.
          </p>
        </div>

        <EventFormCard editEvent={editEvent} onSuccess={() => setUiState(null)} />

        <div className="flex flex-col items-start gap-6 xl:flex-row">
          <div className="min-w-0 flex-1">
            <section className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
              <div className="border-b border-border/50 px-5 py-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-foreground">Kalender Agenda</h2>
                  <p className="text-sm text-muted-foreground">
                    Lihat penyebaran jadwal bulanan sebelum menambah atau mengubah agenda.
                  </p>
                </div>
              </div>

              <div className="w-full overflow-x-auto px-5 py-4">
                <div className="min-w-0 md:min-w-160">
                  <CalendarView events={mappedEvents} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border/50 px-5 py-4">
                {Object.values(EVENT_TYPES).map((eventType) => {
                  const Icon = eventType.icon;

                  return (
                    <div
                      key={eventType.id}
                      className="inline-flex items-center gap-2 rounded-md border border-border/50 bg-background/50 px-2.5 py-1.5 text-xs text-muted-foreground"
                    >
                      <span
                        className="flex size-5 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: eventType.color }}
                      >
                        <Icon className="size-3" />
                      </span>
                      <span className="font-medium">{eventType.label}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="flex w-full shrink-0 flex-col gap-3 xl:w-[24rem]">
            <div className="space-y-1 px-1">
              <h2 className="text-sm font-semibold text-foreground">Agenda Mendatang</h2>
              <p className="text-sm text-muted-foreground">
                Fokus ke agenda terdekat yang masih perlu dipantau atau diubah.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-10 text-sm text-muted-foreground shadow-sm">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  Memuat agenda...
                </div>
              ) : isError ? (
                <div className="rounded-xl border border-dashed border-destructive/30 bg-card px-4 py-10 text-center shadow-sm">
                  <p className="text-sm font-semibold text-destructive">Gagal memuat agenda</p>
                  <p className="mt-1 text-xs text-muted-foreground">Periksa koneksi lalu muat ulang halaman.</p>
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/50 bg-card px-4 py-10 text-center shadow-sm">
                  <CalendarDays className="mx-auto size-8 text-muted-foreground/30" />
                  <p className="mt-3 text-sm font-medium text-muted-foreground">Belum ada agenda mendatang</p>
                  <p className="mt-1 text-xs text-muted-foreground/75">
                    Buat agenda baru dari form di atas.
                  </p>
                </div>
              ) : (
                upcomingEvents.map((event) => {
                  const config = getEventConfig(event.type);
                  const Icon = config.icon;

                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setUiState({ type: "preview", event })}
                      className="flex items-start gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 text-left shadow-sm transition-colors hover:border-primary/30"
                    >
                      <span
                        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg text-white"
                        style={{ backgroundColor: config.color }}
                      >
                        <Icon className="size-4" />
                      </span>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
                            <p className="text-xs text-muted-foreground">{config.label}</p>
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-foreground">
                            {getCountdownLabel(event.date)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {format(new Date(event.date), "EEE, dd MMM yyyy", { locale: idLocale })}
                          </span>
                          {event.location ? (
                            <span className="flex min-w-0 items-center gap-1">
                              <MapPin className="size-3 shrink-0" />
                              <span className="truncate">{event.location}</span>
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(eventObject) => {
                                eventObject.stopPropagation();
                                setUiState({ type: "edit", event });
                              }}
                              className="h-8 px-2 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary"
                            >
                              <Pencil className="mr-1 size-3" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(eventObject) => {
                                eventObject.stopPropagation();
                                setUiState({ type: "delete", targetId: event.id });
                              }}
                              className="h-8 px-2 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="mr-1 size-3" />
                              Hapus
                            </Button>
                          </div>
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      </div>

      <EventPreviewDialog
        event={previewEvent}
        onClose={() => setUiState(null)}
        onEdit={(event) => setUiState({ type: "edit", event })}
      />

      <EventDeleteConfirm targetId={deleteTarget} onClose={() => setUiState(null)} />
    </>
  );
}
