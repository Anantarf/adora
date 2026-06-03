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
  inputClassName = "h-11 rounded-xl bg-background/55 hover:bg-background/75 focus:bg-background border border-border/50 focus:border-primary/80 focus:ring-4 focus:ring-primary/10 transition-all",
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
        <p className="text-sm font-semibold text-foreground">Data Pribadi</p>
        <p className="text-xs text-muted-foreground">
          Isi profil utama calon anggota sebelum lanjut ke kontak dan dokumen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
        {/* Nama Depan */}
        <div className="space-y-2">
          <label htmlFor="field-player-firstName" className="text-xs font-semibold text-muted-foreground/90 tracking-wide">
            Nama Depan <span className="text-primary font-bold">*</span>
          </label>
          <Input
            id="field-player-firstName"
            {...register("firstName")}
            placeholder="Contoh: Dimas"
            className={inputClassName}
          />
          {errors.firstName && (
            <p className="text-destructive text-xs animate-in fade-in-50 slide-in-from-top-1 duration-200">{errors.firstName.message}</p>
          )}
        </div>

        {/* Nama Belakang */}
        <div className="space-y-2">
          <label htmlFor="field-player-lastName" className="text-xs font-semibold text-muted-foreground/90 tracking-wide">
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
          <label htmlFor="field-player-placeOfBirth" className="text-xs font-semibold text-muted-foreground/90 tracking-wide">
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
          <label htmlFor="field-player-dateOfBirth" className="text-xs font-semibold text-muted-foreground/90 tracking-wide">
            Tanggal Lahir <span className="text-primary font-bold">*</span>
          </label>
          <Input
            id="field-player-dateOfBirth"
            {...register("dateOfBirth")}
            inputMode="numeric"
            placeholder="dd/mm/yyyy"
            className={`${inputClassName} w-full tracking-wide`}
          />
          <p className="text-[11px] text-muted-foreground/80">Gunakan format hari/bulan/tahun, misalnya 17/08/2012.</p>
          {errors.dateOfBirth && (
            <p className="text-destructive text-xs animate-in fade-in-50 slide-in-from-top-1 duration-200">{errors.dateOfBirth.message}</p>
          )}
        </div>

        {/* Umur (read-only) — dipasangkan sejajar Tanggal Lahir */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground/90 tracking-wide">Umur</label>
          <div className="h-11 rounded-xl border border-dashed border-border/80 bg-muted/15 flex items-center px-4 transition-colors select-none">
            <span className="text-sm font-semibold text-primary/95">{ageLabel}</span>
          </div>
        </div>

        {/* Kelompok Latihan */}
        <div className="space-y-2">
          <label htmlFor="field-player-groupId" className="text-xs font-semibold text-muted-foreground/90 tracking-wide">
            Kelompok Latihan <span className="text-primary font-bold">*</span>
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
            <p className="text-destructive text-xs animate-in fade-in-50 slide-in-from-top-1 duration-200">{errors.groupId.message}</p>
          )}
          {groupFieldHint ? (
            <div className="flex items-start gap-1.5 rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-[11px] text-muted-foreground mt-1 leading-normal transition-all duration-300">
              <svg className="size-3.5 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{groupFieldHint}</span>
            </div>
          ) : null}
        </div>

        {/* Jenis Kelamin */}
        <div className="space-y-2">
          <label htmlFor="field-player-gender" className="text-xs font-semibold text-muted-foreground/90 tracking-wide">
            Jenis Kelamin <span className="text-primary font-bold">*</span>
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
            <p className="text-destructive text-xs animate-in fade-in-50 slide-in-from-top-1 duration-200">{errors.gender.message}</p>
          )}
        </div>

        {/* Agama */}
        <div className="space-y-2">
          <label htmlFor="field-player-religion" className="text-xs font-semibold text-muted-foreground/90 tracking-wide">
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
          <label htmlFor="field-player-weight" className="text-xs font-semibold text-muted-foreground/90 tracking-wide">
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
          <label htmlFor="field-player-height" className="text-xs font-semibold text-muted-foreground/90 tracking-wide">
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
          <label htmlFor="field-player-schoolOrigin" className="text-xs font-semibold text-muted-foreground/90 tracking-wide">
            Asal Sekolah <span className="text-primary font-bold">*</span>
          </label>
          <Input
            id="field-player-schoolOrigin"
            {...register("schoolOrigin")}
            placeholder="Contoh: SDN Gandul 2"
            className={`w-full ${inputClassName}`}
          />
          {errors.schoolOrigin && (
            <p className="text-destructive text-xs animate-in fade-in-50 slide-in-from-top-1 duration-200">{errors.schoolOrigin.message}</p>
          )}
        </div>
      </div>
    </>
  );
}
