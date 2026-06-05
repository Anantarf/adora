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
import { formatFullDate, normalizeDateInputToISO } from "@/lib/date-utils";
import { toUserErrorMessage } from "@/lib/utils";

interface ViewPlayerDialogProps {
  playerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}

function buildReadableAddress(player: Player) {
  return [
    player.addressLine1 || player.address,
    player.addressLine2,
    player.city,
    player.province,
    player.postalCode,
  ].filter(Boolean).join(", ");
}

function normalizeAddress(value?: string | null) {
  return value?.trim().replace(/\s+/g, " ").toLowerCase() ?? "";
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 rounded-xl border border-border/50 bg-background/50 p-3">
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
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="grid grid-cols-12 items-start gap-2 py-1.5 first:pt-0 last:pb-0">
      <dt className="col-span-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className={`col-span-8 text-right sm:text-left wrap-break-word ${valueClassName ?? "text-sm font-semibold text-foreground"}`}>{value}</dd>
    </div>
  );
}

function DocumentLinkCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/40 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-background/60"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background/60 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      <span className="shrink-0 text-xs font-medium text-primary">Lihat</span>
    </a>
  );
}

export function ViewPlayerDialog({ playerId, open, onOpenChange, onDelete }: ViewPlayerDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { data: groups, isLoading: isGroupsLoading } = useGroups();
  const { data: player, isLoading: isPlayerLoading } = usePlayerDetail(playerId, open);
  const resolvedPlayer = (player as unknown as Player) ?? null;
  const homeAddress = resolvedPlayer ? buildReadableAddress(resolvedPlayer) : "";
  const isKtpSameAsHome =
    Boolean(homeAddress) && normalizeAddress(resolvedPlayer?.ktpAddress) === normalizeAddress(homeAddress);
  const isParentAddressSameAsHome =
    Boolean(homeAddress) && normalizeAddress(resolvedPlayer?.parentAddress) === normalizeAddress(homeAddress);

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

  const editFormId = "player-detail-edit-form";

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) setIsEditing(false);
        onOpenChange(val);
      }}
    >
      <DialogContent className="flex h-[min(92vh,52rem)] max-h-[92vh] flex-col overflow-hidden border-border/50 bg-card p-0 transition-all duration-base sm:max-w-4xl">
        <DialogHeader className="space-y-2 border-b border-border/50 px-5 py-3 pr-12">
          <DialogTitle className="text-lg font-heading tracking-wide text-foreground text-left">
            {isEditing ? "Ubah Profil Pemain" : isPlayerLoading ? "Memuat Detail Pemain" : "Detail Pemain"}
          </DialogTitle>
          {!isEditing && resolvedPlayer && (
            <div className="flex items-start gap-4 rounded-lg border border-border/50 bg-background/40 p-3">
              <div className="shrink-0">
                {resolvedPlayer.photoUrl ? (
                  <a
                    href={resolvedPlayer.photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-lg border border-border/50 bg-background/60 transition-colors hover:border-primary/40"
                    aria-label="Lihat pas foto pemain"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolvedPlayer.photoUrl}
                      alt={`Pas foto ${buildPlayerFullName(resolvedPlayer.firstName, resolvedPlayer.lastName) || resolvedPlayer.name}`}
                      className="h-28 w-21 object-cover object-top"
                    />
                  </a>
                ) : (
                  <div className="flex h-28 w-21 items-center justify-center rounded-lg border border-dashed border-border/50 bg-background/40 px-2 text-center text-[11px] font-medium text-muted-foreground">
                    Tidak ada foto
                  </div>
                )}
              </div>

              <dl className="min-w-0 flex-1 divide-y divide-border/40 rounded-lg border border-border/40 bg-background/30">
                <div className="grid grid-cols-12 gap-2 px-3 py-1.5">
                  <dt className="col-span-4 text-xs font-medium text-muted-foreground">Nama</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{buildPlayerFullName(resolvedPlayer.firstName, resolvedPlayer.lastName) || resolvedPlayer.name}</dd>
                </div>
                <div className="grid grid-cols-12 gap-2 px-3 py-1.5">
                  <dt className="col-span-4 text-xs font-medium text-muted-foreground">Kelompok</dt>
                  <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">
                    {resolvedPlayer.group ? resolvedPlayer.group.name : "Belum masuk kelompok"}
                  </dd>
                </div>
              </dl>
            </div>
          )}
          {!isEditing && resolvedPlayer ? (
            <div className="flex flex-wrap gap-2">
              {calculateAgeFromDate(resolvedPlayer.dateOfBirth) !== null ? (
                <span className="inline-flex items-center rounded-md border border-border/50 bg-background/40 px-2 py-1 text-xs font-medium text-foreground">
                  {calculateAgeFromDate(resolvedPlayer.dateOfBirth)} tahun
                </span>
              ) : null}
              {resolvedPlayer.gender ? (
                <span className="inline-flex items-center rounded-md border border-border/50 bg-background/40 px-2 py-1 text-xs font-medium text-foreground">
                  {resolvedPlayer.gender}
                </span>
              ) : null}
              {resolvedPlayer.schoolOrigin ? (
                <span className="inline-flex items-center rounded-md border border-border/50 bg-background/40 px-2 py-1 text-xs font-medium text-foreground">
                  {resolvedPlayer.schoolOrigin}
                </span>
              ) : null}
              {resolvedPlayer.user?.username ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  <Link2 className="size-3" />
                  {resolvedPlayer.user.username}
                </span>
              ) : null}
            </div>
          ) : null}
        </DialogHeader>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-3 pr-3">
        {isEditing ? (
          resolvedPlayer ? (
          <form id={editFormId} onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-1">
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
            <div className="py-1">
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
                    value={buildReadableAddress(resolvedPlayer) || "-"}
                    valueClassName="text-sm font-medium leading-relaxed text-foreground/85"
                  />
                  <DetailRow
                    label="Alamat KTP/KK"
                    value={
                      !resolvedPlayer.ktpAddress
                        ? "-"
                        : isKtpSameAsHome
                          ? "Sama dengan alamat rumah"
                          : resolvedPlayer.ktpAddress
                    }
                    valueClassName={
                      !resolvedPlayer.ktpAddress
                        ? "text-sm font-medium text-foreground"
                        : isKtpSameAsHome
                          ? "text-sm font-medium text-muted-foreground"
                          : "text-sm font-medium leading-relaxed text-foreground/85"
                    }
                  />
                  <DetailRow label="Email" value={resolvedPlayer.email || "-"} />
                  <DetailRow label="No. Telf" icon={<Phone className="size-3.5" />} value={resolvedPlayer.phoneNumber || "-"} />
                  <DetailRow label="Instagram" value={resolvedPlayer.instagram || "-"} />
                  <DetailRow label="Nama Orang Tua" value={resolvedPlayer.parentName || "-"} />
                  <DetailRow label="No. Telf. Orang Tua" value={resolvedPlayer.parentPhoneNumber || "-"} />
                  <DetailRow
                    label="Alamat Orang Tua"
                    value={
                      !resolvedPlayer.parentAddress
                        ? "-"
                        : isParentAddressSameAsHome
                          ? "Sama dengan alamat rumah"
                          : resolvedPlayer.parentAddress
                    }
                    valueClassName={
                      !resolvedPlayer.parentAddress
                        ? "text-sm font-medium text-foreground"
                        : isParentAddressSameAsHome
                          ? "text-sm font-medium text-muted-foreground"
                          : "text-sm font-medium leading-relaxed text-foreground/85"
                    }
                  />
                </DetailSection>

                <DetailSection title="Medis dan Dokumen">
                  <DetailRow label="Riwayat Penyakit" value={resolvedPlayer.hasMedicalCondition ? resolvedPlayer.medicalConditionDetail || resolvedPlayer.medicalHistory || "-" : "Tidak ada"} />
                  {resolvedPlayer.photoUrl || resolvedPlayer.signatureUrl ? (
                    <div className="space-y-2 pt-2">
                      {resolvedPlayer.photoUrl ? (
                        <DocumentLinkCard
                          href={resolvedPlayer.photoUrl}
                          icon={<ImageIcon className="size-4" />}
                          title="Pas Foto"
                          description="Buka lampiran pas foto pemain."
                        />
                      ) : null}
                      {resolvedPlayer.signatureUrl ? (
                        <DocumentLinkCard
                          href={resolvedPlayer.signatureUrl}
                          icon={<PenLine className="size-4" />}
                          title="Tanda Tangan"
                          description="Buka lampiran tanda tangan pemain."
                        />
                      ) : null}
                    </div>
                  ) : (
                    <DetailRow label="Lampiran" value="Belum ada pas foto atau tanda tangan." />
                  )}
                </DetailSection>
              </div>
            </div>
              </>
            )}
          </>
        )}
        </div>

        {isEditing ? (
          resolvedPlayer ? (
            <div className="flex shrink-0 items-center gap-1.5 border-t border-border/50 bg-card px-5 py-3">
              <Button
                type="button"
                variant="outline"
                className="h-10 flex-1 border-border/60 font-semibold"
                onClick={() => {
                  setIsEditing(false);
                  reset(playerToFormValues(resolvedPlayer));
                }}
              >
                Batal
              </Button>
              <Button type="submit" form={editFormId} disabled={isPending} className="h-10 flex-[2] font-semibold">
                {isPending ? <Loader2 className="mr-2 size-3.5 animate-spin sm:size-4" /> : <Edit2 className="mr-2 size-3.5 sm:size-4" />}
                Simpan Perubahan
              </Button>
            </div>
          ) : null
        ) : resolvedPlayer ? (
          <div className="flex shrink-0 flex-col-reverse gap-1.5 border-t border-border/50 bg-card px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" className="h-10 border-border/60 px-4 font-semibold" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
            <div className="flex items-center gap-1.5">
              <Button type="button" className="h-10 px-4.5 font-semibold" onClick={() => setIsEditing(true)}>
                <Edit2 className="mr-2 size-4" /> Edit Profil
              </Button>
              <Button type="button" variant="outline" className="h-10 border-destructive/40 px-4 font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onDelete}>
                <Trash2 className="mr-2 size-4" /> Hapus
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
