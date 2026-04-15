"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { useSchedule, useAddEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/use-schedule";
import { type ScheduleEvent } from "@/types/dashboard";
import { useHomebases } from "@/hooks/use-homebases";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, Plus, Loader2, Trash2, MapPinned, AlignLeft, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import { EVENT_TYPES, getEventConfig } from "@/lib/config/events";
import { combineDateAndTime, toYYYYMMDD, getJakartaToday, toJakartaDate } from "@/lib/date-utils";

/**
 * ADORA Basketball - Schedule Command Center
 * High-performance declarative management of club events.
 */

const eventSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  location: z.string().optional(),
  type: z.string().min(1, "Tipe agenda wajib dipilih"),
  time: z.string().min(1, "Waktu wajib diisi"),
  homebaseId: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

export default function SchedulePage() {
  const [date, setDate] = useState<Date | undefined>(getJakartaToday());
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { data: homebases = [] } = useHomebases();

  const isEditMode = editingEvent !== null;

  // Memoized homebase lookup map for O(1) access
  const homebaseMap = useMemo(() => Object.fromEntries(homebases.map((h) => [h.id, h])), [homebases]);

  // Time context for default values
  const { currentHH, currentMM } = useMemo(() => {
    const now = new Date();
    return {
      currentHH: now.getHours().toString().padStart(2, "0"),
      currentMM: now.getMinutes().toString().padStart(2, "0"),
    };
  }, []);

  const defaultType = Object.keys(EVENT_TYPES)[0] || "LATIHAN";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: isEditMode
      ? {
          title: editingEvent?.title || "",
          location: editingEvent?.location || "",
          type: editingEvent?.type || defaultType,
          time: editingEvent?.date ? format(toJakartaDate(editingEvent.date), "HH:mm") : `${currentHH}:${currentMM}`,
          homebaseId: editingEvent?.homebaseId || undefined,
        }
      : {
          title: "",
          location: "",
          type: defaultType,
          time: `${currentHH}:${currentMM}`,
          homebaseId: undefined,
        },
  });

  const selectedType = watch("type");
  const homebaseId = watch("homebaseId");

  const { data: events, isLoading } = useSchedule();
  const { mutateAsync: addEvent, isPending } = useAddEvent();
  const { mutateAsync: updateEvent } = useUpdateEvent();
  const { mutateAsync: deleteEvent } = useDeleteEvent();

  // ─── Memoized Calculations ──────────────────────────────

  // Safe filtering: Compare by Jakarta YYYY-MM-DD strings
  const selectedEvents = useMemo(() => {
    if (!date || !events) return [];
    const targetDateStr = toYYYYMMDD(date);
    return events.filter((ev) => toYYYYMMDD(ev.date) === targetDateStr);
  }, [events, date]);

  const modifierHasEvent = useMemo(
    () => (day: Date) => {
      if (!events) return false;
      const dayStr = toYYYYMMDD(day);
      return events.some((ev) => toYYYYMMDD(ev.date) === dayStr);
    },
    [events],
  );

  // Callback: Cancel edit mode and reset form
  const handleCancelEdit = () => {
    setEditingEvent(null);
    reset({
      title: "",
      location: "",
      type: defaultType,
      time: `${currentHH}:${currentMM}`,
      homebaseId: undefined,
    });
  };

  // Callback: Start editing an event
  const handleEditEvent = (ev: ScheduleEvent) => {
    setEditingEvent(ev);
    setDate(new Date(ev.date));
  };

  const onSubmit = async (data: EventFormValues) => {
    if (!date) return toast.error("Pilih tanggal terlebih dahulu!");

    try {
      const isoWithWib = combineDateAndTime(date, data.time);

      const eventData = {
        title: data.title,
        location: data.location,
        type: data.type,
        date: isoWithWib,
        homebaseId: data.homebaseId || undefined,
      };

      // Single mutation point
      if (isEditMode && editingEvent) {
        await updateEvent({ id: editingEvent.id, data: eventData });
        toast.success("Jadwal berhasil diperbarui!");
      } else {
        await addEvent(eventData);
        toast.success("Jadwal sukses ditambahkan!");
      }

      handleCancelEdit();
    } catch (error) {
      toast.error(isEditMode ? "Gagal mengubah jadwal" : "Gagal menambahkan jadwal");
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10 w-full">
          {/* INTERACTIVE CALENDAR & FORM */}
          <div className="lg:col-span-6 space-y-4">
            <Card className="glass-card p-4 rounded-2xl border-white/20 relative group overflow-hidden">
              <div className="absolute top-0 right-0 size-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors" />

              <div className="mb-3 pb-3 border-b border-white/10 relative z-10">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <CalendarDays className="size-4 text-primary" />
                  {isEditMode ? "Edit Agenda" : "Tambah Agenda"}
                </h3>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Nama Kegiatan */}
                    <div className="space-y-1 sm:col-span-2">
                      <Input {...register("title")} placeholder="Nama Kegiatan" className="h-9 text-sm font-medium placeholder:font-medium border border-primary/20 bg-primary/5 focus:border-primary focus:bg-primary/10 transition-colors" />
                      {errors.title && <p className="text-[10px] text-destructive font-medium">{errors.title.message}</p>}
                    </div>

                    {/* Jenis Kegiatan */}
                    <div className="space-y-1">
                      <Select
                        value={selectedType}
                        onValueChange={(val: string | null) => {
                          if (val) setValue("type", val);
                        }}
                      >
                        <SelectTrigger className="h-9 text-sm font-medium border border-primary/20 bg-primary/5 focus:border-primary focus:bg-primary/10 transition-colors">
                          <SelectValue placeholder="Jenis Agenda">{selectedType ? EVENT_TYPES[selectedType]?.label : "Jenis Agenda"}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(EVENT_TYPES).map((config) => (
                            <SelectItem key={config.id} value={config.id}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.type && <p className="text-[10px] text-destructive font-medium">{errors.type.message}</p>}
                    </div>

                    {/* Waktu */}
                    <div className="space-y-1">
                      <Input type="time" {...register("time")} className="h-9 text-sm font-medium border border-primary/20 bg-primary/5 focus:border-primary focus:bg-primary/10 transition-colors dark:scheme-dark" />
                      {errors.time && <p className="text-[10px] text-destructive font-medium">{errors.time.message}</p>}
                    </div>

                    {/* Lokasi */}
                    <div className="space-y-1 sm:col-span-2">
                      <Input
                        {...register("location")}
                        placeholder="Lokasi Kegiatan"
                        className="h-9 text-sm font-medium placeholder:font-medium border border-primary/20 bg-primary/5 focus:border-primary focus:bg-primary/10 transition-colors"
                      />
                    </div>

                    {/* Homebase */}
                    {homebases.length > 0 && (
                      <div className="space-y-1 sm:col-span-2">
                        <Select value={homebaseId ?? ""} onValueChange={(val: string | null) => setValue("homebaseId", val || undefined)}>
                          <SelectTrigger className="h-9 text-sm font-medium border border-primary/20 bg-primary/5 focus:border-primary focus:bg-primary/10 transition-colors">
                            <SelectValue placeholder="Pilih homebase (Opsional)...">{homebaseId ? homebaseMap[homebaseId]?.name : "Pilih homebase (Opsional)..."}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {homebases.map((hb) => (
                              <SelectItem key={hb.id} value={hb.id}>
                                {hb.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {isEditMode && (
                      <Button type="button" variant="outline" onClick={handleCancelEdit} className="flex-1 h-9 text-sm font-bold border-primary/30 text-primary-foreground">
                        Batal
                      </Button>
                    )}
                    <Button type="submit" disabled={isPending} className="flex-1 h-9 text-sm text-primary-foreground font-bold bg-primary hover:bg-primary/90">
                      {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : isEditMode ? "Simpan Edit" : "Simpan Agenda"}
                    </Button>
                  </div>
                </form>
              </div>

              <div className="flex items-center justify-end mb-1 relative z-10 pt-1 px-1">
                <Button variant="outline" size="sm" onClick={() => setDate(new Date())} className="h-8 px-4 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full border-white/10 transition-colors">
                  Hari Ini
                </Button>
              </div>
              <div className="flex justify-center w-full relative z-10 px-2 sm:px-4">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="bg-transparent w-full p-0 transition-all **:data-[slot=calendar]:w-full [&_table]:w-full [&_tbody]:w-full [&_tr]:flex [&_tr]:w-full [&_td]:flex-1 [&_td]:flex [&_td]:justify-center [&_td]:items-center [&_th]:flex-1 [&_td_button]:w-8! [&_td_button]:h-8! sm:[&_td_button]:w-10! sm:[&_td_button]:h-10! [&_td_button]:flex [&_td_button]:items-center [&_td_button]:justify-center [&_td_button]:rounded-full! [&_td_button]:ring-0! [&_td_button]:border-0! [&_td_button]:outline-none! [&_.rdp-today>button]:bg-muted! [&_.rdp-today>button]:text-foreground! [&_button[data-selected-single=true]]:bg-primary! [&_button[data-selected-single=true]]:text-primary-foreground! [&_.rdp-today>button[data-selected-single=true]]:bg-[#a39446]! [&_.rdp-today>button[data-selected-single=true]]:text-white!"
                  modifiers={{ hasEvent: modifierHasEvent }}
                  modifiersStyles={{ hasEvent: { fontWeight: "900", color: "#FDB813", textDecoration: "underline", textUnderlineOffset: "4px" } }}
                  classNames={{
                    root: "w-full",
                    months: "w-full flex-col",
                    month: "w-full flex flex-col gap-4",
                    table: "w-full border-collapse",
                    vhidden: "hidden",
                    today: "rdp-today",
                  }}
                />
              </div>
            </Card>
          </div>

          {/* FEED KEGIATAN */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <Card className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 glass-card rounded-2xl border-white/20 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 size-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors" />
              <div className="relative z-10">
                <span className="text-xs text-primary font-bold block mb-1">Agenda Tanggal Terpilih</span>
                <h3 className="text-2xl font-bold">{date ? format(date, "EEEE, dd MMMM yyyy", { locale: idLocale }) : "Pilih tanggal di kalender"}</h3>
              </div>
              <div className="size-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shadow-inner relative z-10 mt-4 md:mt-0">
                <span className="font-heading text-2xl text-primary font-bold">{selectedEvents.length}</span>
              </div>
            </Card>

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
                  <motion.div key={ev.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 rounded-3xl flex items-center justify-between group transition-all hover:bg-white/60 dark:hover:bg-white/5">
                    <div className="flex items-center gap-5">
                      <div className="size-14 rounded-full flex items-center justify-center bg-secondary/5 border-2 border-primary/20 text-primary">
                        <AlignLeft className="size-6" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-1 flex items-center gap-2">
                          <span className="size-1.5 rounded-full" style={{ backgroundColor: getEventConfig(ev.type).color }} />
                          {getEventConfig(ev.type).label} • {ev.date ? format(new Date(ev.date), "HH:mm", { locale: idLocale }) : "00:00"} WIB
                        </span>
                        <h4 className="text-xl font-bold text-secondary">{ev.title}</h4>
                        {ev.location && (
                          <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPinned className="size-3" /> {ev.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditEvent(ev)} className="text-primary/50 hover:text-primary hover:bg-primary/10 rounded-xl opacity-0 transition-opacity group-hover:opacity-100">
                        <Pencil className="size-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTargetId(ev.id)}
                        className="text-destructive/50 hover:text-destructive hover:bg-destructive/10 rounded-xl opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 className="size-5" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <AlertDialog
        open={!!deleteTargetId}
        onOpenChange={(isOpen: boolean) => {
          if (!isOpen) setDeleteTargetId(null);
        }}
      >
        <AlertDialogContent className="bg-card border-border/50 rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading uppercase text-foreground">Hapus Agenda?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">Jadwal ini akan dihapus permanen dari database. Aksi ini tidak bisa dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90 font-bold rounded-xl"
              onClick={async () => {
                if (deleteTargetId) {
                  await deleteEvent(deleteTargetId);
                  setDeleteTargetId(null);
                  toast.success("Agenda telah dihapus.");
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
