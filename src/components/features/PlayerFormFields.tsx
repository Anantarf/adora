"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Controller, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import type { PlayerFormValues } from "@/lib/validation/player";
import type { Group } from "@/hooks/use-groups";


interface PlayerFormFieldsProps {
  register: UseFormRegister<PlayerFormValues>;
  control: Control<PlayerFormValues>;
  errors: FieldErrors<PlayerFormValues>;
  setValue: UseFormSetValue<PlayerFormValues>;
  groups: Group[] | undefined;
  isGroupsLoading?: boolean;
  inputClassName?: string;
  step?: number;
}

export function PlayerFormFields({
  register,
  control,
  errors,
  setValue,
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
          <label htmlFor="field-player-name" className="text-micro text-muted-foreground">
            Nama Lengkap <span className="text-destructive">*</span>
          </label>
          <Input 
            id="field-player-name"
            {...register("name", {
              onChange: (e) => {
                const val = e.target.value.replace(/[^a-zA-Z\s.'-]/g, "");
                e.target.value = val;
                setValue("name", val, { shouldValidate: true, shouldDirty: true });
              }
            })} 
            placeholder="Contoh: Dimas Anggara" 
            className={inputClassName} 
          />
          {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="field-player-dateOfBirth" className="text-micro text-muted-foreground">
            Tanggal Lahir <span className="text-destructive">*</span>
          </label>
          <Input id="field-player-dateOfBirth" type="date" {...register("dateOfBirth")} className={`${inputClassName} w-full scheme-dark [&::-webkit-calendar-picker-indicator]:invert`} />
          {errors.dateOfBirth && <p className="text-destructive text-xs">{errors.dateOfBirth.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="field-player-groupId" className="text-micro text-muted-foreground">
            Kelompok <span className="text-destructive">*</span>
          </label>
          <Controller
            control={control}
            name="groupId"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isGroupsLoading}>
                <SelectTrigger id="field-player-groupId" className={`w-full ${inputClassName}`}>
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
          <label htmlFor="field-player-placeOfBirth" className="text-micro text-muted-foreground">
            Tempat Lahir <span className="text-muted-foreground font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Input id="field-player-placeOfBirth" {...register("placeOfBirth")} placeholder="Contoh: Depok" className={`w-full ${inputClassName}`} />
        </div>

        <div className="space-y-2">
          <label htmlFor="field-player-gender" className="text-micro text-muted-foreground">
            Jenis Kelamin <span className="text-muted-foreground font-normal normal-case tracking-normal">(Opsional)</span>
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
        </div>

        <div className="space-y-2">
          <label htmlFor="field-player-weight" className="text-micro text-muted-foreground">
            Berat Badan <span className="text-muted-foreground font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Input id="field-player-weight" {...register("weight")} placeholder="Contoh: 28 Kg" className={inputClassName} />
        </div>

        <div className="space-y-2">
          <label htmlFor="field-player-height" className="text-micro text-muted-foreground">
            Tinggi Badan <span className="text-muted-foreground font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Input id="field-player-height" {...register("height")} placeholder="Contoh: 125 CM" className={inputClassName} />
        </div>
      </div>

      {/* STEP 2: Kontak, Edukasi, Orang Tua, dan Medis */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5 ${step === 2 ? "block animate-in slide-in-from-right-4 duration-base" : "hidden"}`}>
        <div className="space-y-2">
          <label htmlFor="field-player-schoolOrigin" className="text-micro text-muted-foreground">
            Asal Sekolah <span className="text-muted-foreground font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Input id="field-player-schoolOrigin" {...register("schoolOrigin")} placeholder="Contoh: SDN Gandul 2" className={`w-full ${inputClassName}`} />
        </div>

        <div className="space-y-2">
          <label htmlFor="field-player-medicalHistory" className="text-micro text-muted-foreground">
            Riwayat Penyakit Bawaan <span className="text-muted-foreground font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Input id="field-player-medicalHistory" {...register("medicalHistory")} placeholder="Contoh: Asma" className={`w-full ${inputClassName}`} />
        </div>

        <div className="space-y-2">
          <label htmlFor="field-player-email" className="text-micro text-muted-foreground">
            Email Peserta <span className="text-muted-foreground font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Input id="field-player-email" type="email" {...register("email")} placeholder="Contoh: nama@email.com" className={`w-full ${inputClassName}`} />
          {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="field-player-phoneNumber" className="text-micro text-muted-foreground">
            No. Telepon <span className="text-muted-foreground font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Input 
            id="field-player-phoneNumber"
            type="tel" 
            {...register("phoneNumber", {
              onChange: (e) => {
                const val = e.target.value.replace(/[^0-9+]/g, "");
                e.target.value = val;
                setValue("phoneNumber", val, { shouldValidate: true, shouldDirty: true });
              }
            })} 
            placeholder="Contoh: +6281234567890" 
            className={`w-full ${inputClassName}`} 
          />
        </div>


        <div className="space-y-2">
          <label htmlFor="field-player-parentName" className="text-micro text-muted-foreground">
            Nama Orang Tua <span className="text-muted-foreground font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Input id="field-player-parentName" {...register("parentName")} placeholder="Contoh: Ibu Suryani" className={`w-full ${inputClassName}`} />
        </div>

        <div className="space-y-2">
          <label htmlFor="field-player-parentPhoneNumber" className="text-micro text-muted-foreground">
            No. Telp. Orang Tua <span className="text-muted-foreground font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Input 
            id="field-player-parentPhoneNumber"
            type="tel" 
            {...register("parentPhoneNumber", {
              onChange: (e) => {
                const val = e.target.value.replace(/[^0-9+]/g, "");
                e.target.value = val;
                setValue("parentPhoneNumber", val, { shouldValidate: true, shouldDirty: true });
              }
            })} 
            placeholder="Contoh: +628129999999" 
            className={`w-full ${inputClassName}`} 
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="field-player-address" className="text-micro text-muted-foreground">
            Alamat Rumah <span className="text-muted-foreground font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Input id="field-player-address" {...register("address")} placeholder="Contoh: Jl. Melati No. 10" className={`w-full ${inputClassName}`} />
        </div>

        <div className="space-y-2">
          <label htmlFor="field-player-parentAddress" className="text-micro text-muted-foreground">
            Alamat Orang Tua <span className="text-muted-foreground font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Input id="field-player-parentAddress" {...register("parentAddress")} placeholder="Contoh: Gandul, Cinere" className={`w-full ${inputClassName}`} />
        </div>
      </div>
    </>
  );
}
