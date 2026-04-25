"use client";

import { type ScheduleEvent } from "@/types/dashboard";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, Clock, MapPin, AlignLeft, Pencil } from "lucide-react";
import { getEventConfig } from "@/lib/config/events";

interface EventPreviewDialogProps {
  event: ScheduleEvent | null;
  onClose: () => void;
  onEdit: (event: ScheduleEvent) => void;
}

function formatJakarta(iso: string | Date, options: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", ...options }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export function EventPreviewDialog({ event, onClose, onEdit }: EventPreviewDialogProps) {
  const cfg = event ? getEventConfig(event.type) : null;
  const Icon = cfg?.icon ?? CalendarDays;

  return (
    <Dialog open={!!event} onOpenChange={() => onClose()}>
      {event && cfg && (
        <DialogContent className="bg-background border-primary/20 text-white w-[calc(100vw-2rem)] sm:max-w-100 p-0 overflow-hidden">
          <div className="relative h-28 flex items-center justify-center overflow-hidden" style={{ backgroundColor: cfg.color + "22" }}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(45deg, #000 0px, #000 1px, transparent 1px, transparent 10px)" }} />
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="size-12 rounded-full flex items-center justify-center" style={{ backgroundColor: cfg.color }}>
                <Icon className="size-6 text-white" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full border" style={{ color: cfg.color, borderColor: cfg.color + "40", backgroundColor: cfg.color + "15" }}>
                {cfg.label}
              </span>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-8 bg-linear-to-t from-[#0f0f11] to-transparent" />
          </div>

          <div className="p-6 pt-4 space-y-5 overflow-hidden">
            <DialogTitle className="font-heading text-2xl tracking-widest uppercase text-white leading-tight wrap-break-word">{event.title}</DialogTitle>

            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0"><CalendarDays size={14} /></div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-0.5">Tanggal</div>
                <div className="text-sm font-semibold text-white/80 wrap-break-word">
                  {formatJakarta(event.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0"><Clock size={14} /></div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-0.5">Waktu</div>
                <div className="text-sm font-semibold text-white/80">{formatJakarta(event.date, { hour: "2-digit", minute: "2-digit", hour12: false })} WIB</div>
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0"><MapPin size={14} /></div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-0.5">Lokasi</div>
                  <div className="text-sm font-semibold text-white/80 wrap-break-word">{event.location}</div>
                </div>
              </div>
            )}

            {event.description && (
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0"><AlignLeft size={14} /></div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-0.5">Keterangan</div>
                  <p className="text-xs leading-relaxed text-white/50 wrap-break-word">{event.description}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { onEdit(event); onClose(); }}
                className="flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.3em] bg-primary/10 border border-primary/30 rounded-xl hover:bg-primary/20 transition-colors text-primary flex items-center justify-center gap-2"
              >
                <Pencil className="size-3" /> Edit
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.3em] bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white/60"
              >
                Tutup
              </button>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
