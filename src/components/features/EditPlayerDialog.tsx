"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdatePlayer } from "@/hooks/use-players";
import { type Player } from "@/types/dashboard";
import { useGroups } from "@/hooks/use-groups";
import { toast } from "sonner";
import { toYYYYMMDD } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit2, Loader2 } from "lucide-react";

// Schema validasi yang sama dengan AddPlayerDialog
const playerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  dateOfBirth: z.string().nonempty("TTL wajib diisi"),
  schoolOrigin: z.string().min(3, "Asal Sekolah minimal 3 karakter"),
  groupId: z.string().nonempty("Grup wajib dipilih"),
});

type PlayerForm = z.infer<typeof playerSchema>;

interface EditPlayerDialogProps {
  player: Player;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPlayerDialog({ player, open, onOpenChange }: EditPlayerDialogProps) {
  const { data: groups, isLoading: isGroupsLoading } = useGroups();
  const { mutateAsync: updatePlayer, isPending } = useUpdatePlayer();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<PlayerForm>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: player.name,
      dateOfBirth: toYYYYMMDD(player.dateOfBirth),
      schoolOrigin: player.schoolOrigin || "",
      groupId: player.groupId || "",
    },
  });

  const watchedGroupId = watch("groupId");

  // Reset form when player or open state changes
  useEffect(() => {
    if (open) {
      reset({
        name: player.name,
        dateOfBirth: toYYYYMMDD(player.dateOfBirth),
        schoolOrigin: player.schoolOrigin || "",
        groupId: player.groupId || "",
      });
    }
  }, [player, open, reset]);

  const onSubmit = async (data: PlayerForm) => {
    try {
      await updatePlayer({
        id: player.id,
        data: {
          ...data,
          // Server Action handles date transformation
        },
      });

      toast.success(`Profil ${player.name} berhasil diperbarui!`);
      onOpenChange(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal memperbarui.";
      toast.error("Error: " + msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading uppercase tracking-widest flex items-center gap-2">
            <Edit2 className="size-5 text-primary" /> Ubah Data Atlet
          </DialogTitle>
          <DialogDescription className="text-xs font-medium tracking-wide uppercase opacity-70">Pastikan data yang diinput sesuai dengan identitas resmi.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">Nama Lengkap</label>
            <Input {...register("name")} className="h-11 bg-background/50" />
            {errors.name && <p className="text-destructive text-xs font-semibold uppercase">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">Tanggal Lahir</label>
            <Input type="date" {...register("dateOfBirth")} className="h-11 bg-background/50" />
            {errors.dateOfBirth && <p className="text-destructive text-xs font-semibold uppercase">{errors.dateOfBirth.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">Asal Sekolah</label>
            <Input {...register("schoolOrigin")} className="h-11 bg-background/50" />
            {errors.schoolOrigin && <p className="text-destructive text-xs font-semibold uppercase">{errors.schoolOrigin.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">Grup Latihan</label>
            <Select
              value={watchedGroupId}
              onValueChange={(val) => {
                if (val) setValue("groupId", val);
              }}
              disabled={isGroupsLoading}
            >
              <SelectTrigger className="h-11 bg-background/50">
                <SelectValue placeholder="Pilih Grup" />
              </SelectTrigger>
              <SelectContent>
                {groups?.map((group: { id: string; name: string }) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.groupId && <p className="text-destructive text-xs font-semibold uppercase">{errors.groupId.message}</p>}
          </div>

          <div className="pt-6 flex gap-2">
            <Button type="button" variant="outline" className="flex-1 h-11 font-bold uppercase tracking-widest text-xs" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending} className="flex-2 h-11 font-bold tracking-widest uppercase text-xs">
              {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
