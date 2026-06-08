"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, Loader2 } from "lucide-react";

import type { ScheduleEvent } from "@/types/dashboard";
import { useAddEvent, useUpdateEvent } from "@/hooks/use-schedule";
import { useHomebases } from "@/hooks/use-homebases";
import { useGroups } from "@/hooks/use-groups";
import { EVENT_TYPES, DEFAULT_EVENT_TYPE, getEventConfig } from "@/lib/config/events";
import { combineDateAndTime, getJakartaToday, toYYYYMMDD } from "@/lib/date-utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const eventSchema = z.object({
  eventId: z.string().optional(),
  title: z.string().min(3, "Judul minimal 3 karakter"),
  description: z.string().optional(),
  location: z.string().optional(),
  type: z.enum(["LATIHAN", "PERTANDINGAN", "SPARING", "EVALUASI", "KHUSUS"]),
  time: z
    .string()
    .regex(/^([01]?\d|2[0-3]):[0-5]\d$/, "Waktu harus format 24 jam, misalnya 08:30"),
  homebaseId: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventFormCardProps {
  editEvent?: ScheduleEvent;
  onSuccess: () => void;
  title?: string;
  description?: string;
  className?: string;
  surface?: "card" | "plain";
  hideCancel?: boolean;
}

function getBlankFormValues(): EventFormValues {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");

  return {
    eventId: undefined,
    title: "",
    description: "",
    location: "",
    type: DEFAULT_EVENT_TYPE,
    time: `${hours}:${minutes}`,
    homebaseId: undefined,
  };
}

