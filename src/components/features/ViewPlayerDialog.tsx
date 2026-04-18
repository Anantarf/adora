"use client";

import { useState, useEffect } from "react";
import { type Player } from "@/types/dashboard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Calendar, MapPin, Phone, Loader2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdatePlayer } from "@/hooks/use-players";
import { useGroups, type Group } from "@/hooks/use-groups";
import { toast } from "sonner";
import { toYYYYMMDD } from "@/lib/date-utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Schema validasi
const playerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  dateOfBirth: z.string().nonempty("TTL wajib diisi"),
  placeOfBirth: z.string().optional(),
  gender: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  schoolOrigin: z.string().optional(),
  address: z.string().optional(),
  email: z.string().optional(),
  phoneNumber: z.string().optional(),
  medicalHistory: z.string().optional(),
  parentName: z.string().optional(),
  parentAddress: z.string().optional(),
  parentPhoneNumber: z.string().optional(),
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
      placeOfBirth: player.placeOfBirth || "",
      gender: player.gender || "",
      weight: player.weight || "",
      height: player.height || "",
      schoolOrigin: player.schoolOrigin || "",
      address: player.address || "",
      email: player.email || "",
      phoneNumber: player.phoneNumber || "",
      medicalHistory: player.medicalHistory || "",
      parentName: player.parentName || "",
      parentAddress: player.parentAddress || "",
      parentPhoneNumber: player.parentPhoneNumber || "",
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
        placeOfBirth: player.placeOfBirth || "",
        gender: player.gender || "",
        weight: player.weight || "",
        height: player.height || "",
        schoolOrigin: player.schoolOrigin || "",
        address: player.address || "",
        email: player.email || "",
        phoneNumber: player.phoneNumber || "",
        medicalHistory: player.medicalHistory || "",
        parentName: player.parentName || "",
        parentAddress: player.parentAddress || "",
        parentPhoneNumber: player.parentPhoneNumber || "",
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
      <DialogContent className="sm:max-w-3xl bg-card border-border/50 transition-all duration-300">
        <DialogHeader className="space-y-2.5">
          <DialogTitle className="text-lg font-heading tracking-wide text-foreground text-left">{isEditing ? "Ubah Profil Pemain" : "Detail Pemain"}</DialogTitle>
          {!isEditing && (
            <dl className="rounded-lg border border-border/50 bg-background/40 divide-y divide-border/40">
              <div className="grid grid-cols-12 gap-2 px-3 py-2">
                <dt className="col-span-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Nama</dt>
                <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{player.name}</dd>
              </div>
              <div className="grid grid-cols-12 gap-2 px-3 py-2">
                <dt className="col-span-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Kelompok</dt>
                <dd className="col-span-8 text-sm font-semibold text-foreground text-right sm:text-left wrap-break-word">{player.group ? player.group.name : "Belum masuk kelompok"}</dd>
              </div>
            </dl>
          )}
        </DialogHeader>

        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 pt-1.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">Nama Lengkap</label>
                <Input {...register("name")} defaultValue={player.name} className="h-10 bg-background/50" />
                {errors.name && <p className="text-destructive text-xs font-semibold uppercase">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">Tanggal Lahir</label>
                <Input type="date" {...register("dateOfBirth")} defaultValue={player.dateOfBirth ? toYYYYMMDD(player.dateOfBirth) : ""} className="h-10 bg-background/50 scheme-dark [&::-webkit-calendar-picker-indicator]:invert" />
                {errors.dateOfBirth && <p className="text-destructive text-xs font-semibold uppercase">{errors.dateOfBirth.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">
                  Tempat Lahir <span className="normal-case font-normal text-muted-foreground/50">(Opsional)</span>
                </label>
                <Input {...register("placeOfBirth")} defaultValue={player.placeOfBirth || ""} className="h-10 bg-background/50" />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">
                  Jenis Kelamin <span className="normal-case font-normal text-muted-foreground/50">(Opsional)</span>
                </label>
                <Input {...register("gender")} defaultValue={player.gender || ""} className="h-10 bg-background/50" />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">
                  Berat Badan <span className="normal-case font-normal text-muted-foreground/50">(Opsional)</span>
                </label>
                <Input {...register("weight")} defaultValue={player.weight || ""} className="h-10 bg-background/50" />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">
                  Tinggi Badan <span className="normal-case font-normal text-muted-foreground/50">(Opsional)</span>
                </label>
                <Input {...register("height")} defaultValue={player.height || ""} className="h-10 bg-background/50" />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">
                  Asal Sekolah <span className="normal-case font-normal text-muted-foreground/50">(Opsional)</span>
                </label>
                <Input {...register("schoolOrigin")} defaultValue={player.schoolOrigin || ""} className="h-10 bg-background/50" />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">
                  Email <span className="normal-case font-normal text-muted-foreground/50">(Opsional)</span>
                </label>
                <Input type="email" {...register("email")} defaultValue={player.email || ""} className="h-10 bg-background/50" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">
                  Alamat Rumah <span className="normal-case font-normal text-muted-foreground/50">(Opsional)</span>
                </label>
                <Input {...register("address")} defaultValue={player.address || ""} className="h-10 bg-background/50" />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">
                  No. Telepon <span className="normal-case font-normal text-muted-foreground/50">(Opsional)</span>
                </label>
                <Input type="tel" {...register("phoneNumber")} defaultValue={player.phoneNumber || ""} className="h-10 bg-background/50" />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">
                  No. Telepon Orang Tua <span className="normal-case font-normal text-muted-foreground/50">(Opsional)</span>
                </label>
                <Input type="tel" {...register("parentPhoneNumber")} defaultValue={player.parentPhoneNumber || ""} className="h-10 bg-background/50" />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">
                  Nama Orang Tua <span className="normal-case font-normal text-muted-foreground/50">(Opsional)</span>
                </label>
                <Input {...register("parentName")} defaultValue={player.parentName || ""} className="h-10 bg-background/50" />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">
                  Riwayat Penyakit Bawaan <span className="normal-case font-normal text-muted-foreground/50">(Opsional)</span>
                </label>
                <Input {...register("medicalHistory")} defaultValue={player.medicalHistory || ""} className="h-10 bg-background/50" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">
                  Alamat Orang Tua <span className="normal-case font-normal text-muted-foreground/50">(Opsional)</span>
                </label>
                <Input {...register("parentAddress")} defaultValue={player.parentAddress || ""} className="h-10 bg-background/50" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">Kelompok</label>
                <Controller
                  control={control}
                  name="groupId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""} disabled={isGroupsLoading}>
                      <SelectTrigger className="h-10 bg-background/50">
                        <SelectValue>{groups?.find((g: Group) => g.id === field.value)?.name || "Pilih Kelompok"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {groups?.map((group: Group) => (
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
            </div>

            <div className="pt-3 flex items-center gap-1.5 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-10 font-semibold border-border/60"
                onClick={() => {
                  setIsEditing(false);
                  // Kembalikan form ke state semula
                  reset({
                    name: player.name,
                    dateOfBirth: player.dateOfBirth ? toYYYYMMDD(player.dateOfBirth) : "",
                    placeOfBirth: player.placeOfBirth || "",
                    gender: player.gender || "",
                    weight: player.weight || "",
                    height: player.height || "",
                    schoolOrigin: player.schoolOrigin || "",
                    address: player.address || "",
                    email: player.email || "",
                    phoneNumber: player.phoneNumber || "",
                    medicalHistory: player.medicalHistory || "",
                    parentName: player.parentName || "",
                    parentAddress: player.parentAddress || "",
                    parentPhoneNumber: player.parentPhoneNumber || "",
                    groupId: player.groupId || "",
                  });
                }}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending} className="flex-2 h-10 font-semibold">
                {isPending ? <Loader2 className="animate-spin size-3.5 sm:size-4 mr-2" /> : <Edit2 className="size-3.5 sm:size-4 mr-2" />}
                Simpan
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="py-1.5">
              <dl className="rounded-xl border border-border/50 bg-background/50 divide-y divide-border/40">
                <div className="grid grid-cols-12 items-start gap-2.5 px-4 py-2.5">
                  <dt className="col-span-4 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                    <Calendar className="size-3.5" />
                    Tgl Lahir
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
                    <MapPin className="size-3.5" />
                    Asal Sekolah
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
                      <Phone className="size-3.5" />
                      No. Telf
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
                  <Edit2 className="size-4 mr-2" />
                  Edit Profil
                </Button>
                <Button type="button" variant="outline" className="h-10 px-4 font-semibold border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onDelete}>
                  <Trash2 className="size-4 mr-2" />
                  Hapus
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
