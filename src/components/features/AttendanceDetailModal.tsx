"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Loader2, CalendarDays, MapPin, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getEventAttendanceDetailAction } from "@/actions/schedule";
import { submitAttendanceAction } from "@/actions/stats";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AttendanceStatus } from "@/types/dashboard";
import { toYYYYMMDD } from "@/lib/date-utils";
import { getEventConfig } from "@/lib/config/events";
import { QUERY_KEYS } from "@/lib/constants";
import { ATTENDANCE_STATUS_STYLE as STATUS_STYLE } from "@/lib/constants/badge-configs";
import { useQueryClient } from "@tanstack/react-query";

type EventDetail = Awaited<ReturnType<typeof getEventAttendanceDetailAction>>;

interface AttendanceDetailModalProps {
  eventId: string;
  onClose: () => void;
}

export function AttendanceDetailModal({ eventId, onClose }: AttendanceDetailModalProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getEventAttendanceDetailAction(eventId)
      .then((data) => {
        setEvent(data);
        if (data.isDraftAttendance) {
          setStatuses({});
        } else {
          const uniqueStatuses = new Map<string, AttendanceStatus>();
          data.attendances.forEach((attendance) => {
            if (!uniqueStatuses.has(attendance.playerId)) {
              uniqueStatuses.set(attendance.playerId, attendance.status as AttendanceStatus);
            }
          });
          setStatuses(Object.fromEntries(uniqueStatuses));
        }
      })
      .catch(() => {
        toast.error("Gagal memuat data presensi. Coba lagi.");
        onClose();
      })
      .finally(() => setLoading(false));
  }, [eventId, onClose]);

  const uniqueAttendances = useMemo(() => {
    if (!event) {
      return [];
    }

    const uniqueByPlayerId = new Map<string, (typeof event.attendances)[number]>();
    event.attendances.forEach((attendance) => {
      if (!uniqueByPlayerId.has(attendance.playerId)) {
        uniqueByPlayerId.set(attendance.playerId, attendance);
      }
    });

    return Array.from(uniqueByPlayerId.values());
  }, [event]);

  const handleMarkAllHadir = () => {
    if (!event) return;
    setStatuses(Object.fromEntries(uniqueAttendances.map((attendance) => [attendance.playerId, "HADIR"] as const)));
    toast.success("Semua pemain ditandai hadir.");
  };

  const handleSave = async () => {
    if (!event) return;

    const unsetCount = uniqueAttendances.filter((attendance) => !statuses[attendance.playerId]).length;
    if (unsetCount > 0) {
      toast.error(`${unsetCount} pemain belum dipilih statusnya. Pilih semua sebelum menyimpan.`);
      return;
    }

    setIsSaving(true);
    try {
      const result = await submitAttendanceAction({
        date: toYYYYMMDD(new Date(event.date)),
        playerStatuses: uniqueAttendances.map((attendance) => ({
          playerId: attendance.playerId,
          status: statuses[attendance.playerId]!,
        })),
        eventId,
      });

      if (!result?.success) {
        throw new Error("Gagal menyimpan presensi.");
      }

      toast.success(`Presensi berhasil disimpan untuk ${result.savedCount} pemain.`);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EVENTS_WITH_ATTENDANCE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PUBLIC_EVENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_METRICS });
      onClose();
    } catch {
      toast.error("Gagal menyimpan presensi. Coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  const unsetCount = uniqueAttendances.filter((attendance) => !statuses[attendance.playerId]).length;
  const isFutureEvent = event ? new Date(event.date) > new Date() : false;

  const stats = uniqueAttendances.reduce(
    (acc, attendance) => {
      const status = statuses[attendance.playerId];
      if (status) acc[status] += 1;
      return acc;
    },
    { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 },
  );

  return (
    <Dialog open={!!eventId} onOpenChange={onClose}>
      <DialogContent className="h-dialog-lg max-w-none w-[96vw] gap-0 overflow-hidden overflow-x-hidden rounded-2xl border-border/50 bg-background p-0 sm:max-w-none sm:rounded-3xl xl:max-w-4xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 p-20">
            <Loader2 className="size-8 animate-spin text-primary/50" />
            <p className="text-sm font-medium text-muted-foreground">Memuat data presensi...</p>
          </div>
        ) : event ? (
          <>
            <div className="relative overflow-hidden border-b border-border/50 bg-card/50 p-6 pb-4">
              <DialogHeader className="relative z-10 space-y-4">
                <div className="space-y-1.5">
                  {(() => {
                    const cfg = getEventConfig(event.type);
                    return (
                      <span
                        className="inline-flex w-fit rounded border px-1.5 py-0.5 text-[10px] font-medium tracking-wide leading-none"
                        style={{ backgroundColor: `${cfg.color}15`, color: cfg.color, borderColor: `${cfg.color}30` }}
                      >
                        {cfg.label}
                      </span>
                    );
                  })()}
                  <DialogTitle className="text-xl font-semibold leading-tight text-foreground">
                    {event.title}
                  </DialogTitle>
                  <DialogDescription className="sr-only">Detail presensi pemain untuk agenda ini.</DialogDescription>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" />
                      <span>{format(new Date(event.date), "dd MMM yyyy - HH:mm", { locale: idLocale })}</span>
                    </div>
                    {event.location ? (
                      <div className="flex items-center gap-1.5">
                        <span className="opacity-30">-</span>
                        <MapPin className="size-3.5" />
                        <span className="max-w-50 truncate">{event.location}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {unsetCount > 0 ? (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-destructive">
                      <span className="text-xs font-medium">Belum Dipilih</span>
                      <span className="text-sm font-black">{unsetCount}</span>
                    </div>
                  ) : null}
                  {(["HADIR", "IZIN", "SAKIT", "ALPA"] as AttendanceStatus[]).map((status) => {
                    const count = stats?.[status] ?? 0;
                    if (count === 0) return null;

                    return (
                      <div
                        key={status}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${STATUS_STYLE[status].badge}`}
                      >
                        <span className="text-xs font-medium">{STATUS_STYLE[status].label}</span>
                        <span className="text-sm font-black">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </DialogHeader>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden p-6">
              {isFutureEvent ? (
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-medium text-amber-500">
                  <CalendarDays className="size-4 shrink-0" />
                  <span>Presensi belum dapat diisi sebelum waktu kegiatan dimulai.</span>
                </div>
              ) : (
                <div className="flex flex-col justify-between gap-4 rounded-xl border border-muted/50 bg-muted/20 p-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <CheckCircle2 className="size-4" />
                    <span>Tandai Semua</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleMarkAllHadir}
                      className={`h-8 border-transparent bg-background px-3 text-xs font-medium hover:border-current hover:bg-background ${STATUS_STYLE.HADIR.color}`}
                    >
                      Semua Hadir
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex min-h-0 flex-1 flex-col space-y-3">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Pemain ({uniqueAttendances.length})
                  </span>
                </div>

                <div className="grid gap-2 overflow-y-auto overflow-x-hidden pr-1">
                  {uniqueAttendances.map((attendance) => {
                    const currentStatus = statuses[attendance.playerId] as AttendanceStatus | undefined;
                    const triggerStyle = currentStatus
                      ? STATUS_STYLE[currentStatus].badge
                      : "border-destructive/30 bg-destructive/5 text-destructive/60";

                    return (
                      <div
                        key={attendance.playerId}
                        className="flex min-w-0 flex-col gap-3 rounded-xl border border-border/50 bg-card p-3 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground">
                            {attendance.player.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-bold text-foreground">
                              {attendance.player.name}
                            </span>
                            <span className="truncate text-[11px] font-medium text-muted-foreground">
                              {(attendance.player as { group?: { name: string } | null }).group?.name || "Tanpa Kelompok"}
                            </span>
                          </div>
                        </div>

                        <Select
                          disabled={isFutureEvent}
                          value={currentStatus ?? ""}
                          onValueChange={(value) =>
                            setStatuses((prev) => ({ ...prev, [attendance.playerId]: value as AttendanceStatus }))
                          }
                        >
                          <SelectTrigger className={`h-9 w-full shrink-0 text-xs font-medium transition-colors sm:w-40 ${triggerStyle}`}>
                            <SelectValue placeholder="Pilih Status" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/50">
                            {(["HADIR", "IZIN", "SAKIT", "ALPA"] as AttendanceStatus[]).map((status) => (
                              <SelectItem key={status} value={status} className="rounded-lg text-xs font-semibold focus:bg-muted">
                                <span className={STATUS_STYLE[status].color}>{STATUS_STYLE[status].label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse justify-end gap-3 rounded-b-2xl border-t border-border/50 bg-card/50 p-6 pt-4 sm:flex-row sm:rounded-b-3xl">
              <Button variant="outline" onClick={onClose} className="h-11 rounded-xl text-sm font-semibold">
                Batal
              </Button>
              <Button onClick={handleSave} disabled={isSaving || isFutureEvent} className="h-11 rounded-xl px-8 text-sm font-semibold">
                {isSaving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 size-4" />
                )}
                Simpan Presensi
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
