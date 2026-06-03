"use client";

import { type ScheduleEvent } from "@/types/dashboard";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, Clock, MapPin, AlignLeft, Pencil, Users } from "lucide-react";
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
    return "-";
  }
}

export function EventPreviewDialog({ event, onClose, onEdit }: EventPreviewDialogProps) {
  const cfg = event ? getEventConfig(event.type) : null;
  const Icon = cfg?.icon ?? CalendarDays;

  return (
    <Dialog open={!!event} onOpenChange={() => onClose()}>
      {event && cfg && (
        <DialogContent className="w-[calc(100vw-2rem)] overflow-hidden border-primary/20 bg-background p-0 text-white sm:max-w-100">
          <div
            className="relative flex h-28 items-center justify-center overflow-hidden"
            style={{ backgroundColor: `${cfg.color}22` }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, #000 0px, #000 1px, transparent 1px, transparent 10px)",
              }}
            />
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="flex size-12 items-center justify-center rounded-full" style={{ backgroundColor: cfg.color }}>
                <Icon className="size-6 text-white" strokeWidth={2} />
              </div>
              <span
                className="rounded-full border px-3 py-1 text-[10px] font-medium tracking-wide"
                style={{
                  color: cfg.color,
                  borderColor: `${cfg.color}40`,
                  backgroundColor: `${cfg.color}15`,
                }}
              >
                {cfg.label}
              </span>
            </div>
            <div className="absolute bottom-0 left-0 h-8 w-full bg-linear-to-t from-[#0f0f11] to-transparent" />
          </div>

          <div className="space-y-5 overflow-hidden p-6 pt-4">
            <DialogTitle className="wrap-break-word text-xl font-semibold leading-tight text-white">
              {event.title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Detail agenda {event.title} - {cfg.label}
            </DialogDescription>

            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-primary">
                <CalendarDays size={14} />
              </div>
              <div className="min-w-0">
                <div className="mb-0.5 text-xs font-medium text-white/50">Tanggal</div>
                <div className="wrap-break-word text-sm font-semibold text-white/80">
                  {formatJakarta(event.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>
            </div>

            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-primary">
                <Clock size={14} />
              </div>
              <div className="min-w-0">
                <div className="mb-0.5 text-xs font-medium text-white/50">Waktu</div>
                <div className="text-sm font-semibold text-white/80">
                  {formatJakarta(event.date, { hour: "2-digit", minute: "2-digit", hour12: false })} WIB
                </div>
              </div>
            </div>

            {event.location && (
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-primary">
                  <MapPin size={14} />
                </div>
                <div className="min-w-0">
                  <div className="mb-0.5 text-xs font-medium text-white/50">Lokasi</div>
                  <div className="wrap-break-word text-sm font-semibold text-white/80">{event.location}</div>
                </div>
              </div>
            )}

            {event.groups && event.groups.length > 0 && (
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-primary">
                  <Users size={14} />
                </div>
                <div className="min-w-0">
                  <div className="mb-0.5 text-xs font-medium text-white/50">Kelompok Latihan</div>
                  <div className="wrap-break-word text-sm font-semibold text-white/80">
                    {event.groups.map((g) => g.name).join(", ")}
                  </div>
                </div>
              </div>
            )}

            {event.description && (
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-primary">
                  <AlignLeft size={14} />
                </div>
                <div className="min-w-0">
                  <div className="mb-0.5 text-xs font-medium text-white/50">Keterangan</div>
                  <p className="wrap-break-word text-xs leading-relaxed text-white/50">{event.description}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onEdit(event);
                  onClose();
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 py-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                <Pencil className="size-3" /> Ubah
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10"
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
