"use client";

import { useEffect, useState } from "react";
import { type Player } from "@/types/dashboard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Calendar, MapPin, Phone, Loader2, Link2, ImageIcon, PenLine } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePlayerDetail, useUpdatePlayer, type PlayerDetailData } from "@/hooks/use-players";
import { useGroups } from "@/hooks/use-groups";

import { toast } from "sonner";
import { playerSchema, playerToFormValues, type PlayerFormValues } from "@/lib/validation/player";
import { PlayerFormFields } from "@/components/features/PlayerFormFields";
import { buildPlayerFullName, calculateAgeFromDate } from "@/lib/player-profile";
import { formatFullDate, normalizeDateInputToISO } from "@/lib/date-utils";
import { toUserErrorMessage } from "@/lib/utils";

interface ViewPlayerDialogProps {
  playerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-border/50 bg-background/50 p-4">
      <div className="border-b border-border/40 pb-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <dl className="divide-y divide-border/40">{children}</dl>
    </section>
  );
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-12 items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
      <dt className="col-span-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{value}</dd>
    </div>
  );
}

export function ViewPlayerDialog({ playerId, open, onOpenChange, onDelete }: ViewPlayerDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { data: groups, isLoading: isGroupsLoading } = useGroups();
  const { data: player, isLoading: isPlayerLoading } = usePlayerDetail(playerId, open);
  const resolvedPlayer = (player as unknown as Player) ?? null;

  const { mutateAsync: updatePlayer, isPending } = useUpdatePlayer();

  const { register, handleSubmit, control, setValue, formState: { errors }, reset } = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: resolvedPlayer ? playerToFormValues(resolvedPlayer) : undefined,
  });

  useEffect(() => {
    if (!open || !resolvedPlayer) {
      return;
    }

    reset(playerToFormValues(resolvedPlayer));
  }, [open, playerId, resolvedPlayer, reset]);

  const onSubmit = async (data: PlayerFormValues) => {
    if (!resolvedPlayer) return;
    try {
      await updatePlayer({
        id: resolvedPlayer.id,
        data: {
          ...data,
          dateOfBirth: normalizeDateInputToISO(data.dateOfBirth),
          parentId: data.parentId || null,
        },
      });
      toast.success(`Profil ${buildPlayerFullName(data.firstName, data.lastName)} berhasil diperbarui!`);
      reset(data);
      setIsEditing(false);
    } catch (error) {
      toast.error(toUserErrorMessage(error, "Gagal memperbarui profil pemain."));
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
          {!isEditing && resolvedPlayer && (
            <dl className="rounded-lg border border-border/50 bg-background/40 divide-y divide-border/40">
              <div className="grid grid-cols-12 gap-2 px-3 py-2">
                <dt className="col-span-4 text-xs font-medium text-muted-foreground">Nama</dt>
                <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{buildPlayerFullName(resolvedPlayer.firstName, resolvedPlayer.lastName) || resolvedPlayer.name}</dd>
              </div>
              <div className="grid grid-cols-12 gap-2 px-3 py-2">
                <dt className="col-span-4 text-xs font-medium text-muted-foreground">Kelompok</dt>
                <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">
                  {resolvedPlayer.group ? resolvedPlayer.group.name : "Belum masuk kelompok"}
                </dd>
              </div>
            </dl>
          )}
        </DialogHeader>

        {isEditing ? (
          resolvedPlayer ? (
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
                  reset(playerToFormValues(resolvedPlayer as Player));
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
            {!resolvedPlayer ? (
              <div className="py-10 flex items-center justify-center text-muted-foreground">
                <Loader2 className="size-5 animate-spin mr-2" /> Memuat detail pemain...
              </div>
            ) : (
              <>
            <div className="py-1.5">
              <div className="space-y-4">
                <DetailSection title="Data Pribadi">
                  <DetailRow
                    label="Tgl Lahir"
                    icon={<Calendar className="size-3.5" />}
                    value={resolvedPlayer.dateOfBirth ? formatFullDate(resolvedPlayer.dateOfBirth) : "-"}
                  />
                  <DetailRow label="Umur" value={calculateAgeFromDate(resolvedPlayer.dateOfBirth) === null ? "-" : `${calculateAgeFromDate(resolvedPlayer.dateOfBirth)} tahun`} />
                  <DetailRow label="Tempat Lahir" value={resolvedPlayer.placeOfBirth || "-"} />
                  <DetailRow label="Jenis Kelamin" value={resolvedPlayer.gender || "-"} />
                  <DetailRow label="Agama" value={resolvedPlayer.religion || "-"} />
                  <DetailRow label="Berat/Tinggi" value={`${resolvedPlayer.weight || "-"} / ${resolvedPlayer.height || "-"}`} />
                  <DetailRow label="Asal Sekolah" icon={<MapPin className="size-3.5" />} value={resolvedPlayer.schoolOrigin || "-"} />
                </DetailSection>

                <DetailSection title="Kontak dan Alamat">
                  <DetailRow
                    label="Alamat Rumah"
                    value={[resolvedPlayer.addressLine1 || resolvedPlayer.address, resolvedPlayer.addressLine2, resolvedPlayer.city, resolvedPlayer.province, resolvedPlayer.postalCode].filter(Boolean).join(", ") || "-"}
                  />
                  <DetailRow label="Alamat KTP/KK" value={resolvedPlayer.ktpAddress || "-"} />
                  <DetailRow label="Email" value={resolvedPlayer.email || "-"} />
                  <DetailRow label="No. Telf" icon={<Phone className="size-3.5" />} value={resolvedPlayer.phoneNumber || "-"} />
                  <DetailRow label="Instagram" value={resolvedPlayer.instagram || "-"} />
                  <DetailRow
                    label="Nama Orang Tua"
                    value={
                      <>
                        {resolvedPlayer.parentName || "-"}
                        {resolvedPlayer.user && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary">
                            <Link2 className="size-2.5" />
                            {resolvedPlayer.user.username ?? resolvedPlayer.user.id}
                          </span>
                        )}
                      </>
                    }
                  />
                  <DetailRow label="No. Telf. Orang Tua" value={resolvedPlayer.parentPhoneNumber || "-"} />
                  <DetailRow label="Alamat Orang Tua" value={resolvedPlayer.parentAddress || "-"} />
                </DetailSection>

                <DetailSection title="Medis dan Dokumen">
                  <DetailRow label="Riwayat Penyakit" value={resolvedPlayer.hasMedicalCondition ? resolvedPlayer.medicalConditionDetail || resolvedPlayer.medicalHistory || "-" : "Tidak ada"} />
                  <DetailRow
                    label="Pas Foto"
                    value={
                      resolvedPlayer.photoUrl ? (
                        <a href={resolvedPlayer.photoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
                          <ImageIcon className="size-3.5" /> Lihat Pas Foto
                        </a>
                      ) : (
                        "-"
                      )
                    }
                  />
                  <DetailRow
                    label="Tanda Tangan"
                    value={
                      resolvedPlayer.signatureUrl ? (
                        <a href={resolvedPlayer.signatureUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
                          <PenLine className="size-3.5" /> Lihat Tanda Tangan
                        </a>
                      ) : (
                        "-"
                      )
                    }
                  />
                </DetailSection>
              </div>
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
