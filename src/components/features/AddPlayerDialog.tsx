"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAddPlayer } from "@/hooks/use-players";
import { useGroups, type Group } from "@/hooks/use-groups";
import { toast } from "sonner";
import { BatchPlayerUpload } from "@/components/features/BatchPlayerUpload";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Phone } from "lucide-react";

// Schema Sinkron dengan MySQL/Prisma
const playerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  dateOfBirth: z.string().nonempty("TTL wajib diisi"),
  schoolOrigin: z.string().optional(),
  phoneNumber: z.string().optional(),
  groupId: z.string().nonempty("Kelompok wajib dipilih"),
});

type PlayerForm = z.infer<typeof playerSchema>;

export function AddPlayerDialog() {
  const [open, setOpen] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const { data: groups, isLoading: isGroupsLoading } = useGroups();
  const { mutateAsync: addPlayer, isPending } = useAddPlayer();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<PlayerForm>({
    resolver: zodResolver(playerSchema),
  });

  const onSubmit = async (data: PlayerForm) => {
    try {
      await addPlayer(data);
      reset();
      setOpen(false);
      toast.success("Pemain baru berhasil didaftarkan!");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Terjadi kesalahan tak dikenal.";
      toast.error("Gagal menambahkan pemain: " + msg);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setIsBatchMode(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button size="xl" className="w-full sm:w-auto">
            <Plus className="size-4" /> Tambah Pemain
          </Button>
        }
      />

      <DialogContent className={`${isBatchMode ? "sm:max-w-2xl" : "sm:max-w-md"} bg-card border-border/50`}>
        <DialogHeader>
          <DialogTitle className="text-xl font-heading text-foreground tracking-wide">{isBatchMode ? "Tambah Banyak Pemain" : "Registrasi Pemain Baru"}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">{isBatchMode ? "Upload file Excel, cek datanya, lalu simpan." : "Masukkan data pemain satu per satu."}</DialogDescription>
        </DialogHeader>

        {isBatchMode ? (
          <div className="pt-4">
            <BatchPlayerUpload onDone={() => setOpen(false)} />
            <Button variant="ghost" className="w-full mt-4 text-sm font-medium text-muted-foreground" onClick={() => setIsBatchMode(false)}>
              Kembali ke Input Manual
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Nama Lengkap</label>
              <Input {...register("name")} placeholder="Contoh: Dimas Anggara" className="h-11" />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Tanggal Lahir</label>
              <Input type="date" {...register("dateOfBirth")} className="h-11 rounded-xl bg-background/40 scheme-dark [&::-webkit-calendar-picker-indicator]:invert" />
              {errors.dateOfBirth && <p className="text-destructive text-xs">{errors.dateOfBirth.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Asal Sekolah <span className="text-muted-foreground/50 font-normal">(Opsional)</span></label>
              <Input {...register("schoolOrigin")} placeholder="Contoh: SMA Gonzaga" className="h-11 rounded-xl bg-background/40" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">No. Telepon <span className="text-muted-foreground/50 font-normal">(Opsional)</span></label>
              <Input type="tel" {...register("phoneNumber")} placeholder="Contoh: +6281234567890" className="h-11 rounded-xl bg-background/40" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Kelompok</label>
              <Controller
                control={control}
                name="groupId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={isGroupsLoading}>
                    <SelectTrigger className="h-11 rounded-xl bg-background/40">
                      <SelectValue>{groups?.find((g: Group) => g.id === field.value)?.name || (isGroupsLoading ? "Memuat..." : "Pilih Kelompok")}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {groups?.map((group: Group) => (
                        <SelectItem key={group.id} value={group.id} className="font-medium text-sm">
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.groupId && <p className="text-destructive text-xs">{errors.groupId.message}</p>}
            </div>

            <div className="pt-6 flex flex-col gap-2">
              <Button type="submit" disabled={isPending} className="w-full h-10 font-semibold text-sm">
                {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
                Simpan Data
              </Button>
              <Button type="button" variant="ghost" className="w-full text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => setIsBatchMode(true)}>
                Unggah Banyak Pemain (File Excel)
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
