"use client";

import { useState, useEffect } from "react";
import { type Player } from "@/types/dashboard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Calendar, MapPin, Phone, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdatePlayer } from "@/hooks/use-players";
import { useGroups } from "@/hooks/use-groups";
import { toast } from "sonner";
import { playerSchema, playerToFormValues, type PlayerFormValues } from "@/lib/validation/player";
import { PlayerFormFields } from "@/components/features/PlayerFormFields";

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

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: playerToFormValues(player),
  });

  useEffect(() => {
    if (open) {
      setIsEditing(false);
      reset(playerToFormValues(player));
    }
  }, [open, player, reset]);

  const onSubmit = async (data: PlayerFormValues) => {
    try {
      await updatePlayer({ id: player.id, data });
      toast.success(`Profil ${player.name} berhasil diperbarui!`);
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
      <DialogContent className="sm:max-w-3xl bg-card border-border/50 transition-all duration-base">
        <DialogHeader className="space-y-2.5">
          <DialogTitle className="text-lg font-heading tracking-wide text-foreground text-left">
            {isEditing ? "Ubah Profil Pemain" : "Detail Pemain"}
          </DialogTitle>
          {!isEditing && (
            <dl className="rounded-lg border border-border/50 bg-background/40 divide-y divide-border/40">
              <div className="grid grid-cols-12 gap-2 px-3 py-2">
                <dt className="col-span-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Nama</dt>
                <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{player.name}</dd>
              </div>
              <div className="grid grid-cols-12 gap-2 px-3 py-2">
                <dt className="col-span-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Kelompok</dt>
                <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">
                  {player.group ? player.group.name : "Belum masuk kelompok"}
                </dd>
              </div>
            </dl>
          )}
        </DialogHeader>

        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 pt-1.5">
            <PlayerFormFields
              register={register}
              control={control}
              errors={errors}
              groups={groups}
              isGroupsLoading={isGroupsLoading}
              inputClassName="h-10 bg-background/50"
            />

            <div className="pt-3 flex items-center gap-1.5 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-10 font-semibold border-border/60"
                onClick={() => {
                  setIsEditing(false);
                  reset(playerToFormValues(player));
                }}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending} className="flex-2 h-10 font-semibold">
                {isPending ? <Loader2 className="animate-spin size-3.5 sm:size-4 mr-2" /> : <Edit2 className="size-3.5 sm:size-4 mr-2" />}
                Simpan Perubahan
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="py-1.5">
              <dl className="rounded-xl border border-border/50 bg-background/50 divide-y divide-border/40">
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                    <Calendar className="size-3.5" /> Tgl Lahir
                  </dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">
                    {player.dateOfBirth ? new Date(player.dateOfBirth).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                  </dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Tempat Lahir</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{player.placeOfBirth || "-"}</dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Jenis Kelamin</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{player.gender || "-"}</dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Berat/Tinggi</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">
                    {player.weight || "-"} / {player.height || "-"}
                  </dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                    <MapPin className="size-3.5" /> Asal Sekolah
                  </dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{player.schoolOrigin || "-"}</dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Alamat Rumah</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{player.address || "-"}</dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Email</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{player.email || "-"}</dd>
                </div>
                {player.phoneNumber && (
                  <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                    <dt className="col-span-4 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                      <Phone className="size-3.5" /> No. Telf
                    </dt>
                    <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{player.phoneNumber}</dd>
                  </div>
                )}
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Nama Orang Tua</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{player.parentName || "-"}</dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">No. Telf. Orang Tua</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{player.parentPhoneNumber || "-"}</dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Alamat Orang Tua</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{player.parentAddress || "-"}</dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Riwayat Penyakit</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{player.medicalHistory || "-"}</dd>
                </div>
              </dl>
            </div>

            <div className="pt-3 border-t border-border/50 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-1.5">
              <Button type="button" variant="outline" className="h-10 px-4 font-semibold border-border/60" onClick={() => onOpenChange(false)}>
                Tutup
              </Button>
              <div className="flex items-center gap-1.5">
                <Button type="button" className="h-10 px-4.5 font-semibold" onClick={() => setIsEditing(true)}>
                  <Edit2 className="size-4 mr-2" /> Edit Profil
                </Button>
                <Button type="button" variant="outline" className="h-10 px-4 font-semibold border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onDelete}>
                  <Trash2 className="size-4 mr-2" /> Hapus
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
