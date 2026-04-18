"use client";

import { useState, useEffect } from "react";
import { type Player } from "@/types/dashboard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Calendar, MapPin, Users, Loader2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdatePlayer } from "@/hooks/use-players";
import { useGroups } from "@/hooks/use-groups";
import { toast } from "sonner";
import { toYYYYMMDD } from "@/lib/date-utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Schema validasi
const playerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  dateOfBirth: z.string().nonempty("TTL wajib diisi"),
  schoolOrigin: z.string().min(3, "Asal Sekolah minimal 3 karakter"),
  groupId: z.string().nonempty("Kelompok wajib dipilih"),
});

type PlayerForm = z.infer<typeof playerSchema>;

interface ViewPlayerDialogProps {
  player: Player;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}

export function ViewPlayerDialog({ player, open, onOpenChange, onDelete }: ViewPlayerDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { data: groups, isLoading: isGroupsLoading } = useGroups();
  const { mutateAsync: updatePlayer, isPending } = useUpdatePlayer();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<PlayerForm>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: player.name,
      dateOfBirth: player.dateOfBirth ? toYYYYMMDD(player.dateOfBirth) : "",
      schoolOrigin: player.schoolOrigin || "",
      groupId: player.groupId || "",
    },
  });

  // Reset state and form when modal closes or opens
  useEffect(() => {
    if (open) {
      setIsEditing(false);
      reset({
        name: player.name,
        dateOfBirth: player.dateOfBirth ? toYYYYMMDD(player.dateOfBirth) : "",
        schoolOrigin: player.schoolOrigin || "",
        groupId: player.groupId || "",
      });
    }
  }, [open, player, reset]);

  const onSubmit = async (data: PlayerForm) => {
    try {
      await updatePlayer({
        id: player.id,
        data,
      });
      toast.success(`Profil ${player.name} berhasil diperbarui!`);
      // Update form defaults too so if they hit Edit again it's fresh
      reset(data);
      setIsEditing(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal memperbarui.";
      toast.error("Error: " + msg);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) setIsEditing(false);
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-md bg-card border-border/50 transition-all duration-300">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center font-heading text-primary border border-primary/20 shrink-0 text-xl">{player.name.charAt(0).toUpperCase()}</div>
            <div className="flex flex-col text-left">
              <DialogTitle className="text-xl font-heading tracking-wide text-foreground">{isEditing ? "Ubah Profil Pemain" : player.name}</DialogTitle>
              <DialogDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground mt-0.5">
                {isEditing ? "Pastikan data yang diinput sesuai" : player.group ? player.group.name : "Tanpa Kelompok"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">Nama Lengkap</label>
              <Input {...register("name")} defaultValue={player.name} className="h-11 bg-background/50" />
              {errors.name && <p className="text-destructive text-xs font-semibold uppercase">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">Tanggal Lahir</label>
              <Input type="date" {...register("dateOfBirth")} defaultValue={player.dateOfBirth ? toYYYYMMDD(player.dateOfBirth) : ""} className="h-11 bg-background/50 scheme-dark [&::-webkit-calendar-picker-indicator]:invert" />
              {errors.dateOfBirth && <p className="text-destructive text-xs font-semibold uppercase">{errors.dateOfBirth.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">Asal Sekolah</label>
              <Input {...register("schoolOrigin")} defaultValue={player.schoolOrigin || ""} className="h-11 bg-background/50" />
              {errors.schoolOrigin && <p className="text-destructive text-xs font-semibold uppercase">{errors.schoolOrigin.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">Kelompok</label>
              <Controller
                control={control}
                name="groupId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={isGroupsLoading}>
                    <SelectTrigger className="h-11 bg-background/50">
                      <SelectValue>{groups?.find((g: any) => g.id === field.value)?.name || "Pilih Kelompok"}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {groups?.map((group: { id: string; name: string }) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.groupId && <p className="text-destructive text-xs font-semibold uppercase">{errors.groupId.message}</p>}
            </div>

            <div className="pt-4 flex items-center gap-2 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                className="flex-1 font-bold uppercase tracking-widest text-[10px] sm:text-xs h-11 border-border/50"
                onClick={() => {
                  setIsEditing(false);
                  // Kembalikan form ke state semula
                  reset({
                    name: player.name,
                    dateOfBirth: player.dateOfBirth ? toYYYYMMDD(player.dateOfBirth) : "",
                    schoolOrigin: player.schoolOrigin || "",
                    groupId: player.groupId || "",
                  });
                }}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending} className="flex-2 font-bold uppercase tracking-widest text-[10px] sm:text-xs h-11">
                {isPending ? <Loader2 className="animate-spin size-3.5 sm:size-4 mr-2" /> : <Edit2 className="size-3.5 sm:size-4 mr-2" />}
                Simpan
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex flex-col gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border/50 bg-background/50 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="size-3.5 text-white" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Tgl Lahir</span>
                  </div>
                  <span className="text-sm font-semibold truncate">{player.dateOfBirth ? new Date(player.dateOfBirth).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}</span>
                </div>

                <div className="p-4 rounded-xl border border-border/50 bg-background/50 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MapPin className="size-3.5" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Asal Sekolah</span>
                  </div>
                  <span className="text-sm font-semibold truncate" title={player.schoolOrigin || "-"}>
                    {player.schoolOrigin || "-"}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border/50 bg-background/50 flex flex-col gap-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="size-3.5" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Kelompok Latihan</span>
                  </div>
                </div>
                <span className="text-sm font-semibold truncate">{player.group ? player.group.name : "Belum masuk kelompok"}</span>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-2 border-t border-border/50">
              <Button type="button" variant="outline" className="flex-1 font-bold uppercase tracking-widest text-[10px] sm:text-xs h-11 border-border/50" onClick={() => onOpenChange(false)}>
                Tutup
              </Button>
              <Button type="button" className="flex-2 font-bold uppercase tracking-widest text-[10px] sm:text-xs h-11" onClick={() => setIsEditing(true)}>
                <Edit2 className="size-3.5 sm:size-4 mr-1.5" /> Edit
              </Button>
              <Button type="button" variant="destructive" className="flex-1 font-bold uppercase tracking-widest text-[10px] sm:text-xs h-11" onClick={onDelete}>
                <Trash2 className="size-3.5 sm:size-4 mr-1.5" /> Hapus
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
