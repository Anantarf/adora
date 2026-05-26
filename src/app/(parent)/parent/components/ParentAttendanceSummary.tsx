import { Loader2, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ATTENDANCE_STATUS_STYLE as STATUS_STYLE } from "@/lib/constants/badge-configs";
import type { AttendanceStatus, Attendance } from "@/types/dashboard";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { getEventConfig } from "@/lib/config/events";

export function ParentAttendanceSummary({ 
  attendanceSummary, 
  attendances, 
  attendanceLoading, 
  activeChildName 
}: { 
  attendanceSummary: { counts: Record<AttendanceStatus, number>; rate: number } | null; 
  attendances: (Omit<Attendance, "event"> & { event?: { title: string; type: string } | null })[] | undefined; 
  attendanceLoading: boolean; 
  activeChildName: string;
}) {
  return (
    <Card className="border-border/50 bg-card overflow-hidden shadow-sm lg:col-span-2">
      <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-5 text-primary" />
          <div>
            <CardTitle className="text-lg font-heading uppercase tracking-wide text-primary">Rekap Kehadiran</CardTitle>
            <CardDescription className="text-xs">Riwayat kehadiran {activeChildName} dalam 50 agenda terakhir.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {attendanceLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-primary font-bold text-xs uppercase tracking-widest">
            <Loader2 className="size-4 animate-spin" /> Memuat data kehadiran...
          </div>
        ) : !attendances?.length ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <ClipboardCheck className="size-8 text-muted-foreground/30 mb-1" />
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Belum ada data kehadiran</p>
            <p className="text-xs text-muted-foreground/75">Data kehadiran akan muncul setelah pelatih mengisi presensi agenda.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Summary strip */}
            <div className="flex flex-wrap gap-3 items-center">
              {(["HADIR", "IZIN", "SAKIT", "ALPA"] as AttendanceStatus[]).map((s) => (
                <div key={s} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${STATUS_STYLE[s].badge}`}>
                  <span className="text-micro">{STATUS_STYLE[s].label}</span>
                  <span className="text-sm font-black tabular-nums">{attendanceSummary?.counts[s] ?? 0}</span>
                </div>
              ))}
              <div className="w-full sm:w-auto sm:ml-auto flex items-center justify-between sm:justify-start gap-2 px-4 py-1.5 rounded-lg border border-primary/20 bg-primary/5">
                <span className="text-micro text-muted-foreground">Tingkat Kehadiran</span>
                <span className={`text-sm font-black tabular-nums ${(attendanceSummary?.rate ?? 0) >= 75 ? "text-emerald-500" : (attendanceSummary?.rate ?? 0) >= 50 ? "text-amber-500" : "text-destructive"}`}>
                  {attendanceSummary?.rate ?? 0}%
                </span>
              </div>
            </div>

            {/* Record list */}
            <div className="flex flex-col gap-1.5">
              <p className="text-micro text-muted-foreground/50 px-1 mb-1">10 Agenda Terakhir</p>
              {attendances.slice(0, 10).map((a) => {
                const eventLabel = a.event ? getEventConfig(a.event.type).label : "Agenda";
                const eventTitle = a.event?.title ?? eventLabel;
                return (
                  <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 transition-colors">
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
        )}
      </CardContent>
    </Card>
  );
}
