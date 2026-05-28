"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Controller, useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import type { PlayerFormValues } from "@/lib/validation/player";
import type { Group } from "@/hooks/use-groups";
import { calculateAgeFromDate } from "@/lib/player-profile";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

interface PlayerFormFieldsProps {
  register: UseFormRegister<PlayerFormValues>;
  control: Control<PlayerFormValues>;
  errors: FieldErrors<PlayerFormValues>;
  setValue: UseFormSetValue<PlayerFormValues>;
  groups: Group[] | undefined;
  isGroupsLoading?: boolean;
  inputClassName?: string;
  step?: number | "all";
  groupFieldHint?: string;
}

async function uploadAsset(file: File, assetKey: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("assetKey", assetKey);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "Upload gagal.");
  }

  return data.url as string;
}

function UploadField({
  label,
  value,
  onUploaded,
  error,
  assetKey,
}: {
  label: string;
  value?: string;
  onUploaded: (url: string) => void;
  error?: string;
  assetKey: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const previewLabel = value ? "Ganti file" : "Unggah";

  return (
    <div className="space-y-2">
      <label className="text-micro text-muted-foreground">
        {label} <span className="text-destructive">*</span>
      </label>
      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-border/50 bg-background/40 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5">
        <div className="flex items-center gap-3">
          {isUploading ? <Loader2 className="size-4 animate-spin text-primary" /> : <Upload className="size-4 text-muted-foreground" />}
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">{value ? "File berhasil diunggah" : "Pilih file gambar"}</span>
            <span className="text-[10px] text-muted-foreground">PNG atau JPG, maksimal 2MB.</span>
          </div>
        </div>
        <span className="rounded-lg bg-primary/10 px-3 py-1 text-micro text-primary">{previewLabel}</span>
        <input
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;

            setIsUploading(true);
            try {
              const url = await uploadAsset(file, `${assetKey}_${Date.now()}`);
              onUploaded(url);
              toast.success(`${label} berhasil diunggah.`);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Upload gagal.");
            } finally {
              setIsUploading(false);
              event.target.value = "";
            }
          }}
        />
      </label>
      {value ? (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-xl border border-border/50 bg-background/50 p-2">
            <img src={value} alt={label} className="h-28 w-full rounded-lg object-contain bg-background/60" />
          </div>
          <a href={value} target="_blank" rel="noreferrer" className="inline-flex text-[11px] font-medium text-primary hover:underline">
            Lihat file terunggah
          </a>
        </div>
      ) : null}
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}

