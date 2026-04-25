"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type ScheduleEvent } from "@/types/dashboard";
import { useAddEvent, useUpdateEvent } from "@/hooks/use-schedule";
import { useHomebases } from "@/hooks/use-homebases";
import { useGroups } from "@/hooks/use-groups";
import { CalendarDays, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { EVENT_TYPES, DEFAULT_EVENT_TYPE, getEventConfig } from "@/lib/config/events";
import { combineDateAndTime, toYYYYMMDD, getJakartaToday } from "@/lib/date-utils";

// ─── Schema ───────────────────────────────────────────────────────────────────

const eventSchema = z.object({
  eventId:     z.string().optional(),
  title:       z.string().min(3, "Judul minimal 3 karakter"),
  description: z.string().optional(),
  location:    z.string().optional(),
  type:        z.enum(["LATIHAN", "PERTANDINGAN", "SPARING", "EVALUASI", "KHUSUS"]),
  time:        z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/, "Waktu harus format 24 jam (opsi: 08:30 atau 14:00)"),
  homebaseId:  z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

function getBlankFormValues(): EventFormValues {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2, "0");
  const mm = now.getMinutes().toString().padStart(2, "0");
  return { eventId: undefined, title: "", description: "", location: "", type: DEFAULT_EVENT_TYPE, time: `${hh}:${mm}`, homebaseId: undefined };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface EventFormCardProps {
  editEvent?: ScheduleEvent;
  onSuccess: () => void;
}

export function EventFormCard({ editEvent, onSuccess }: EventFormCardProps) {
  const [date, setDate] = useState<Date | undefined>(getJakartaToday);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  const { data: homebases = [] } = useHomebases();
  const { data: groups = [] }    = useGroups();
  const { mutateAsync: addEvent,    isPending: isAdding  } = useAddEvent();
  const { mutateAsync: updateEvent, isPending: isUpdating } = useUpdateEvent();

  const isPending  = isAdding || isUpdating;
  const isEditMode = !!editEvent;

  const homebaseMap = useMemo(() => Object.fromEntries(homebases.map((h) => [h.id, h])), [homebases]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: getBlankFormValues(),
  });

  const selectedType    = watch("type");
  const homebaseId      = watch("homebaseId");
  const selectedEventCfg = selectedType ? getEventConfig(selectedType) : null;
  const SelectedEventIcon = selectedEventCfg?.icon ?? CalendarDays;

  // Sync form when parent switches between add ↔ edit mode
  useEffect(() => {
    if (editEvent) {
      setDate(new Date(editEvent.date));
      setSelectedGroupIds(editEvent.groups?.map((g) => g.id) ?? []);
      reset({
        eventId:     editEvent.id,
        title:       editEvent.title,
        description: editEvent.description || "",
        location:    editEvent.location    || "",
        type:        editEvent.type as EventFormValues["type"],
        time:        new Date(editEvent.date).toLocaleTimeString("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false }),
        homebaseId:  editEvent.homebaseId  || undefined,
      });
    } else {
      setDate(getJakartaToday());
      setSelectedGroupIds([]);
      reset(getBlankFormValues());
    }
  }, [editEvent?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleGroup = (groupId: string) =>
    setSelectedGroupIds((prev) => prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]);

  const handleCancel = () => {
    setSelectedGroupIds([]);
    reset(getBlankFormValues());
    onSuccess();
  };

  const onSubmit = async (data: EventFormValues) => {
    if (!date)                       return toast.error("Pilih tanggal terlebih dahulu!");
    if (selectedGroupIds.length === 0) return toast.error("Pilih minimal satu kelompok latihan!");

    try {
      const eventData = {
        title:       data.title,
        description: data.description?.trim() || undefined,
        location:    data.location,
        type:        data.type,
        date:        combineDateAndTime(date, data.time),
        homebaseId:  data.homebaseId || undefined,
        groupIds:    selectedGroupIds,
      };

      if (data.eventId) {
        await updateEvent({ id: data.eventId, data: eventData });
        toast.success("Jadwal berhasil diperbarui!");
      } else {
        await addEvent(eventData);
        toast.success("Jadwal berhasil ditambahkan!");
      }

      handleCancel();
    } catch {
      toast.error(isEditMode ? "Gagal mengubah jadwal. Silakan coba kembali." : "Gagal menambahkan jadwal. Silakan coba kembali.");
    }
  };

  return (
    <Card className="glass-card p-4 rounded-card border-white/20 relative group overflow-hidden">
      <div className="absolute top-0 right-0 size-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-icon flex items-center justify-center shrink-0 shadow-lg shadow-black/20" style={{ backgroundColor: selectedEventCfg?.color ?? "var(--primary)" }}>
              <SelectedEventIcon className="size-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[17px] font-semibold tracking-wide text-foreground">{isEditMode ? "Ubah Agenda" : "Tambah Agenda"}</span>
          </div>
          {isEditMode && (
            <button type="button" onClick={handleCancel} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              Batal
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          {/* Nama + Jenis */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Nama <span className="text-destructive">*</span></label>
              <Input {...register("title")} placeholder="Contoh: Latihan Rutin" className="h-10 text-sm border border-white/10 bg-white/5 focus:border-primary/60 transition-all" />
              {errors.title && <p className="text-[10px] text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Jenis <span className="text-destructive">*</span></label>
              <Select value={selectedType} onValueChange={(val: string | null) => { if (val) setValue("type", val as EventFormValues["type"]); }}>
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

          {/* Kelompok Latihan */}
          {groups.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Kelompok Latihan <span className="text-destructive">*</span></label>
              <div className="flex flex-wrap gap-2">
                {groups.map((g: { id: string; name: string }) => {
                  const checked = selectedGroupIds.includes(g.id);
                  return (
                    <button key={g.id} type="button" onClick={() => toggleGroup(g.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${checked ? "bg-primary text-primary-foreground border-primary" : "bg-white/5 text-muted-foreground border-white/10 hover:border-primary/40"}`}>
                      {g.name}
                    </button>
                  );
                })}
                <button type="button"
                  onClick={() => { const allSelected = selectedGroupIds.length === groups.length && groups.length > 0; setSelectedGroupIds(allSelected ? [] : groups.map((g: { id: string }) => g.id)); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selectedGroupIds.length === groups.length && groups.length > 0 ? "bg-primary/20 text-primary border-primary" : "bg-white/5 text-muted-foreground border-white/10 hover:border-primary/40"}`}>
                  {selectedGroupIds.length === groups.length && groups.length > 0 ? "Hapus Pilihan" : "Pilih Semua"}
                </button>
              </div>
            </div>
          )}

          {/* Keterangan */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Keterangan (Opsional)</label>
            <Textarea {...register("description")} placeholder="Catatan tambahan agenda..." className="min-h-22 text-sm border border-white/10 bg-white/5 focus:border-primary/60 transition-all resize-y" />
          </div>

          {/* Tanggal + Waktu */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Tanggal <span className="text-destructive">*</span></label>
              <Input type="date" value={date ? toYYYYMMDD(date) : ""} onChange={(e) => (e.target.value ? setDate(new Date(e.target.value + "T00:00:00+07:00")) : setDate(undefined))} className="h-10 text-sm border border-white/10 bg-white/5 focus:border-primary/60 transition-all dark:scheme-dark" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Waktu <span className="text-destructive">*</span></label>
              <Input {...register("time", { pattern: { value: /^([01]\d|2[0-3]):[0-5]\d$/, message: "Format: HH:MM" } })} placeholder="08:00" maxLength={5}
                onInput={(e) => { const el = e.currentTarget; const raw = el.value.replace(/[^0-9]/g, ""); el.value = raw.length >= 3 ? raw.slice(0, 2) + ":" + raw.slice(2, 4) : raw; }}
                className="h-10 text-sm border border-white/10 bg-white/5 focus:border-primary/60 transition-all" />
              {errors.time ? <p className="text-[10px] text-destructive">{errors.time.message}</p> : <p className="text-[10px] text-muted-foreground/60">Format 24 jam, Contoh: 08:00</p>}
            </div>
          </div>

          {/* Lokasi + Homebase + Submit */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Lokasi</label>
              <Input {...register("location")} placeholder="GOR Adora" className="h-10 text-sm border border-white/10 bg-white/5 focus:border-primary/60 transition-all" />
            </div>
            {homebases.length > 0 && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Homebase</label>
                <Select value={homebaseId ?? ""} onValueChange={(val: string | null) => setValue("homebaseId", val || undefined)}>
                  <SelectTrigger className="h-10 text-sm border border-white/10 bg-white/5 focus:border-primary/60 transition-all">
                    <SelectValue>{homebaseId ? homebaseMap[homebaseId]?.name : "Semua Homebase"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {homebases.map((hb) => (
                      <SelectItem key={hb.id} value={hb.id}>{hb.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-end">
              <Button type="submit" disabled={isPending} className="w-full h-10 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground">
                {isPending && <Loader2 className="animate-spin size-3.5 mr-1.5" />}
                {isEditMode ? "Simpan Perubahan" : "Simpan"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Card>
  );
}
