"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CalendarDays, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { AttendanceDetailModal } from "./AttendanceDetailModal";
import { getEventConfig } from "@/lib/config/events";
import { useEventsWithAttendance } from "@/hooks/use-events-with-attendance";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { BrandLoader } from "@/components/ui/brand-loader";
import type { getEventsWithAttendanceAction } from "@/actions/schedule";

type EventItem = Awaited<ReturnType<typeof getEventsWithAttendanceAction>>[number];

function AttendanceCardViewInner() {
  const searchParams = useSearchParams();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const { data: events = [], isLoading } = useEventsWithAttendance();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, events]);

  const filteredEvents = useMemo(() => {
    const eventList = events ?? [];
    if (!searchQuery.trim()) {
      return eventList;
    }

    const query = searchQuery.toLowerCase();
    return eventList.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        event.groups.some((group) => group.name.toLowerCase().includes(query)),
    );
  }, [events, searchQuery]);

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);

  const paginatedEvents = useMemo(() => {
    return filteredEvents.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE,
    );
  }, [filteredEvents, currentPage]);

  const groupedByMonth = useMemo(
    () =>
      paginatedEvents.reduce<Record<string, EventItem[]>>((result, event) => {
        const key = format(new Date(event.date), "MMMM yyyy", { locale: idLocale });
        (result[key] ??= []).push(event);
        return result;
      }, {}),
    [paginatedEvents],
  );

  const months = useMemo(
    () =>
      Object.keys(groupedByMonth).sort((left, right) => {
        const leftDate = groupedByMonth[left]?.[0]?.date;
        const rightDate = groupedByMonth[right]?.[0]?.date;
        if (!leftDate || !rightDate) {
          return 0;
        }

        return new Date(rightDate).getTime() - new Date(leftDate).getTime();
      }),
    [groupedByMonth],
  );

  if (isLoading) {
    return <BrandLoader minHeight="min-h-[350px]" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Cari agenda atau nama kelompok..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          aria-label="Cari agenda atau nama kelompok"
          className="h-11 bg-background/50 pl-10"
        />
      </div>

      {months.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/50 text-center">
          <CalendarDays className="mb-1 size-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">
            {searchQuery ? "Hasil tidak ditemukan" : "Belum ada agenda yang tercatat"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/75">
            {searchQuery
              ? "Coba gunakan kata kunci pencarian yang berbeda."
              : "Belum ada agenda yang tercatat untuk kelompok yang bisa Anda akses."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {months.map((monthKey) => (
            <div key={monthKey}>
              <div className="mb-2 flex items-center gap-3">
                <span className="h-5 w-1 rounded-full bg-primary" />
                <h2 className="text-base font-semibold text-foreground">
                  {monthKey}
                </h2>
              </div>

              <div className="space-y-2">
                {groupedByMonth[monthKey].map((event) => {
                  const eventDate = new Date(event.date);
                  const markedAtDate = event.attendanceMarkedAt
                    ? new Date(event.attendanceMarkedAt)
                    : null;
                  const config = getEventConfig(event.type);

                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setSelectedEventId(event.id)}
                      className="group w-full rounded-xl border border-border/50 bg-card px-4 py-3 text-left shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/20"
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
                              {format(eventDate, "dd MMM yyyy - HH:mm", {
                                locale: idLocale,
                              })}
                            </span>
                          </div>

                          <div className="truncate text-sm font-semibold text-foreground sm:text-base">
                            {event.title}
                          </div>

                          {event.groups.length > 0 ? (
                            <div className="truncate text-[11px] text-muted-foreground">
                              {event.groups.map((group) => group.name).join(", ")}
                            </div>
                          ) : null}
                        </div>

                        <div className="justify-self-start sm:justify-self-end">
                          {event.isAttendanceSubmitted ? (
                            <div className="inline-flex items-center rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-500">
                              Sudah Diisi
                              {markedAtDate
                                ? ` - ${format(markedAtDate, "dd MMM HH:mm", {
                                    locale: idLocale,
                                  })}`
                                : ""}
                            </div>
                          ) : (
                            <div className="inline-flex items-center rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-500">
                              Belum Diisi
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-6 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      ) : null}

      {selectedEventId ? (
        <AttendanceDetailModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
        />
      ) : null}
    </div>
  );
}

export function AttendanceCardView() {
  return (
    <Suspense>
      <AttendanceCardViewInner />
    </Suspense>
  );
}