export function EventFormCard({
  editEvent,
  onSuccess,
  title,
  description,
  className,
  surface = "card",
  hideCancel = false,
}: EventFormCardProps) {
  const [date, setDate] = useState<Date | undefined>(getJakartaToday);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  const { data: homebases = [] } = useHomebases();
  const { data: groups = [] } = useGroups();
  const { mutateAsync: addEvent, isPending: isAdding } = useAddEvent();
  const { mutateAsync: updateEvent, isPending: isUpdating } = useUpdateEvent();

  const isPending = isAdding || isUpdating;
  const isEditMode = Boolean(editEvent);
  const homebaseMap = useMemo(() => Object.fromEntries(homebases.map((homebase) => [homebase.id, homebase])), [homebases]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: getBlankFormValues(),
  });

  const selectedType = useWatch({ control, name: "type" });
  const homebaseId = useWatch({ control, name: "homebaseId" });
  const selectedEventConfig = selectedType ? getEventConfig(selectedType) : null;
  const SelectedEventIcon = selectedEventConfig?.icon ?? CalendarDays;
  const headingText = title ?? (isEditMode ? "Ubah Agenda" : "Tambah Agenda");
  const descriptionText =
    description
    ?? (isEditMode
      ? "Perbarui tanggal, kelompok, dan lokasi agenda tanpa meninggalkan halaman kerja."
      : "Tambahkan agenda baru setelah mengecek sebaran jadwal dan bentrok di kalender.");

  useEffect(() => {
    if (editEvent) {
      setDate(new Date(editEvent.date));
      setSelectedGroupIds(editEvent.groups?.map((group) => group.id) ?? []);
      reset({
        eventId: editEvent.id,
        title: editEvent.title,
        description: editEvent.description || "",
        location: editEvent.location || "",
        type: editEvent.type as EventFormValues["type"],
        time: new Date(editEvent.date).toLocaleTimeString("en-GB", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        homebaseId: editEvent.homebaseId || undefined,
      });
      return;
    }

    setDate(getJakartaToday());
    setSelectedGroupIds([]);
    reset(getBlankFormValues());
  }, [editEvent, reset]);

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((previous) => (
      previous.includes(groupId)
        ? previous.filter((id) => id !== groupId)
        : [...previous, groupId]
    ));
  };

  const handleCancel = () => {
    setSelectedGroupIds([]);
    reset(getBlankFormValues());
    onSuccess();
  };

  const onSubmit = async (data: EventFormValues) => {
    if (!date) {
      toast.error("Pilih tanggal terlebih dahulu.");
      return;
    }

    if (selectedGroupIds.length === 0) {
      toast.error("Pilih minimal satu kelompok latihan.");
      return;
    }

    try {
      const eventData = {
        title: data.title,
        description: data.description?.trim() || undefined,
        location: data.location,
        type: data.type,
        date: combineDateAndTime(date, data.time),
        homebaseId: data.homebaseId || undefined,
        groupIds: selectedGroupIds,
      };

      if (data.eventId) {
        await updateEvent({ id: data.eventId, data: eventData });
        toast.success("Jadwal berhasil diperbarui.");
      } else {
        await addEvent(eventData);
        toast.success("Jadwal berhasil ditambahkan.");
      }

      handleCancel();
    } catch {
      toast.error(
        isEditMode
          ? "Gagal mengubah jadwal. Silakan coba kembali."
          : "Gagal menambahkan jadwal. Silakan coba kembali.",
      );
    }
  };

  const content = (
    <div className={cn("space-y-5", surface === "card" ? "p-5" : className)}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <SelectedEventIcon className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">{headingText}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{descriptionText}</p>
          </div>
          {isEditMode && !hideCancel ? (
            <button
              type="button"
              onClick={handleCancel}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Batal
            </button>
          ) : null}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="event-title" className="text-xs font-medium text-muted-foreground">
                Nama Agenda <span className="text-destructive">*</span>
              </label>
              <Input
                id="event-title"
                {...register("title")}
                placeholder="Contoh: Latihan Rutin KU-12"
                className="h-10 border-border/50 bg-background/50"
              />
              {errors.title ? (
                <p className="text-[11px] text-destructive">{errors.title.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="event-type" className="text-xs font-medium text-muted-foreground">
                Jenis <span className="text-destructive">*</span>
              </label>
              <Select
                value={selectedType}
                onValueChange={(value: string | null) => {
                  if (value) {
                    setValue("type", value as EventFormValues["type"]);
                  }
                }}
              >
                <SelectTrigger id="event-type" className="h-10 border-border/50 bg-background/50">
                  <SelectValue>{selectedType ? EVENT_TYPES[selectedType]?.label : "Pilih jenis"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.values(EVENT_TYPES).map((eventType) => (
                    <SelectItem key={eventType.id} value={eventType.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: eventType.color }}
                        />
                        {eventType.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {groups.length > 0 ? (
            <fieldset className="space-y-2 border-none p-0">
              <legend className="text-xs font-medium text-muted-foreground">
                Kelompok Latihan <span className="text-destructive">*</span>
              </legend>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Kelompok Latihan">
                {groups.map((group) => {
                  const checked = selectedGroupIds.includes(group.id);

                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/50 bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {group.name}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    const allSelected = selectedGroupIds.length === groups.length && groups.length > 0;
                    setSelectedGroupIds(allSelected ? [] : groups.map((group) => group.id));
                  }}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selectedGroupIds.length === groups.length && groups.length > 0
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/50 bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {selectedGroupIds.length === groups.length && groups.length > 0
                    ? "Hapus Pilihan"
                    : "Pilih Semua"}
                </button>
              </div>
            </fieldset>
          ) : null}

          <div className="space-y-1.5">
            <label htmlFor="event-description" className="text-xs font-medium text-muted-foreground">
              Keterangan
            </label>
            <Textarea
              id="event-description"
              {...register("description")}
              placeholder="Catatan tambahan agenda jika diperlukan."
              className="min-h-24 resize-y border-border/50 bg-background/50"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="event-date" className="text-xs font-medium text-muted-foreground">
                Tanggal <span className="text-destructive">*</span>
              </label>
              <Input
                id="event-date"
                type="date"
                value={date ? toYYYYMMDD(date) : ""}
                onChange={(event) => (
                  event.target.value
                    ? setDate(new Date(`${event.target.value}T00:00:00+07:00`))
                    : setDate(undefined)
                )}
                className="h-10 border-border/50 bg-background/50 dark:scheme-dark"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="event-time" className="text-xs font-medium text-muted-foreground">
                Waktu <span className="text-destructive">*</span>
              </label>
              <Input
                id="event-time"
                {...register("time", {
                  pattern: {
                    value: /^([01]\d|2[0-3]):[0-5]\d$/,
                    message: "Format waktu harus HH:MM",
                  },
                })}
                placeholder="08:00"
                maxLength={5}
                onInput={(event) => {
                  const element = event.currentTarget;
                  const raw = element.value.replace(/[^0-9]/g, "");
                  element.value = raw.length >= 3 ? `${raw.slice(0, 2)}:${raw.slice(2, 4)}` : raw;
                }}
                className="h-10 border-border/50 bg-background/50"
              />
              {errors.time ? (
                <p className="text-[11px] text-destructive">{errors.time.message}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground">Format 24 jam, misalnya 08:00.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="event-location" className="text-xs font-medium text-muted-foreground">
                Lokasi
              </label>
              <Input
                id="event-location"
                {...register("location")}
                placeholder="Contoh: GOR Adora"
                className="h-10 border-border/50 bg-background/50"
              />
            </div>

            {homebases.length > 0 ? (
              <div className="space-y-1.5">
                <label htmlFor="event-homebaseId" className="text-xs font-medium text-muted-foreground">
                  Lokasi Latihan
                </label>
                <Select
                  value={homebaseId ?? ""}
                  onValueChange={(value: string | null) => setValue("homebaseId", value || undefined)}
                >
                  <SelectTrigger id="event-homebaseId" className="h-10 border-border/50 bg-background/50">
                    <SelectValue>
                      {homebaseId ? homebaseMap[homebaseId]?.name : "Semua lokasi"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {homebases.map((homebase) => (
                      <SelectItem key={homebase.id} value={homebase.id}>
                        {homebase.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="flex items-end">
              <Button type="submit" disabled={isPending} className="h-10 w-full text-sm font-semibold">
                {isPending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
                {isEditMode ? "Simpan Perubahan" : "Simpan Agenda"}
              </Button>
            </div>
          </div>
        </form>
      </div>
  );

  if (surface === "plain") {
    return content;
  }

  return (
    <Card className={cn("rounded-xl border border-border/50 bg-card shadow-sm", className)}>
      {content}
    </Card>
  );
}
