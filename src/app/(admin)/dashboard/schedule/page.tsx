"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useSchedule, useAddEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/use-schedule";
import { type ScheduleEvent } from "@/types/dashboard";
import { useHomebases } from "@/hooks/use-homebases";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, Loader2, Trash2, MapPinned, AlignLeft, Pencil, Clock, ChevronRight, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import { EVENT_TYPES, getEventConfig } from "@/lib/config/events";
import { combineDateAndTime, toYYYYMMDD, getJakartaToday, toJakartaDate, getCountdownLabel } from "@/lib/date-utils";

const CalendarView = dynamic(() => import("@/components/features/calendar-view").then((mod) => mod.CalendarView), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-20">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  ),
});

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
  const [previewEvent, setPreviewEvent] = useState<ScheduleEvent | null>(null);
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
  const mappedEvents = useMemo(
    () =>
      (events || []).map((ev) => {
        const cfg = getEventConfig(ev.type);
        return {
          id: ev.id,
          title: cfg.label,
          start: ev.date,
          allDay: true,
          backgroundColor: "transparent",
          borderColor: "transparent",
          extendedProps: { type: ev.type, originalTitle: ev.title, location: ev.location, description: ev.description, date: ev.date },
        };
      }),
    [events],
  );

  const upcomingEvents = useMemo(() => {
    const today = getJakartaToday();
    return (events || [])
      .filter((ev) => new Date(ev.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [events]);

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

  const formatJakarta = (iso: string | Date, options: Intl.DateTimeFormatOptions) => {
    try {
      return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", ...options }).format(new Date(iso));
    } catch {
      return "—";
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 w-full max-w-7xl mx-auto pb-6">
        {/* FORM INPUT — Full width di atas */}
        <Card className="glass-card p-4 rounded-[2rem] border-white/20 relative group overflow-hidden">
          <div className="absolute top-0 right-0 size-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-[0.8rem] flex items-center justify-center shrink-0 shadow-lg shadow-black/20" style={{ backgroundColor: selectedType ? getEventConfig(selectedType).color : "#D4AF37" }}>
                  {(() => {
                    const Icon = selectedType ? getEventConfig(selectedType).icon : CalendarDays;
                    return <Icon className="size-5 text-white" strokeWidth={2.5} />;
                  })()}
                </div>
                <span className="text-[17px] font-semibold tracking-wide text-foreground">{isEditMode ? "Edit Agenda" : "Tambah Agenda"}</span>
              </div>
              {isEditMode && (
                <button type="button" onClick={handleCancelEdit} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                  Batal
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
              {/* Baris 1: Nama + Jenis */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    Nama <span className="text-destructive">*</span>
                  </label>
                  <Input {...register("title")} placeholder="cth: Latihan Rutin" className="h-10 text-sm border border-white/10 bg-white/5 focus:border-primary/60 transition-all" />
                  {errors.title && <p className="text-[10px] text-destructive">{errors.title.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    Jenis <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={selectedType}
                    onValueChange={(val: string | null) => {
                      if (val) setValue("type", val);
                    }}
                  >
                    <SelectTrigger className="h-10 text-sm border border-white/10 bg-white/5 focus:border-primary/60 transition-all">
                      <SelectValue>{selectedType ? EVENT_TYPES[selectedType]?.label : "Pilih"}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(EVENT_TYPES).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
                            {c.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Baris 2: Tanggal + Waktu + Lokasi + (Homebase) + Submit */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    Tanggal <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="date"
                    value={date ? toYYYYMMDD(date) : ""}
                    onChange={(e) => (e.target.value ? setDate(new Date(e.target.value + "T00:00:00+07:00")) : setDate(undefined))}
                    className="h-10 text-sm border border-white/10 bg-white/5 focus:border-primary/60 transition-all dark:scheme-dark"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    Waktu <span className="text-destructive">*</span>
                  </label>
                  <Input
                    {...register("time", { pattern: { value: /^([01]\d|2[0-3]):[0-5]\d$/, message: "Format: HH:MM" } })}
                    placeholder="08:00"
                    maxLength={5}
                    onInput={(e) => {
                      const el = e.currentTarget;
                      const raw = el.value.replace(/[^0-9]/g, "");
                      el.value = raw.length >= 3 ? raw.slice(0, 2) + ":" + raw.slice(2, 4) : raw;
                    }}
                    className="h-10 text-sm border border-white/10 bg-white/5 focus:border-primary/60 transition-all"
                  />
                  {errors.time && <p className="text-[10px] text-destructive">{errors.time.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Lokasi</label>
                  <Input {...register("location")} placeholder="GOR Adora" className="h-10 text-sm border border-white/10 bg-white/5 focus:border-primary/60 transition-all" />
                </div>
                {homebases.length > 0 ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Homebase</label>
                      <Select value={homebaseId ?? ""} onValueChange={(val: string | null) => setValue("homebaseId", val || undefined)}>
                        <SelectTrigger className="h-10 text-sm border border-white/10 bg-white/5 focus:border-primary/60 transition-all">
                          <SelectValue>{homebaseId ? homebaseMap[homebaseId]?.name : "Semua"}</SelectValue>
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
                    <div className="col-span-2 sm:col-span-4 flex justify-end">
                      <Button type="submit" disabled={isPending} className="h-10 px-8 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground">
                        {isPending && <Loader2 className="animate-spin size-3.5 mr-1.5" />}
                        {isEditMode ? "Simpan Edit" : "Simpan"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-end">
                    <Button type="submit" disabled={isPending} className="w-full h-10 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground">
                      {isPending && <Loader2 className="animate-spin size-3.5 mr-1.5" />}
                      {isEditMode ? "Simpan Edit" : "Simpan"}
                    </Button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </Card>

        <div className="flex flex-col xl:flex-row gap-6 items-start">
          {/* KIRI — Big Calendar */}
          <div className="flex-1 w-full min-w-0">
            <div className="glass-card p-5 rounded-[2.5rem] border-border/40 shadow-sm overflow-hidden">
              <div className="w-full overflow-x-auto">
                <div className="min-w-160">
                  <CalendarView events={mappedEvents} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center mt-4 pt-3 border-t border-border/30">
                {Object.values(EVENT_TYPES).map((leg) => {
                  const Icon = leg.icon;
                  return (
                    <div key={leg.id} className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-full border border-border shadow-sm">
                      <div className="p-1 rounded-full text-white shadow-sm" style={{ backgroundColor: leg.color }}>
                        <Icon className="size-2.5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{leg.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* KANAN — Agenda Mendatang */}
          <div className="w-full xl:w-95 shrink-0 flex flex-col gap-4 min-w-0">
            {/* AGENDA MENDATANG */}
            <div className="h-px w-full bg-linear-to-r from-border/50 via-border to-transparent" />

            <div className="flex items-center justify-between px-1 mb-2">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-[0.8rem] flex items-center justify-center shrink-0 shadow-lg shadow-black/20 bg-primary">
                  <CalendarDays className="size-5 text-primary-foreground" strokeWidth={2.5} />
                </div>
                <h2 className="text-[17px] font-semibold tracking-wide text-foreground">Agenda Mendatang</h2>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3 rounded-2xl border border-dashed border-border/50 text-center">
                  <CalendarDays className="size-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground font-medium">Tidak ada agenda mendatang</p>
                </div>
              ) : (
                upcomingEvents.map((ev, i) => {
                  const cfg = getEventConfig(ev.type);
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={ev.id}
                      onClick={() => setPreviewEvent(ev)}
                      className="group flex items-start gap-4 p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:bg-muted/20 transition-all duration-300 cursor-pointer min-w-0 overflow-hidden"
                    >
                      <div
                        className="shrink-0 flex items-center justify-center size-10 rounded-xl text-white shadow-lg transition-transform group-hover:scale-110 duration-300"
                        style={{ backgroundColor: cfg.color, boxShadow: `0 4px 14px ${cfg.color}55` }}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-sm leading-snug wrap-break-word mb-1.5">{ev.title}</p>
                        <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground/80 font-bold tracking-wide uppercase px-1.5 py-0.5 bg-muted/30 rounded-md mb-1.5">
                          <Clock className="size-2.5" />
                          {getCountdownLabel(ev.date)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="size-3 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground font-medium">{format(new Date(ev.date), "EEE, dd MMM yyyy", { locale: idLocale })}</span>
                        </div>
                        {ev.location && (
                          <div className="flex items-start gap-1.5 mt-0.5 min-w-0">
                            <MapPin className="size-3 text-muted-foreground shrink-0 mt-0.5" />
                            <span className="text-xs text-muted-foreground truncate">{ev.location}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <ChevronRight className="size-4 text-border group-hover:text-primary transition-colors duration-300" />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEvent(ev);
                            setDate(new Date(ev.date));
                          }}
                          className="size-6 text-primary/40 hover:text-primary hover:bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTargetId(ev.id);
                          }}
                          className="size-6 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal Preview Event */}
      <Dialog open={!!previewEvent} onOpenChange={() => setPreviewEvent(null)}>
        {previewEvent &&
          (() => {
            const cfg = getEventConfig(previewEvent.type);
            const Icon = cfg.icon;
            return (
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
                  <DialogTitle className="font-heading text-2xl tracking-widest uppercase text-white leading-tight wrap-break-word">{previewEvent.title}</DialogTitle>
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                      <CalendarDays size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-0.5">Hari & Tanggal</div>
                      <div className="text-sm font-semibold text-white/80 wrap-break-word">{formatJakarta(previewEvent.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                      <Clock size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-0.5">Waktu</div>
                      <div className="text-sm font-semibold text-white/80">{formatJakarta(previewEvent.date, { hour: "2-digit", minute: "2-digit", hour12: false })} WIB</div>
                    </div>
                  </div>
                  {previewEvent.location && (
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                        <MapPin size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-0.5">Lokasi</div>
                        <div className="text-sm font-semibold text-white/80 wrap-break-word">{previewEvent.location}</div>
                      </div>
                    </div>
                  )}
                  {previewEvent.description && (
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                        <AlignLeft size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-0.5">Keterangan</div>
                        <p className="text-xs leading-relaxed text-white/50 wrap-break-word">{previewEvent.description}</p>
                      </div>
                    </div>
                  )}
                  <button onClick={() => setPreviewEvent(null)} className="w-full py-3 text-[10px] font-bold uppercase tracking-[0.3em] bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white/60">
                    Tutup
                  </button>
                </div>
              </DialogContent>
            );
          })()}
      </Dialog>

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
