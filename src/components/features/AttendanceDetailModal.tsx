"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Loader2, CalendarDays, MapPin, Users, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getEventAttendanceDetailAction } from "@/actions/schedule";
import { submitAttendanceAction } from "@/actions/stats";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AttendanceStatus } from "@/types/dashboard";
import { toYYYYMMDD } from "@/lib/date-utils";
import { getEventConfig } from "@/lib/config/events";

type EventDetail = Awaited<ReturnType<typeof getEventAttendanceDetailAction>>;

const STATUS_STYLE: Record<AttendanceStatus, { label: string; color: string; badge: string }> = {
  HADIR: { label: "HADIR", color: "text-emerald-500", badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  IZIN: { label: "IZIN", color: "text-amber-500", badge: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  SAKIT: { label: "SAKIT", color: "text-orange-500", badge: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  ALPA: { label: "ALPA", color: "text-destructive", badge: "bg-destructive/10 text-destructive border-destructive/20" },
};

interface AttendanceDetailModalProps {
  eventId: string;
  onClose: () => void;
}

export function AttendanceDetailModal({ eventId, onClose }: AttendanceDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getEventAttendanceDetailAction(eventId)
      .then((data) => {
        setEvent(data);
        // Draft: kosongkan agar admin wajib pilih eksplisit, bukan assume semua HADIR
        if (data.isDraftAttendance) {
          setStatuses({});
        } else {
          setStatuses(Object.fromEntries(data.attendances.map((a) => [a.playerId, a.status as AttendanceStatus])));
        }
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
        onClose();
      })
      .finally(() => setLoading(false));
  }, [eventId]); // onClose intentionally excluded — inline arrow ref changes every parent render

  const handleMarkAllHadir = () => {
    if (!event) return;
    setStatuses(Object.fromEntries(event.attendances.map((a) => [a.playerId, "HADIR"] as const)));
    toast.success("Semua ditandai HADIR");
  };

  const handleSave = async () => {
    if (!event) return;

    const unsetCount = event.attendances.filter((a) => !statuses[a.playerId]).length;
    if (unsetCount > 0) {
      toast.error(`${unsetCount} pemain belum dipilih statusnya. Pilih semua sebelum menyimpan.`);
      return;
    }

    setIsSaving(true);
    try {
      const result = await submitAttendanceAction({
        date: toYYYYMMDD(new Date(event.date)),
        playerStatuses: event.attendances.map((a) => ({
          playerId: a.playerId,
          status: statuses[a.playerId]!,
        })),
        eventId,
      });

      if (!result?.success) {
        throw new Error("Gagal menyimpan presensi.");
      }

      toast.success(`Presensi berhasil disimpan (${result.savedCount} pemain)`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setIsSaving(false);
    }
  };

  const unsetCount = event?.attendances.filter((a) => !statuses[a.playerId]).length ?? 0;

  const stats = event?.attendances.reduce(
    (acc, attendance) => {
      const status = statuses[attendance.playerId];
      if (status) acc[status] += 1;
      return acc;
    },
    { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 },
  );

  return (
    <Dialog open={!!eventId} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] xl:max-w-4xl max-w-none sm:max-w-none h-dialog-lg p-0 gap-0 bg-background border-border/50 rounded-2xl sm:rounded-3xl overflow-hidden overflow-x-hidden flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-3">
            <Loader2 className="size-8 animate-spin text-primary/50" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Memuat data presensi...</p>
          </div>
        ) : event ? (
          <>
            {/* Header Section */}
            <div className="p-6 pb-4 border-b border-border/50 bg-card/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

              <DialogHeader className="relative z-10 space-y-4">
                <div className="space-y-1.5">
                  {(() => {
                    const cfg = getEventConfig(event.type);
                    return (
                      <span className="inline-flex w-fit px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.15em] border leading-none" style={{ backgroundColor: `${cfg.color}15`, color: cfg.color, borderColor: `${cfg.color}30` }}>
                        {cfg.label}
                      </span>
                    );
                  })()}
                  <DialogTitle className="font-heading text-2xl uppercase tracking-widest text-foreground leading-tight">{event.title}</DialogTitle>
                  <DialogDescription className="sr-only">Detail Manajemen Absensi Pemain</DialogDescription>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" />
                      <span>{format(new Date(event.date), "dd MMM yyyy • HH:mm", { locale: idLocale })}</span>
                    </div>
                    {event.location && (
                      <>
                        <span className="opacity-30">•</span>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="size-3.5" />
                          <span className="truncate max-w-50">{event.location}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {unsetCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Belum Dipilih</span>
                      <span className="text-sm font-black">{unsetCount}</span>
                    </div>
                  )}
                  {(["HADIR", "IZIN", "SAKIT", "ALPA"] as AttendanceStatus[]).map((s) => {
                    const count = stats?.[s] ?? 0;
                    if (count === 0) return null;
                    return (
                      <div key={s} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${STATUS_STYLE[s].badge}`}>
                        <span className="text-[10px] font-bold uppercase tracking-widest">{STATUS_STYLE[s].label}</span>
                        <span className="text-sm font-black">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </DialogHeader>
            </div>

            {/* Main Content */}
            <div className="p-6 flex-1 min-h-0 flex flex-col gap-6 overflow-hidden">
              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/20 border border-muted/50">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <CheckCircle2 className="size-4" />
                  <span>Tandai Semua</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleMarkAllHadir}
                    className={`h-8 px-3 text-[10px] font-bold uppercase tracking-widest border-transparent hover:border-current bg-background hover:bg-background ${STATUS_STYLE.HADIR.color}`}
                  >
                    Semua Hadir
                  </Button>
                </div>
              </div>

              {/* Player List */}
              <div className="space-y-3 flex-1 min-h-0 flex flex-col">
                <div className="flex items-center justify-between px-1 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pemain ({event.attendances.length})</span>
                </div>

                <div className="grid gap-2 overflow-y-auto overflow-x-hidden pr-1">
                  {event.attendances.map((a) => {
                    const currentStatus = statuses[a.playerId] as AttendanceStatus | undefined;
                    const triggerStyle = currentStatus
                      ? STATUS_STYLE[currentStatus].badge
                      : "border-destructive/30 text-destructive/60 bg-destructive/5";
                    return (
                      <div key={a.playerId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors gap-3 sm:gap-4 min-w-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-heading text-sm shrink-0">{a.player.name.charAt(0).toUpperCase()}</div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold truncate text-foreground">{a.player.name}</span>
                            {a.player.schoolOrigin && <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">{a.player.schoolOrigin}</span>}
                          </div>
                        </div>

                        <Select value={currentStatus ?? ""} onValueChange={(val) => setStatuses((prev) => ({ ...prev, [a.playerId]: val as AttendanceStatus }))}>
                          <SelectTrigger className={`w-full sm:w-40 h-9 text-[10px] font-bold uppercase tracking-widest ${triggerStyle} transition-colors shrink-0`}>
                            <SelectValue placeholder="Pilih Status" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/50">
                            {(["HADIR", "IZIN", "SAKIT", "ALPA"] as AttendanceStatus[]).map((s) => (
                              <SelectItem key={s} value={s} className="rounded-lg text-xs font-bold focus:bg-muted">
                                <span className={STATUS_STYLE[s].color}>{STATUS_STYLE[s].label}</span>
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

            {/* Footer */}
            <div className="p-6 pt-4 border-t border-border/50 bg-card/50 flex flex-col-reverse sm:flex-row justify-end gap-3 rounded-b-2xl sm:rounded-b-3xl">
              <Button variant="outline" onClick={onClose} className="h-11 rounded-xl font-bold text-xs uppercase tracking-widest">
                Batal
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="h-11 rounded-xl font-bold text-xs uppercase tracking-widest px-8">
                {isSaving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <CheckCircle2 className="size-4 mr-2" />}
                Simpan Presensi
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
