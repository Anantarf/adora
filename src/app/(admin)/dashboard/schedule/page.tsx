"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { useSchedule, useAddEvent, useDeleteEvent } from "@/hooks/use-schedule";
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

export default function SchedulePage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("LATIHAN");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { data: events, isLoading } = useSchedule();
  const { mutateAsync: addEvent, isPending } = useAddEvent();
  const { mutateAsync: deleteEvent } = useDeleteEvent();

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return toast.error("Pilih tanggal terlebih dahulu!");
    if (title.length < 3) return toast.error("Judul minimal 3 karakter");
    try {
      await addEvent({ title, type, date: date.toISOString() });
      toast.success("Jadwal sukses ditambahkan!");
      setOpen(false);
      setTitle("");
    } catch {
      toast.error("Gagal menambahkan jadwal");
    }
  };

  const selectedEvents = events?.filter(
    (ev) => date && ev.date ? isSameDay(new Date(ev.date), date) : false
  ) || [];

  const modifierHasEvent = (day: Date) =>
    events?.some((ev) => isSameDay(new Date(ev.date), day)) || false;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-8 w-full max-w-7xl mx-auto"
      >
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
            <h1 className="text-5xl md:text-6xl font-heading uppercase tracking-widest text-foreground">Jadwal Kalender</h1>
            <p className="text-muted-foreground font-medium max-w-lg border-l-2 border-primary/40 pl-4 py-1 tracking-wide">
              Penjadwalan aktivitas Adora. Rencana latihan, kejuaraan, dan agenda khusus antar-rombongan.
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
                <DialogTitle className="text-xl font-heading uppercase text-secondary">Rencanakan Jadwal</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateEvent} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground">Tanggal</label>
                  <div className="h-11 rounded-lg border border-border bg-muted/50 px-3 flex items-center text-sm font-semibold text-secondary opacity-70">
                    {date ? format(date, "EEEE, dd MMMM yyyy", { locale: idLocale }) : "Pilih Kalender.."}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground">Tipe Penjadwalan</label>
                  <Select value={type} onValueChange={(val: string | null) => { if (val) setType(val); }}>
                    <SelectTrigger className="h-11 font-semibold">
                      <SelectValue placeholder="Tipe Agenda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LATIHAN">Sesi Latihan / Drills</SelectItem>
                      <SelectItem value="PERTANDINGAN">Kejuaraan / Match Day</SelectItem>
                      <SelectItem value="EVALUASI">Ujian Evaluasi (Rapor)</SelectItem>
                      <SelectItem value="KHUSUS">Acara Khusus / Ekstra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground">Deskripsi Nama Acara</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Latihan Fundamental Kuarter 1"
                    className="h-11 font-semibold placeholder:font-medium"
                  />
                </div>
                <Button type="submit" disabled={isPending} className="w-full h-11 mt-2 text-primary-foreground font-bold tracking-widest uppercase">
                  {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : "Simpan Agenda"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10 w-full">

          {/* INTERACTIVE CALENDAR */}
          <Card className="lg:col-span-5 2xl:col-span-4 glass-card p-6 rounded-[2rem] border-white/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 size-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors" />
            <div className="flex items-center gap-2 mb-6">
              <CalendarDays className="size-5 text-primary" />
              <h2 className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground flex-1">Navigator Waktu</h2>
            </div>
            <div className="flex justify-center -mx-2 items-center bg-white/40 dark:bg-black/30 rounded-3xl p-4 shadow-sm relative z-10 border border-white/20">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-lg scale-110 md:scale-125 transform-gpu origin-top"
                modifiers={{ hasEvent: modifierHasEvent }}
                modifiersStyles={{ hasEvent: { fontWeight: "900", color: "#FDB813", textDecoration: "underline", textUnderlineOffset: "4px" } }}
                classNames={{
                  vhidden: "hidden",
                  day: "h-9 w-9 p-0 font-normal hover:bg-muted text-sm rounded-full transition-all flex items-center justify-center",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-bold scale-110 shadow-md",
                  head_cell: "text-muted-foreground font-bold tracking-wide uppercase text-[10px] w-9",
                }}
              />
            </div>
          </Card>

          {/* FEED KEGIATAN */}
          <div className="lg:col-span-7 2xl:col-span-8 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-secondary text-secondary-foreground rounded-[2rem] shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-[10px] text-primary font-black uppercase tracking-[0.2em] block mb-1">Target Hari Ini</span>
                <h3 className="text-2xl font-black italic">
                  {date ? format(date, "EEEE, dd MMMM yyyy", { locale: idLocale }) : "Pilih Tanggal"}
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
                  <MapPinned className="size-10 text-muted-foreground mb-3 opacity-50" />
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Tidak Ada Jadwal</p>
                  <span className="text-xs text-muted-foreground mt-1">Kosong, belum ada event.</span>
                </div>
              ) : (
                selectedEvents.map((ev) => (
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
                          <span className="size-1.5 rounded-full bg-primary" />
                          {ev.type}
                        </span>
                        <h4 className="text-xl font-bold text-secondary">{ev.title}</h4>
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
