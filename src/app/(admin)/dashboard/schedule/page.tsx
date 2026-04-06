"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { useSchedule, useAddEvent, useDeleteEvent } from "@/hooks/use-schedule";
import { type ScheduleEvent } from "@/types/dashboard";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, Plus, Loader2, Trash2, MapPinned, AlignLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format, isSameDay } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import { EVENT_TYPES, getEventConfig } from "@/lib/config/events";

const eventSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  location: z.string().optional(),
  type: z.string().min(1, "Tipe agenda wajib dipilih"),
  time: z.string().min(1, "Waktu wajib diisi"),
});

type EventFormValues = z.infer<typeof eventSchema>;

export default function SchedulePage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [open, setOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Default time context
  const now = new Date();
  const currentHH = now.getHours().toString().padStart(2, "0");
  const currentMM = now.getMinutes().toString().padStart(2, "0");

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      location: "",
      type: "LATIHAN",
      time: `${currentHH}:${currentMM}`,
    }
  });

  const selectedType = watch("type");
  const selectedTime = watch("time");

  const { data: events, isLoading } = useSchedule();
  const { mutateAsync: addEvent, isPending } = useAddEvent();
  const { mutateAsync: deleteEvent } = useDeleteEvent();

  const onSubmit = async (data: EventFormValues) => {
    if (!date) return toast.error("Pilih tanggal terlebih dahulu!");
    
    try {
      // Fix Timezone Logic: Combine Date (YMD) and Time (HM) into ISO string with +07:00 (WIB)
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const isoWithWib = `${year}-${month}-${day}T${data.time}:00+07:00`;

      await addEvent({ 
        title: data.title, 
        location: data.location, 
        type: data.type, 
        date: isoWithWib 
      });
      
      toast.success("Jadwal sukses ditambahkan!");
      setOpen(false);
      reset();
    } catch {
      toast.error("Gagal menambahkan jadwal");
    }
  };

  const selectedEvents = (events || []).filter(
    (ev) => date && ev.date ? isSameDay(new Date(ev.date), date) : false
  );

  const modifierHasEvent = (day: Date) =>
    (events || []).some((ev) => isSameDay(new Date(ev.date), day));

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-8 w-full max-w-7xl mx-auto"
      >
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
            <h1 className="text-5xl md:text-6xl font-heading uppercase tracking-widest text-foreground">Jadwal Klub</h1>
            <p className="text-muted-foreground font-medium max-w-lg border-l-2 border-primary/40 pl-4 py-1 tracking-wide">
              Kelola seluruh agenda klub — latihan rutin, pertandingan, evaluasi, dan kegiatan khusus.
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button size="lg" className="uppercase font-bold tracking-widest text-xs h-11 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  <Plus className="mr-2 size-4" /> Tambah Agenda
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[425px] bg-card border-border/50">
              <DialogHeader>
                <DialogTitle className="text-xl font-heading uppercase text-secondary">Tambah Agenda Klub</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground">Tanggal Pelaksanaan</label>
                    <div className="h-11 rounded-lg border border-border bg-muted/50 px-3 flex items-center text-sm font-semibold text-secondary opacity-70 truncate">
                      {date ? format(date, "dd MMM yyyy", { locale: idLocale }) : "Pilih Kalender"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground">Waktu</label>
                    <Input
                      type="time"
                      {...register("time")}
                      className="h-11 font-semibold"
                    />
                    {errors.time && <p className="text-[10px] text-destructive">{errors.time.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground">Jenis Kegiatan</label>
                  <Select value={selectedType} onValueChange={(val: string | null) => { if (val) setValue("type", val); }}>
                    <SelectTrigger className="h-11 font-semibold">
                      <SelectValue placeholder="Tipe Agenda" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(EVENT_TYPES).map((config) => (
                        <SelectItem key={config.id} value={config.id}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-[10px] text-destructive">{errors.type.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground">Nama Kegiatan</label>
                  <Input
                    {...register("title")}
                    placeholder="Contoh: Latihan Pagi KU-15"
                    className="h-11 font-semibold placeholder:font-medium"
                  />
                  {errors.title && <p className="text-[10px] text-destructive">{errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground">Lokasi</label>
                  <Input
                    {...register("location")}
                    placeholder="Contoh: Lapangan GOR Citra"
                    className="h-11 font-semibold placeholder:font-medium"
                  />
                </div>
                <Button type="submit" disabled={isPending} className="w-full h-11 mt-2 text-primary-foreground font-bold tracking-widest uppercase">
                  {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : "Simpan"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10 w-full">

          {/* INTERACTIVE CALENDAR */}
          <Card className="lg:col-span-6 glass-card p-6 md:p-8 rounded-[3rem] border-white/20 relative group overflow-hidden">
            <div className="absolute top-0 right-0 size-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors" />
            <div className="flex items-center gap-2 mb-1 relative z-10">
              <CalendarDays className="size-5 text-primary" />
              <h2 className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground flex-1">Pilih Tanggal</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setDate(new Date())} 
                className="h-7 px-3 text-[10px] font-bold tracking-widest uppercase text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
              >
                Hari Ini
              </Button>
            </div>
            
            <div className="-mt-2 flex justify-center w-full relative z-10">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="bg-transparent p-0 [--cell-size:3rem] lg:[--cell-size:3.2rem] xl:[--cell-size:3.5rem] 2xl:[--cell-size:3.8rem] transition-all"
                modifiers={{ hasEvent: modifierHasEvent }}
                modifiersStyles={{ hasEvent: { fontWeight: "900", color: "#FDB813", textDecoration: "underline", textUnderlineOffset: "4px" } }}
                classNames={{
                  vhidden: "hidden",
                  day_selected: "bg-primary text-primary-foreground font-bold shadow-md",
                }}
              />
            </div>
          </Card>

          {/* FEED KEGIATAN */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-secondary text-secondary-foreground rounded-[2rem] shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-[10px] text-primary font-black uppercase tracking-[0.2em] block mb-1">Agenda Tanggal Terpilih</span>
                <h3 className="text-2xl font-black italic">
                  {date ? format(date, "EEEE, dd MMMM yyyy", { locale: idLocale }) : "Pilih tanggal di kalender"}
                </h3>
              </div>
              <div className="size-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner relative z-10 mt-4 md:mt-0">
                <span className="font-heading text-2xl text-primary">{selectedEvents.length}</span>
              </div>
              <div className="absolute right-0 top-0 w-32 h-full bg-primary/20 skew-x-[-20deg] translate-x-12" />
            </div>

            <div className="flex flex-col gap-4">
              {isLoading ? (
                <div className="flex h-32 items-center justify-center glass-card rounded-[2rem]">
                  <Loader2 className="size-8 animate-spin text-primary" />
                </div>
              ) : selectedEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 glass-card rounded-[2rem] border-dashed border-2 opacity-70">
                  <CalendarDays className="size-10 text-muted-foreground mb-3 opacity-50" />
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Belum Ada Agenda</p>
                  <span className="text-xs text-muted-foreground mt-1">Klik &ldquo;Tambah Agenda&rdquo; untuk menjadwalkan kegiatan.</span>
                </div>
              ) : (
                selectedEvents.map((ev: ScheduleEvent) => (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card p-6 rounded-3xl flex items-center justify-between group transition-all hover:bg-white/60 dark:hover:bg-white/5"
                  >
                    <div className="flex items-center gap-5">
                      <div className="size-14 rounded-full flex items-center justify-center bg-secondary/5 border-2 border-primary/20 text-primary">
                        <AlignLeft className="size-6" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-1 flex items-center gap-2">
                          <span className="size-1.5 rounded-full" style={{ backgroundColor: getEventConfig(ev.type).color }} />
                          {getEventConfig(ev.type).label} • {ev.date ? format(new Date(ev.date), "HH:mm") : "00:00"} WIB
                        </span>
                        <h4 className="text-xl font-bold text-secondary">{ev.title}</h4>
                        {ev.location && (
                          <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPinned className="size-3" /> {ev.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTargetId(ev.id)}
                      className="text-destructive/50 hover:text-destructive hover:bg-destructive/10 rounded-xl opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="size-5" />
                    </Button>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* AlertDialog Konfirmasi Hapus — menggantikan browser confirm() */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(isOpen: boolean) => { if (!isOpen) setDeleteTargetId(null); }}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading uppercase text-foreground">Hapus Agenda?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Jadwal ini akan dihapus permanen dari database. Aksi ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold">Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90 font-bold"
              onClick={async () => {
                if (deleteTargetId) {
                  await deleteEvent(deleteTargetId);
                  setDeleteTargetId(null);
                }
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
