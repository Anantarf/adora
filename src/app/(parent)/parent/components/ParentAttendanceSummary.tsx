import { useMemo } from "react";
import { Loader2, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ATTENDANCE_STATUS_STYLE as STATUS_STYLE } from "@/lib/constants/badge-configs";
import type { AttendanceStatus, Attendance } from "@/types/dashboard";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { getEventConfig } from "@/lib/config/events";


function getAttendanceRateColor(rate: number): string {
  if (rate >= 75) return "text-emerald-500";
  if (rate >= 50) return "text-amber-500";
  return "text-destructive";
}

export function ParentAttendanceSummary({ 
  attendanceSummary, 
  attendances, 
  attendanceLoading, 
  activeChildName,
  periodLabel,
}: { 
  attendanceSummary: { counts: Record<AttendanceStatus, number>; rate: number } | null; 
  attendances: (Omit<Attendance, "event"> & { event?: { title: string; type: string } | null })[] | undefined; 
  attendanceLoading: boolean; 
  activeChildName: string;
  periodLabel?: string | null;
}) {
  const attendanceRateColor = useMemo(
    () => getAttendanceRateColor(attendanceSummary?.rate ?? 0),
    [attendanceSummary?.rate],
  );

  return (
    <Card className="border-border/50 bg-card overflow-hidden shadow-sm lg:col-span-2">
      <CardHeader className="border-b border-border/50 bg-muted/10 pb-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-4 text-primary" />
          <div>
            <CardTitle className="text-lg font-heading uppercase tracking-wide text-primary">Rekap Kehadiran</CardTitle>
            <CardDescription className="text-xs">
              {activeChildName} dari {attendances?.length ?? 0} agenda{periodLabel ? ` pada ${periodLabel}` : " terakhir"}.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        {attendanceLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-primary font-bold text-xs uppercase tracking-widest">
            <Loader2 className="size-4 animate-spin" /> Memuat data kehadiran...
          </div>
        ) : !attendances?.length ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <ClipboardCheck className="size-8 text-muted-foreground/30 mb-1" />
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Data Kehadiran Belum Tersedia</p>
            <p className="text-xs text-muted-foreground/75">Riwayat kehadiran akan tampil di sini setelah kehadiran dicatat untuk agenda latihan atau pertandingan.</p>
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)] xl:items-start">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Persentase Kehadiran</span>
                <span className={`text-2xl font-black tabular-nums ${attendanceRateColor}`}>
                  {attendanceSummary?.rate ?? 0}%
                </span>
              </div>
              {(["HADIR", "IZIN", "SAKIT", "ALPA"] as AttendanceStatus[]).map((s) => (
                <div key={s} className={`flex flex-1 items-center justify-between gap-2 px-3 py-1.5 rounded-lg border ${STATUS_STYLE[s].badge}`}>
                  <span className="text-micro">{STATUS_STYLE[s].label}</span>
                  <span className="text-sm font-black tabular-nums">{attendanceSummary?.counts[s] ?? 0}</span>
                </div>
              ))}
            </div>

            <div className="flex min-h-0 flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3 px-1">
                <p className="text-micro text-muted-foreground/50">Agenda Periode Ini</p>
                <p className="text-[10px] font-medium text-muted-foreground">{attendances.length} agenda</p>
              </div>
              <div className="scrollbar-compact flex max-h-56 flex-col gap-1.5 overflow-y-auto pr-1">
                {attendances.map((a) => {
                  const eventLabel = a.event ? getEventConfig(a.event.type).label : "Agenda";
                  const eventTitle = a.event?.title ?? eventLabel;
                  return (
                    <div key={a.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 transition-colors">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-foreground truncate">{eventTitle}</span>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{format(new Date(a.date), "EEEE, dd MMM yyyy", { locale: idLocale })}</span>
                      </div>
                      <span className={`shrink-0 text-micro px-2.5 py-1 rounded-lg border ${STATUS_STYLE[a.status as AttendanceStatus].badge}`}>{STATUS_STYLE[a.status as AttendanceStatus].label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