export function PlayerFormFields({
  register,
  control,
  errors,
  setValue,
  groups,
  isGroupsLoading,
  inputClassName = "h-11 rounded-xl bg-background/40",
  step = "all",
  groupFieldHint,
}: PlayerFormFieldsProps) {
  const dateOfBirth = useWatch({ control, name: "dateOfBirth" });
  const hasMedicalCondition = useWatch({ control, name: "hasMedicalCondition" });
  const photoUrl = useWatch({ control, name: "photoUrl" });
  const signatureUrl = useWatch({ control, name: "signatureUrl" });

  const ageLabel = useMemo(() => {
    const age = calculateAgeFromDate(dateOfBirth);
    return age === null ? "-" : `${age} tahun`;
  }, [dateOfBirth]);

  const showStep = (targetStep: number) => step === "all" || step === targetStep;

  return (
    <>
      <div className={`space-y-5 ${showStep(1) ? "block" : "hidden"} ${step === 1 ? "animate-in fade-in-0 duration-base" : ""}`}>
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary/80">Data Pribadi</p>
          <p className="text-xs text-muted-foreground">Isi profil utama calon anggota sebelum lanjut ke kontak dan dokumen.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
          <div className="space-y-2">
            <label htmlFor="field-player-firstName" className="text-micro text-muted-foreground">
              Nama Depan <span className="text-destructive">*</span>
            </label>
            <Input id="field-player-firstName" {...register("firstName")} placeholder="Contoh: Dimas" className={inputClassName} />
            {errors.firstName && <p className="text-destructive text-xs">{errors.firstName.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="field-player-lastName" className="text-micro text-muted-foreground">
              Nama Belakang
            </label>
            <Input id="field-player-lastName" {...register("lastName")} placeholder="Contoh: Anggara" className={inputClassName} />
          </div>

          <div className="space-y-2">
            <label htmlFor="field-player-placeOfBirth" className="text-micro text-muted-foreground">
              Tempat Lahir
            </label>
            <Input id="field-player-placeOfBirth" {...register("placeOfBirth")} placeholder="Contoh: Depok" className={inputClassName} />
          </div>

          <div className="space-y-2">
            <label htmlFor="field-player-dateOfBirth" className="text-micro text-muted-foreground">
              Tanggal Lahir <span className="text-destructive">*</span>
            </label>
            <Input id="field-player-dateOfBirth" type="date" {...register("dateOfBirth")} className={`${inputClassName} w-full scheme-dark [&::-webkit-calendar-picker-indicator]:invert`} />
            {errors.dateOfBirth && <p className="text-destructive text-xs">{errors.dateOfBirth.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-micro text-muted-foreground">Umur</label>
            <Input value={ageLabel} readOnly className={`${inputClassName} text-muted-foreground`} />
          </div>

          <div className="space-y-2">
            <label htmlFor="field-player-groupId" className="text-micro text-muted-foreground">
              Kelompok Latihan <span className="text-destructive">*</span>
            </label>
            <Controller
              control={control}
              name="groupId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ""} disabled={isGroupsLoading}>
                  <SelectTrigger id="field-player-groupId" className={`w-full ${inputClassName}`}>
                    <SelectValue>
                      {groups?.find((g: Group) => g.id === field.value)?.name ||
                        (isGroupsLoading ? "Memuat..." : groups?.length ? "Pilih Kelompok" : "Belum ada kelompok")}
                    </SelectValue>
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
            {groupFieldHint ? <p className="text-[11px] text-muted-foreground">{groupFieldHint}</p> : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="field-player-gender" className="text-micro text-muted-foreground">
              Jenis Kelamin <span className="text-destructive">*</span>
            </label>
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <SelectTrigger id="field-player-gender" className={`w-full ${inputClassName}`}>
                    <SelectValue placeholder="Pilih Jenis Kelamin" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.gender && <p className="text-destructive text-xs">{errors.gender.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="field-player-religion" className="text-micro text-muted-foreground">
              Agama
            </label>
            <Input id="field-player-religion" {...register("religion")} placeholder="Contoh: Islam" className={inputClassName} />
          </div>

          <div className="space-y-2">
            <label htmlFor="field-player-weight" className="text-micro text-muted-foreground">
              Berat Badan
            </label>
            <Input id="field-player-weight" {...register("weight")} placeholder="Contoh: 28 kg" className={inputClassName} />
          </div>

          <div className="space-y-2">
            <label htmlFor="field-player-height" className="text-micro text-muted-foreground">
              Tinggi Badan
            </label>
            <Input id="field-player-height" {...register("height")} placeholder="Contoh: 125 cm" className={inputClassName} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="field-player-schoolOrigin" className="text-micro text-muted-foreground">
              Asal Sekolah <span className="text-destructive">*</span>
            </label>
            <Input id="field-player-schoolOrigin" {...register("schoolOrigin")} placeholder="Contoh: SDN Gandul 2" className={`w-full ${inputClassName}`} />
            {errors.schoolOrigin && <p className="text-destructive text-xs">{errors.schoolOrigin.message}</p>}
          </div>
        </div>
      </div>

      <div className={`space-y-5 ${showStep(2) ? "block" : "hidden"} ${step === 2 ? "animate-in slide-in-from-right-4 duration-base" : ""}`}>
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary/80">Kontak dan Alamat</p>
          <p className="text-xs text-muted-foreground">Alamat rumah utama wajib diisi. Detail tambahan dan alamat KTP/KK bisa dilengkapi bila perlu.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="field-player-addressLine1" className="text-micro text-muted-foreground">
              Alamat Rumah <span className="text-destructive">*</span>
            </label>
            <Input id="field-player-addressLine1" {...register("addressLine1")} placeholder="Jalan, nomor rumah, RT/RW" className={inputClassName} />
            {errors.addressLine1 && <p className="text-destructive text-xs">{errors.addressLine1.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="field-player-addressLine2" className="text-micro text-muted-foreground">
              Detail Alamat Tambahan
            </label>
            <Input id="field-player-addressLine2" {...register("addressLine2")} placeholder="Patokan, blok, atau catatan tambahan (opsional)" className={inputClassName} />
            <p className="text-[11px] text-muted-foreground">Opsional. Boleh dikosongkan jika tidak ada.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="field-player-city" className="text-micro text-muted-foreground">
              Kota <span className="text-destructive">*</span>
            </label>
            <Input id="field-player-city" {...register("city")} placeholder="Contoh: Depok" className={inputClassName} />
            {errors.city && <p className="text-destructive text-xs">{errors.city.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="field-player-province" className="text-micro text-muted-foreground">
              Provinsi <span className="text-destructive">*</span>
            </label>
            <Input id="field-player-province" {...register("province")} placeholder="Contoh: Jawa Barat" className={inputClassName} />
            {errors.province && <p className="text-destructive text-xs">{errors.province.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="field-player-postalCode" className="text-micro text-muted-foreground">
              Kode Pos <span className="text-destructive">*</span>
            </label>
            <Input id="field-player-postalCode" {...register("postalCode")} placeholder="Contoh: 16514" className={inputClassName} />
            {errors.postalCode && <p className="text-destructive text-xs">{errors.postalCode.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="field-player-ktpAddress" className="text-micro text-muted-foreground">
              Alamat Sesuai KTP/KK
            </label>
            <Textarea id="field-player-ktpAddress" {...register("ktpAddress")} placeholder="Isi jika berbeda dengan alamat domisili saat ini" className="min-h-22 resize-none bg-background/40" />
          </div>

          <div className="space-y-2">
            <label htmlFor="field-player-phoneNumber" className="text-micro text-muted-foreground">
              Nomor Telepon <span className="text-destructive">*</span>
            </label>
            <Input id="field-player-phoneNumber" type="tel" {...register("phoneNumber")} placeholder="Boleh nomor pemain atau orang tua" className={inputClassName} />
            {errors.phoneNumber && <p className="text-destructive text-xs">{errors.phoneNumber.message}</p>}
            <p className="text-[11px] text-muted-foreground">Jika anak belum punya nomor sendiri, isi dengan nomor orang tua.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="field-player-email" className="text-micro text-muted-foreground">
              Email
            </label>
            <Input id="field-player-email" type="email" {...register("email")} placeholder="Contoh: nama@email.com" className={inputClassName} />
            {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="field-player-instagram" className="text-micro text-muted-foreground">
              Akun Instagram
            </label>
            <Input id="field-player-instagram" {...register("instagram")} placeholder="Contoh: @adora_player" className={inputClassName} />
          </div>

          <div className="space-y-2">
            <label htmlFor="field-player-parentName" className="text-micro text-muted-foreground">
              Nama Orang Tua
            </label>
            <Input id="field-player-parentName" {...register("parentName")} placeholder="Contoh: Ibu Suryani" className={inputClassName} />
          </div>

          <div className="space-y-2">
            <label htmlFor="field-player-parentPhoneNumber" className="text-micro text-muted-foreground">
              Nomor Telepon Orang Tua
            </label>
            <Input id="field-player-parentPhoneNumber" type="tel" {...register("parentPhoneNumber")} placeholder="Contoh: 081234567890" className={inputClassName} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="field-player-parentAddress" className="text-micro text-muted-foreground">
              Alamat Orang Tua
            </label>
            <Textarea id="field-player-parentAddress" {...register("parentAddress")} placeholder="Alamat orang tua/wali" className="min-h-22 resize-none bg-background/40" />
          </div>
        </div>
      </div>

      <div className={`space-y-5 ${showStep(3) ? "block" : "hidden"} ${step === 3 ? "animate-in slide-in-from-right-4 duration-base" : ""}`}>
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary/80">Data Pendukung dan Medis</p>
          <p className="text-xs text-muted-foreground">Lengkapi riwayat kesehatan dan unggah dokumen pendukung sebelum menyimpan data pemain.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
          <div className="space-y-2">
            <label className="text-micro text-muted-foreground">
              Riwayat Penyakit Bawaan
            </label>
            <Controller
              control={control}
              name="hasMedicalCondition"
              render={({ field }) => (
                <Select
                  onValueChange={(value) => {
                    const boolValue = value === "YA";
                    field.onChange(boolValue);
                    if (!boolValue) {
                      setValue("medicalConditionDetail", "", { shouldDirty: true, shouldValidate: true });
                    }
                  }}
                  value={field.value ? "YA" : "TIDAK"}
                >
                  <SelectTrigger className={`w-full ${inputClassName}`}>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="TIDAK">Tidak</SelectItem>
                    <SelectItem value="YA">Ya</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="field-player-medicalConditionDetail" className="text-micro text-muted-foreground">
              Jenis Penyakit
            </label>
            <Textarea
              id="field-player-medicalConditionDetail"
              {...register("medicalConditionDetail")}
              disabled={!hasMedicalCondition}
              placeholder={hasMedicalCondition ? "Contoh: Asma ringan" : "Aktif jika memilih Ya"}
              className="min-h-22 resize-none bg-background/40 disabled:opacity-60"
            />
            {errors.medicalConditionDetail && <p className="text-destructive text-xs">{errors.medicalConditionDetail.message}</p>}
          </div>

          <UploadField
            label="Pas Foto"
            value={photoUrl}
            assetKey="player_photo"
            onUploaded={(url) => setValue("photoUrl", url, { shouldDirty: true, shouldValidate: true })}
            error={errors.photoUrl?.message}
          />

          <UploadField
            label="Tanda Tangan Elektronik"
            value={signatureUrl}
            assetKey="player_signature"
            onUploaded={(url) => setValue("signatureUrl", url, { shouldDirty: true, shouldValidate: true })}
            error={errors.signatureUrl?.message}
          />
        </div>
      </div>
    </>
  );
}
