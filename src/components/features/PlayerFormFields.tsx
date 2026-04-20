"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import type { PlayerFormValues } from "@/lib/validation/player";
import type { Group } from "@/hooks/use-groups";

interface PlayerFormFieldsProps {
  register: UseFormRegister<PlayerFormValues>;
  control: Control<PlayerFormValues>;
  errors: FieldErrors<PlayerFormValues>;
  groups: Group[] | undefined;
  isGroupsLoading?: boolean;
  inputClassName?: string;
  step?: number;
}

export function PlayerFormFields({
  register,
  control,
  errors,
  groups,
  isGroupsLoading,
  inputClassName = "h-11 rounded-xl bg-background/40",
  step = 1,
}: PlayerFormFieldsProps) {
  return (
    <>
      {/* STEP 1: Data Diri Dasar & Fisik */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5 ${step === 1 ? "block animate-in fade-in-0 duration-base" : "hidden"}`}>
        <div className="space-y-2 md:col-span-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            Nama Lengkap <span className="text-destructive">*</span>
          </label>
          <Input {...register("name")} placeholder="Contoh: Dimas Anggara" className={inputClassName} />
          {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            Tanggal Lahir <span className="text-destructive">*</span>
          </label>
          <Input type="date" {...register("dateOfBirth")} className={`${inputClassName} w-full scheme-dark [&::-webkit-calendar-picker-indicator]:invert`} />
          {errors.dateOfBirth && <p className="text-destructive text-xs">{errors.dateOfBirth.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            Kelompok <span className="text-destructive">*</span>
          </label>
          <Controller
            control={control}
            name="groupId"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isGroupsLoading}>
                <SelectTrigger className={`w-full ${inputClassName}`}>
                  <SelectValue>
                    {groups?.find((g: Group) => g.id === field.value)?.name || 
                     (isGroupsLoading ? "Memuat..." : 
                      (groups && groups.length === 0 ? "Belum ada kelompok" : "Pilih Kelompok"))}
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
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            Tempat Lahir <span className="text-muted-foreground/50 font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Input {...register("placeOfBirth")} placeholder="Contoh: Depok" className={`w-full ${inputClassName}`} />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            Jenis Kelamin <span className="text-muted-foreground/50 font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <SelectTrigger className={`w-full ${inputClassName}`}>
                  <SelectValue placeholder="Pilih Jenis Kelamin" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                  <SelectItem value="Perempuan">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            Berat Badan <span className="text-muted-foreground/50 font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Input {...register("weight")} placeholder="Contoh: 28 Kg" className={inputClassName} />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            Tinggi Badan <span className="text-muted-foreground/50 font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Input {...register("height")} placeholder="Contoh: 125 CM" className={inputClassName} />
        </div>
      </div>

      {/* STEP 2: Kontak, Edukasi, Orang Tua, dan Medis */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5 ${step === 2 ? "block animate-in slide-in-from-right-4 duration-base" : "hidden"}`}>
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            Asal Sekolah <span className="text-muted-foreground/50 font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Input {...register("schoolOrigin")} placeholder="Contoh: SDN Gandul 2" className={`w-full ${inputClassName}`} />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            Riwayat Penyakit Bawaan <span className="text-muted-foreground/50 font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Input {...register("medicalHistory")} placeholder="Contoh: Asma" className={`w-full ${inputClassName}`} />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            Email Peserta <span className="text-muted-foreground/50 font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Input type="email" {...register("email")} placeholder="Contoh: nama@email.com" className={`w-full ${inputClassName}`} />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            No. Telepon <span className="text-muted-foreground/50 font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Input type="tel" {...register("phoneNumber")} placeholder="Contoh: +6281234567890" className={`w-full ${inputClassName}`} />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            Nama Orang Tua <span className="text-muted-foreground/50 font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Input {...register("parentName")} placeholder="Contoh: Ibu Suryani" className={`w-full ${inputClassName}`} />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            No. Telp. Orang Tua <span className="text-muted-foreground/50 font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Input type="tel" {...register("parentPhoneNumber")} placeholder="Contoh: +628129999999" className={`w-full ${inputClassName}`} />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            Alamat Rumah <span className="text-muted-foreground/50 font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Input {...register("address")} placeholder="Contoh: Jl. Melati No. 10" className={`w-full ${inputClassName}`} />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            Alamat Orang Tua <span className="text-muted-foreground/50 font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Input {...register("parentAddress")} placeholder="Contoh: Gandul, Cinere" className={`w-full ${inputClassName}`} />
        </div>
      </div>
    </>
  );
}
