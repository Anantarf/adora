"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, isSameDay } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CalendarDays, MapPin, Clock, AlignLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getEventConfig } from "@/lib/config/events";
import { type ScheduleEvent } from "@/types/dashboard";

type PublicEvent = {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  type: string;
  location: string | null;
};

export function ClubSchedule({ initialEvents }: { initialEvents: ScheduleEvent[] }) {
  const [selectedEvent, setSelectedEvent] = useState<PublicEvent | null>(null);

  // Convert dates string to Date objects
  const events: PublicEvent[] = initialEvents.map(ev => ({
    ...ev,
    date: new Date(ev.date)
  }));
  
  // Logic filter dipindah ke server (getPublicEventsAction), di sini hanya menampilkan apa yang ada.
  const upcomingEvents = events;

  return (
    <div className="max-w-4xl mx-auto">
      {upcomingEvents.length === 0 ? (
        <div className="relative max-w-2xl mx-auto bg-[#111113] border border-primary/20 rounded-2xl h-64 overflow-hidden">
          <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(135deg, rgba(212,175,55,0.07) 0px, rgba(212,175,55,0.07) 1px, transparent 1px, transparent 28px)" }} />
          <div className="relative z-10 h-full flex flex-col items-center justify-center gap-3 text-center px-6">
            <span className="font-heading text-5xl tracking-widest text-primary/10 uppercase">Jadwal</span>
            <div className="w-8 h-px bg-primary/20" />
            <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/20">Belum ada agenda terdekat</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {upcomingEvents.map((ev) => (
              <motion.button
                key={ev.id}
                layoutId={`event-${ev.id}`}
                onClick={() => setSelectedEvent(ev)}
                className="group relative bg-[#111113] border border-primary/20 rounded-2xl p-6 text-left overflow-hidden transition-all hover:border-primary/50 hover:bg-primary/[0.02]"
              >
                {/* Visual patterns */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(135deg, rgba(212,175,55,0.1) 0px, rgba(212,175,55,0.1) 1px, transparent 1px, transparent 20px)" }} />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {getEventConfig(ev.type).label}
                    </span>
                    <div className="text-white/20 group-hover:text-primary/40 transition-colors">
                      <CalendarDays size={14} />
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="font-heading text-xl text-white group-hover:text-primary transition-colors leading-tight">
                      {ev.title}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                       {format(ev.date, "d MMMM yyyy", { locale: idLocale })} • {format(ev.date, "HH:mm")} WIB
                    </span>
                    {ev.location && (
                      <span className="text-[8px] font-medium text-white/20 uppercase tracking-widest truncate">
                        @ {ev.location}
                      </span>
                    )}
                  </div>
                </div>

                {/* Accent corner */}
                <div className="absolute top-0 right-0 w-8 h-8 bg-primary/5 group-hover:bg-primary/20 transition-colors" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal Detail */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="bg-[#0f0f11] border-primary/20 text-white sm:max-w-[400px] p-0 overflow-hidden">
          <div className="relative h-32 bg-primary flex items-center justify-center overflow-hidden">
             {/* Abstract basketball pattern / lines */}
             <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(45deg, #000 0px, #000 1px, transparent 1px, transparent 10px)" }} />
             <div className="relative z-10 font-heading text-5xl md:text-6xl tracking-[0.2em] text-black/20 uppercase select-none">
                {selectedEvent ? getEventConfig(selectedEvent.type).accent : ''}
             </div>
             <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#0f0f11] to-transparent" />
          </div>

          <div className="p-8 pt-4">
            <div className="flex items-center gap-2 mb-6">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  {selectedEvent ? getEventConfig(selectedEvent.type).label : ''}
               </span>
            </div>

            <DialogTitle className="font-heading text-3xl tracking-widest uppercase mb-4 text-white">
              {selectedEvent?.title}
            </DialogTitle>

            <div className="space-y-6">
               <div className="flex items-start gap-4">
                  <div className="mt-1 size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                    <CalendarDays size={16} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Hari & Tanggal</div>
                    <div className="text-sm font-semibold text-white/80">
                      {selectedEvent ? format(selectedEvent.date, "EEEE, dd MMMM yyyy", { locale: idLocale }) : ""}
                    </div>
                  </div>
               </div>

               <div className="flex items-start gap-4">
                  <div className="mt-1 size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                    <Clock size={16} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Waktu</div>
                    <div className="text-sm font-semibold text-white/80">
                      {selectedEvent ? format(selectedEvent.date, "HH:mm", { locale: idLocale }) : ""} WIB
                    </div>
                  </div>
               </div>

               {selectedEvent?.location && (
                 <div className="flex items-start gap-4">
                    <div className="mt-1 size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Lokasi</div>
                      <div className="text-sm font-semibold text-white/80">{selectedEvent.location}</div>
                    </div>
                 </div>
               )}

               {selectedEvent?.description && (
                 <div className="flex items-start gap-4">
                    <div className="mt-1 size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                      <AlignLeft size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Keterangan</div>
                      <p className="text-xs leading-relaxed text-white/50">{selectedEvent.description}</p>
                    </div>
                 </div>
               )}
            </div>

            <div className="mt-10">
               <button 
                onClick={() => setSelectedEvent(null)}
                className="w-full py-4 text-[10px] font-bold uppercase tracking-[0.3em] bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white/60"
               >
                 Tutup Detail
               </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
