"use client";

import type { ScheduleEvent } from "@/types/dashboard";
import { EventFormCard } from "@/components/features/EventFormCard";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

interface EventEditDialogProps {
  event: ScheduleEvent | null;
  onClose: () => void;
}

export function EventEditDialog({ event, onClose }: EventEditDialogProps) {
  return (
    <Dialog open={!!event} onOpenChange={(open) => { if (!open) onClose(); }}>
      {event ? (
        <DialogContent
          showCloseButton
          className="w-[calc(100vw-2rem)] max-w-4xl border-border/50 bg-card p-0 text-foreground sm:max-w-4xl"
        >
          <DialogTitle className="sr-only">Ubah Agenda</DialogTitle>
          <DialogDescription className="sr-only">
            Perbarui detail agenda {event.title} tanpa meninggalkan halaman jadwal.
          </DialogDescription>

          <EventFormCard
            key={event.id}
            editEvent={event}
            onSuccess={onClose}
            title="Ubah Agenda"
            description="Perbarui detail agenda tanpa menggeser form tambah dari posisi utamanya."
            surface="plain"
            hideCancel
            className="p-5"
          />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
