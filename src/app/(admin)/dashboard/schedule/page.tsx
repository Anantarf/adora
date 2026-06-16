"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  CalendarDays,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";

import { EventDeleteConfirm } from "@/components/features/EventDeleteConfirm";
import { EventEditDialog } from "@/components/features/EventEditDialog";
import { EventFormCard } from "@/components/features/EventFormCard";
import { EventPreviewDialog } from "@/components/features/EventPreviewDialog";
import { AdminPageHeader } from "@/components/features/admin-page-header";
import { AdminStatePanel } from "@/components/features/admin-state-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getEventConfig, EVENT_TYPES } from "@/lib/config/events";
import { getCountdownLabel, getJakartaToday, toJakartaDate } from "@/lib/date-utils";
import { useSchedule } from "@/hooks/use-schedule";
import type { ScheduleEvent } from "@/types/dashboard";

const CalendarView = dynamic(
  () => import("@/components/features/calendar-view").then((mod) => mod.CalendarView),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3 p-4">
        <Skeleton className="h-10 w-full rounded-xl bg-muted/20" />
        <Skeleton className="h-[420px] w-full rounded-xl bg-muted/15" />
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

  const editEvent = uiState?.type === "edit" ? uiState.event : null;
  const previewEvent = uiState?.type === "preview" ? uiState.event : null;
  const deleteTarget = uiState?.type === "delete" ? uiState.targetId : null;

  return (
    <>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
        <AdminPageHeader
          eyebrow="Agenda Klub"
          title="Kalender Agenda"
          description="Kelola jadwal latihan, tanding, dan agenda resmi klub dari satu halaman kerja."
        />

        <section className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
          <div className="border-b border-border/50 px-5 py-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">Kalender Agenda</h3>
              <p className="text-sm text-muted-foreground">
                Cek penyebaran jadwal dan potensi bentrok sebelum menambah atau mengubah agenda.
              </p>
            </div>
          </div>

          <div className="grid gap-0 border-b border-border/50 xl:grid-cols-[minmax(0,1fr)_24rem] xl:divide-x xl:divide-border/50">
            <div className="w-full overflow-x-auto px-5 py-4">
              <div className="min-w-0 md:min-w-160">
                <CalendarView events={mappedEvents} />
              </div>
            </div>

            <aside className="flex flex-col gap-3 px-5 py-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">Agenda Mendatang</h3>
                <p className="text-sm text-muted-foreground">
                  Pantau agenda terdekat yang masih perlu ditinjau atau diubah.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                {isLoading ? (
                  <div className="space-y-2.5 rounded-xl border border-border/50 bg-background/40 p-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton key={index} className="h-[70px] w-full rounded-xl bg-muted/20" />
                    ))}
                  </div>
                ) : isError ? (
                  <AdminStatePanel
                    title="Gagal memuat agenda"
                    description="Periksa koneksi lalu muat ulang halaman."
                    tone="danger"
                    className="min-h-40"
                  />
                ) : upcomingEvents.length === 0 ? (
                  <AdminStatePanel
                    icon={CalendarDays}
                    title="Belum ada agenda mendatang"
                    description="Tambahkan agenda baru dari form di bawah kalender."
                    className="min-h-40"
                  />
                ) : (
                  upcomingEvents.map((event) => {
                    const config = getEventConfig(event.type);

                    return (
                      <div
                        key={event.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setUiState({ type: "preview", event })}
                        onKeyDown={(eventObject) => {
                          if (eventObject.key === "Enter" || eventObject.key === " ") {
                            eventObject.preventDefault();
                            setUiState({ type: "preview", event });
                          }
                        }}
                        className="w-full rounded-xl border border-border/50 bg-background/40 px-4 py-3 text-left transition-colors hover:border-primary/30 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        style={{ borderLeftColor: config.color, borderLeftWidth: "4px" }}
                      >
                        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className="inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-none"
                                style={{
                                  backgroundColor: `${config.color}15`,
                                  color: config.color,
                                  borderColor: `${config.color}30`,
                                }}
                              >
                                {config.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(event.date), "dd MMM yyyy - HH:mm", {
                                  locale: idLocale,
                                })}
                              </span>
                            </div>

                            <div className="truncate text-sm font-semibold text-foreground sm:text-base">
                              {event.title}
                            </div>

                            {event.location ? (
                              <div className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
                                <MapPin className="size-3 shrink-0" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            ) : null}
                          </div>

                          <div className="flex flex-col items-start gap-2 sm:items-end">
                            <span className="inline-flex rounded-md border border-border/50 bg-background/60 px-2 py-1 text-[10px] font-medium text-foreground">
                              {getCountdownLabel(event.date)}
                            </span>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(eventObject) => {
                                  eventObject.stopPropagation();
                                  setUiState({ type: "edit", event });
                                }}
                                className="h-9 rounded-lg px-3 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary"
                              >
                                <Pencil className="mr-1.5 size-3.5" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(eventObject) => {
                                  eventObject.stopPropagation();
                                  setUiState({ type: "delete", targetId: event.id });
                                }}
                                className="h-9 rounded-lg px-3 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="mr-1.5 size-3.5" />
                                Hapus
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>
          </div>

          <div className="flex flex-wrap gap-2 px-5 py-4">
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

        <EventFormCard
          onSuccess={() => setUiState(null)}
          title="Tambah Agenda"
          description="Tambahkan agenda baru setelah mengecek kalender dan agenda terdekat."
        />
      </div>

      <EventEditDialog event={editEvent} onClose={() => setUiState(null)} />

      <EventPreviewDialog
        event={previewEvent}
        onClose={() => setUiState(null)}
        onEdit={(event) => setUiState({ type: "edit", event })}
      />

      <EventDeleteConfirm targetId={deleteTarget} onClose={() => setUiState(null)} />
    </>
  );
}
