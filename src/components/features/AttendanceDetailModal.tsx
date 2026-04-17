"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getEventAttendanceDetailAction } from "@/actions/schedule";
import { submitAttendanceAction } from "@/actions/stats";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AttendanceStatus } from "@/types/dashboard";
import { StatsBadge } from "./AttendanceCardView";
import { toYYYYMMDD } from "@/lib/date-utils";

type EventDetail = Awaited<ReturnType<typeof getEventAttendanceDetailAction>>;

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; className: string }[] = [
  { value: "HADIR", label: "HADIR", className: "text-green-600 font-bold" },
  { value: "IZIN",  label: "IZIN",  className: "text-amber-600 font-bold" },
  { value: "SAKIT", label: "SAKIT", className: "text-orange-600 font-bold" },
  { value: "ALPA",  label: "ALPA",  className: "text-red-600 font-bold" },
];

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
        setStatuses(Object.fromEntries(data.attendances.map((a) => [a.playerId, a.status as AttendanceStatus])));
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
        onClose();
      })
      .finally(() => setLoading(false));
  }, [eventId]); // onClose sengaja tidak dimasukkan — fungsi inline, bukan state

  const handleMarkAll = (status: AttendanceStatus) => {
    if (!event) return;
    setStatuses(Object.fromEntries(event.attendances.map((a) => [a.playerId, status])));
    toast.info(`Semua ditandai sebagai ${status}`);
  };

  const handleSave = async () => {
    if (!event) return;
    setIsSaving(true);
    try {
      await submitAttendanceAction({
        date: toYYYYMMDD(new Date(event.date)),
        playerStatuses: event.attendances.map((a) => ({
          playerId: a.playerId,
          status: statuses[a.playerId] ?? "HADIR",
        })),
        eventId,
      });
      toast.success("Presensi berhasil disimpan");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setIsSaving(false);
    }
  };

  const stats = event?.attendances.reduce(
    (acc, a) => {
      const s = statuses[a.playerId] ?? "HADIR";
      return { ...acc, [s]: acc[s] + 1 };
    },
    { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 }
  );

  return (
    <Dialog open={!!eventId} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : event ? (
          <>
            <DialogHeader>
              <DialogTitle>{event.title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(event.date), "dd MMMM yyyy HH:mm", { locale: idLocale })}
              </p>
              {event.groups.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {event.groups.map((g) => g.name).join(", ")}
                </p>
              )}
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex gap-2">
                {(["HADIR", "IZIN", "SAKIT", "ALPA"] as AttendanceStatus[]).map((s) => (
                  <StatsBadge key={s} status={s} value={stats?.[s] ?? 0} />
                ))}
              </div>

              <div className="flex gap-2 flex-wrap">
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <Button
                    key={value}
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkAll(value)}
                    className={`border-current/30 hover:bg-current/5`}
                  >
                    Semua {label}
                  </Button>
                ))}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-xs">Nama Pemain</TableHead>
                      <TableHead className="text-xs text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {event.attendances.map((a) => (
                      <TableRow key={a.playerId}>
                        <TableCell className="text-sm font-medium">{a.player.name}</TableCell>
                        <TableCell className="text-right">
                          <Select
                            value={statuses[a.playerId] ?? "HADIR"}
                            onValueChange={(val) =>
                              setStatuses((prev) => ({ ...prev, [a.playerId]: val as AttendanceStatus }))
                            }
                          >
                            <SelectTrigger className="w-[120px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map(({ value, label, className }) => (
                                <SelectItem key={value} value={value}>
                                  <span className={className}>{label}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={onClose}>Batal</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Simpan Presensi
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
