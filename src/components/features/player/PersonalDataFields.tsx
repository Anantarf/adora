"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Controller, useWatch, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import type { PlayerFormValues } from "@/lib/validation/player";
import type { Group } from "@/hooks/use-groups";
import { calculateAgeFromDate } from "@/lib/player-profile";

interface PersonalDataFieldsProps {
  register: UseFormRegister<PlayerFormValues>;
  control: Control<PlayerFormValues>;
  errors: FieldErrors<PlayerFormValues>;
  groups: Group[] | undefined;
  isGroupsLoading?: boolean;
  inputClassName?: string;
  groupFieldHint?: string;
}

const RELIGION_OPTIONS = [
  "Islam",
  "Kristen Protestan",
  "Katolik",
  "Hindu",
  "Buddha",
  "Khonghucu",
  "Lainnya",
] as const;

const GENDER_OPTIONS = ["Laki-laki", "Perempuan"] as const;

export function PersonalDataFields({
  register,
  control,
  errors,
  groups,
  isGroupsLoading,
  inputClassName = "h-11 rounded-xl bg-background/40",
  groupFieldHint,
}: PersonalDataFieldsProps) {
  const dateOfBirth = useWatch({ control, name: "dateOfBirth" });

  const ageLabel = useMemo(() => {
    const age = calculateAgeFromDate(dateOfBirth);
    return age === null ? "-" : `${age} tahun`;
  }, [dateOfBirth]);

  return (
    <>
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary/80">Data Pribadi</p>
        <p className="text-xs text-muted-foreground">
          Isi profil utama calon anggota sebelum lanjut ke kontak dan dokumen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
        {/* Nama Depan */}
        <div className="space-y-2">
          <label htmlFor="field-player-firstName" className="text-micro text-muted-foreground">
            Nama Depan <span className="text-destructive">*</span>
          </label>
          <Input
            id="field-player-firstName"
            {...register("firstName")}
            placeholder="Contoh: Dimas"
            className={inputClassName}
          />
          {errors.firstName && (
            <p className="text-destructive text-xs">{errors.firstName.message}</p>
          )}
        </div>

        {/* Nama Belakang */}
        <div className="space-y-2">
          <label htmlFor="field-player-lastName" className="text-micro text-muted-foreground">
            Nama Belakang
          </label>
          <Input
            id="field-player-lastName"
            {...register("lastName")}
            placeholder="Contoh: Anggara"
            className={inputClassName}
          />
        </div>

        {/* Tempat Lahir */}
        <div className="space-y-2">
          <label htmlFor="field-player-placeOfBirth" className="text-micro text-muted-foreground">
            Tempat Lahir
          </label>
          <Input
            id="field-player-placeOfBirth"
            {...register("placeOfBirth")}
            placeholder="Contoh: Depok"
            className={inputClassName}
          />
        </div>

        {/* Tanggal Lahir */}
        <div className="space-y-2">
          <label htmlFor="field-player-dateOfBirth" className="text-micro text-muted-foreground">
            Tanggal Lahir <span className="text-destructive">*</span>
          </label>
          <Input
            id="field-player-dateOfBirth"
            type="date"
            {...register("dateOfBirth")}
            className={`${inputClassName} w-full scheme-dark [&::-webkit-calendar-picker-indicator]:invert`}
          />
          {errors.dateOfBirth && (
            <p className="text-destructive text-xs">{errors.dateOfBirth.message}</p>
          )}
        </div>

        {/* Umur (read-only) */}
        <div className="space-y-2">
          <label className="text-micro text-muted-foreground">Umur</label>
          <Input
            value={ageLabel}
            readOnly
            className={`${inputClassName} text-muted-foreground`}
          />
        </div>

        {/* Kelompok Latihan */}
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
                      (isGroupsLoading
                        ? "Memuat..."
                        : groups?.length
                          ? "Pilih Kelompok"
                          : "Belum ada kelompok")}
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
          {errors.groupId && (
            <p className="text-destructive text-xs">{errors.groupId.message}</p>
          )}
          {groupFieldHint ? (
            <p className="text-[11px] text-muted-foreground">{groupFieldHint}</p>
          ) : null}
        </div>

        {/* Jenis Kelamin */}
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
                  {GENDER_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.gender && (
            <p className="text-destructive text-xs">{errors.gender.message}</p>
          )}
        </div>

        {/* Agama */}
        <div className="space-y-2">
          <label htmlFor="field-player-religion" className="text-micro text-muted-foreground">
            Agama
          </label>
          <Controller
            control={control}
            name="religion"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <SelectTrigger id="field-player-religion" className={`w-full ${inputClassName}`}>
                  <SelectValue placeholder="Pilih Agama" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {RELIGION_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Berat Badan */}
        <div className="space-y-2">
          <label htmlFor="field-player-weight" className="text-micro text-muted-foreground">
            Berat Badan
          </label>
          <div className="relative">
            <Input
              id="field-player-weight"
              {...register("weight")}
              placeholder="Contoh: 28"
              className={`${inputClassName} pr-10`}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs font-bold text-muted-foreground/70">
              kg
            </div>
          </div>
        </div>

        {/* Tinggi Badan */}
        <div className="space-y-2">
          <label htmlFor="field-player-height" className="text-micro text-muted-foreground">
            Tinggi Badan
          </label>
          <div className="relative">
            <Input
              id="field-player-height"
              {...register("height")}
              placeholder="Contoh: 125"
              className={`${inputClassName} pr-10`}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs font-bold text-muted-foreground/70">
              cm
            </div>
          </div>
        </div>

        {/* Asal Sekolah */}
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="field-player-schoolOrigin" className="text-micro text-muted-foreground">
            Asal Sekolah <span className="text-destructive">*</span>
          </label>
          <Input
            id="field-player-schoolOrigin"
            {...register("schoolOrigin")}
            placeholder="Contoh: SDN Gandul 2"
            className={`w-full ${inputClassName}`}
          />
          {errors.schoolOrigin && (
            <p className="text-destructive text-xs">{errors.schoolOrigin.message}</p>
          )}
        </div>
      </div>
    </>
  );
}
