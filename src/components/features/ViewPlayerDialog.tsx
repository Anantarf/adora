"use client";

import { useEffect, useState } from "react";
import { type Player } from "@/types/dashboard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Calendar, MapPin, Phone, Loader2, Link2, ImageIcon, PenLine } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePlayerDetail, useUpdatePlayer } from "@/hooks/use-players";
import { useGroups } from "@/hooks/use-groups";

import { toast } from "sonner";
import { playerSchema, playerToFormValues, type PlayerFormValues } from "@/lib/validation/player";
import { PlayerFormFields } from "@/components/features/PlayerFormFields";
import { buildPlayerFullName, calculateAgeFromDate } from "@/lib/player-profile";

interface ViewPlayerDialogProps {
  playerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}

export function ViewPlayerDialog({ playerId, open, onOpenChange, onDelete }: ViewPlayerDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { data: groups, isLoading: isGroupsLoading } = useGroups();
  const { data: player, isLoading: isPlayerLoading } = usePlayerDetail(playerId, open);

  const { mutateAsync: updatePlayer, isPending } = useUpdatePlayer();

  const { register, handleSubmit, control, setValue, formState: { errors }, reset } = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: player ? playerToFormValues(player as Player) : undefined,
  });

  useEffect(() => {
    if (!open || !player) {
      return;
    }

    reset(playerToFormValues(player as Player));
  }, [open, playerId, player, reset]);

  const onSubmit = async (data: PlayerFormValues) => {
    if (!player) return;
    try {
      await updatePlayer({ id: player.id, data: { ...data, parentId: data.parentId || null } });
      toast.success(`Profil ${buildPlayerFullName(data.firstName, data.lastName)} berhasil diperbarui!`);
      reset(data);
      setIsEditing(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      const errorMsg = msg.includes("Prisma") || msg.includes("Unique constraint") 
        ? "Terjadi kesalahan pada sistem. Silakan coba kembali." 
        : msg;
      toast.error(errorMsg || "Gagal memperbarui profil pemain.");
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
            {isEditing ? "Ubah Profil Pemain" : isPlayerLoading ? "Memuat Detail Pemain" : "Detail Pemain"}
          </DialogTitle>
          {!isEditing && player && (
            <dl className="rounded-lg border border-border/50 bg-background/40 divide-y divide-border/40">
              <div className="grid grid-cols-12 gap-2 px-3 py-2">
                <dt className="col-span-4 text-micro text-muted-foreground">Nama</dt>
                <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{buildPlayerFullName(player.firstName, player.lastName) || player.name}</dd>
              </div>
              <div className="grid grid-cols-12 gap-2 px-3 py-2">
                <dt className="col-span-4 text-micro text-muted-foreground">Kelompok</dt>
                <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">
                  {player.group ? player.group.name : "Belum masuk kelompok"}
                </dd>
              </div>
            </dl>
          )}
        </DialogHeader>

        {isEditing ? (
          player ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 pt-1.5">
            <PlayerFormFields
              register={register}
              control={control}
              errors={errors}
              setValue={setValue}
              groups={groups}
              isGroupsLoading={isGroupsLoading}
              step="all"
              inputClassName="h-10 bg-background/50"
            />

            <div className="pt-3 flex items-center gap-1.5 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-10 font-semibold border-border/60"
                onClick={() => {
                  setIsEditing(false);
                  reset(playerToFormValues(player as Player));
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
            <div className="py-10 flex items-center justify-center text-muted-foreground">
              <Loader2 className="size-5 animate-spin mr-2" /> Memuat form pemain...
            </div>
          )
        ) : (
          <>
            {!player ? (
              <div className="py-10 flex items-center justify-center text-muted-foreground">
                <Loader2 className="size-5 animate-spin mr-2" /> Memuat detail pemain...
              </div>
            ) : (
              <>
            <div className="py-1.5">
              <dl className="rounded-xl border border-border/50 bg-background/50 divide-y divide-border/40">
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 flex items-center gap-2 text-micro text-muted-foreground">
                    <Calendar className="size-3.5" /> Tgl Lahir
                  </dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">
                    {player.dateOfBirth ? new Date(player.dateOfBirth).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                  </dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-micro text-muted-foreground">Umur</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">
                    {calculateAgeFromDate(player.dateOfBirth) === null ? "-" : `${calculateAgeFromDate(player.dateOfBirth)} tahun`}
                  </dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-micro text-muted-foreground">Tempat Lahir</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{player.placeOfBirth || "-"}</dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-micro text-muted-foreground">Jenis Kelamin</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{player.gender || "-"}</dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-micro text-muted-foreground">Agama</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{player.religion || "-"}</dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-micro text-muted-foreground">Berat/Tinggi</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">
                    {player.weight || "-"} / {player.height || "-"}
                  </dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 flex items-center gap-2 text-micro text-muted-foreground">
                    <MapPin className="size-3.5" /> Asal Sekolah
                  </dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{player.schoolOrigin || "-"}</dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-micro text-muted-foreground">Alamat Rumah</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">
                    {[player.addressLine1 || player.address, player.addressLine2, player.city, player.province, player.postalCode].filter(Boolean).join(", ") || "-"}
                  </dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-micro text-muted-foreground">Alamat KTP/KK</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{player.ktpAddress || "-"}</dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-micro text-muted-foreground">Email</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{player.email || "-"}</dd>
                </div>
                {player.phoneNumber && (
                  <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                    <dt className="col-span-4 flex items-center gap-2 text-micro text-muted-foreground">
                      <Phone className="size-3.5" /> No. Telf
                    </dt>
                    <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{player.phoneNumber}</dd>
                  </div>
                )}
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-micro text-muted-foreground">Instagram</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{player.instagram || "-"}</dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-micro text-muted-foreground">Nama Orang Tua</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">
                    {player.parentName || "-"}
                    {player.user && (
                      <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary text-[10px] font-bold tracking-wide leading-none">
                        <Link2 className="size-2.5" />
                        {player.user.username ?? player.user.id}
                      </span>
                    )}
                  </dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-micro text-muted-foreground">No. Telf. Orang Tua</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{player.parentPhoneNumber || "-"}</dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-micro text-muted-foreground">Alamat Orang Tua</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{player.parentAddress || "-"}</dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-micro text-muted-foreground">Riwayat Penyakit</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">
                    {player.hasMedicalCondition ? player.medicalConditionDetail || player.medicalHistory || "-" : "Tidak ada"}
                  </dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-micro text-muted-foreground">Pas Foto</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">
                    {player.photoUrl ? (
                      <a href={player.photoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
                        <ImageIcon className="size-3.5" /> Lihat Pas Foto
                      </a>
                    ) : "-"}
                  </dd>
                </div>
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 text-micro text-muted-foreground">Tanda Tangan</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">
                    {player.signatureUrl ? (
                      <a href={player.signatureUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
                        <PenLine className="size-3.5" /> Lihat Tanda Tangan
                      </a>
                    ) : "-"}
                  </dd>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
