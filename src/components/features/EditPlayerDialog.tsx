"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdatePlayer } from "@/hooks/use-players";
import { type Player } from "@/types/dashboard";
import { useGroups } from "@/hooks/use-groups";
import { useParents } from "@/hooks/use-family";
import { toast } from "sonner";
import { toYYYYMMDD } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit2, Loader2 } from "lucide-react";

// Schema validasi yang sama dengan AddPlayerDialog
const playerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  dateOfBirth: z.string().nonempty("TTL wajib diisi"),
  schoolOrigin: z.string().min(3, "Asal Sekolah minimal 3 karakter"),
  groupId: z.string().nonempty("Grup wajib dipilih"),
  parentId: z.string().nonempty("Orang tua / wali wajib dipilih"),
});

type PlayerForm = z.infer<typeof playerSchema>;

interface EditPlayerDialogProps {
  player: Player;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPlayerDialog({ player, open, onOpenChange }: EditPlayerDialogProps) {
  const { data: groups, isLoading: isGroupsLoading } = useGroups();
  const { data: parents, isLoading: isParentsLoading } = useParents();
  const { mutateAsync: updatePlayer, isPending } = useUpdatePlayer();

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<PlayerForm>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: player.name,
      dateOfBirth: toYYYYMMDD(player.dateOfBirth),
      schoolOrigin: player.schoolOrigin || "",
      groupId: player.groupId || "",
      parentId: player.parentId || "",
    }
  });

  const watchedGroupId = watch("groupId");
  const watchedParentId = watch("parentId");

  // Reset form when player or open state changes
  useEffect(() => {
    if (open) {
      reset({
        name: player.name,
        dateOfBirth: toYYYYMMDD(player.dateOfBirth),
        schoolOrigin: player.schoolOrigin || "",
        groupId: player.groupId || "",
        parentId: player.parentId || "",
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
        }
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
      <DialogContent className="sm:max-w-[425px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading uppercase tracking-widest flex items-center gap-2">
            <Edit2 className="size-5 text-primary" /> Ubah Data Atlet
          </DialogTitle>
          <DialogDescription className="text-xs font-medium tracking-wide uppercase opacity-70">
            Pastikan data yang diinput sesuai dengan identitas resmi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Nama Lengkap</label>
            <Input {...register("name")} className="h-11 bg-background/50" />
            {errors.name && <p className="text-destructive text-[10px] font-bold uppercase ml-1 mt-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Tanggal Lahir</label>
            <Input type="date" {...register("dateOfBirth")} className="h-11 bg-background/50" />
            {errors.dateOfBirth && <p className="text-destructive text-[10px] font-bold uppercase ml-1 mt-1">{errors.dateOfBirth.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Asal Sekolah</label>
            <Input {...register("schoolOrigin")} className="h-11 bg-background/50" />
            {errors.schoolOrigin && <p className="text-destructive text-[10px] font-bold uppercase ml-1 mt-1">{errors.schoolOrigin.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Grup Latihan</label>
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
            {errors.groupId && <p className="text-destructive text-[10px] font-bold uppercase ml-1 mt-1">{errors.groupId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Orang Tua / Wali</label>
            <Select 
              value={watchedParentId} 
              onValueChange={(val) => {
                if (val) setValue("parentId", val);
              }}
              disabled={isParentsLoading}
            >
              <SelectTrigger className="h-11 bg-background/50">
                <SelectValue placeholder="Pilih Orang Tua" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {parents?.map((parent) => (
                  <SelectItem key={parent.id} value={parent.id} className="font-medium text-sm">
                    {parent.name || parent.username || parent.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.parentId && <p className="text-destructive text-[10px] font-bold uppercase ml-1 mt-1">{errors.parentId.message}</p>}
          </div>

          <div className="pt-6 flex gap-3">
            <Button 
                type="button" 
                variant="outline" 
                className="flex-1 h-11 font-bold uppercase tracking-widest text-[10px]"
                onClick={() => onOpenChange(false)}
            >
                Batal
            </Button>
            <Button 
                type="submit" 
                disabled={isPending} 
                className="flex-[2] h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-widest uppercase text-xs shadow-lg shadow-primary/20"
            >
              {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
