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
}

export function PlayerFormFields({
  register,
  control,
  errors,
  groups,
  isGroupsLoading,
  inputClassName = "h-11 rounded-xl bg-background/40",
}: PlayerFormFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">Nama Lengkap</label>
        <Input {...register("name")} placeholder="Contoh: Dimas Anggara" className={inputClassName} />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">Tanggal Lahir</label>
        <Input type="date" {...register("dateOfBirth")} className={`${inputClassName} scheme-dark [&::-webkit-calendar-picker-indicator]:invert`} />
        {errors.dateOfBirth && <p className="text-destructive text-xs">{errors.dateOfBirth.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">
          Tempat Lahir <span className="text-muted-foreground/50 font-normal">(Opsional)</span>
        </label>
        <Input {...register("placeOfBirth")} placeholder="Contoh: Depok" className={inputClassName} />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">
          Jenis Kelamin <span className="text-muted-foreground/50 font-normal">(Opsional)</span>
        </label>
        <Input {...register("gender")} placeholder="Contoh: Laki-laki" className={inputClassName} />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">
          Berat Badan <span className="text-muted-foreground/50 font-normal">(Opsional)</span>
        </label>
        <Input {...register("weight")} placeholder="Contoh: 28 Kg" className={inputClassName} />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">
          Tinggi Badan <span className="text-muted-foreground/50 font-normal">(Opsional)</span>
        </label>
        <Input {...register("height")} placeholder="Contoh: 125 CM" className={inputClassName} />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">
          Asal Sekolah <span className="text-muted-foreground/50 font-normal">(Opsional)</span>
        </label>
        <Input {...register("schoolOrigin")} placeholder="Contoh: SDN Gandul 2" className={inputClassName} />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">
          Email <span className="text-muted-foreground/50 font-normal">(Opsional)</span>
        </label>
        <Input type="email" {...register("email")} placeholder="Contoh: nama@email.com" className={inputClassName} />
      </div>

      <div className="space-y-2 md:col-span-2">
        <label className="text-xs font-semibold text-muted-foreground">
          Alamat Rumah <span className="text-muted-foreground/50 font-normal">(Opsional)</span>
        </label>
        <Input {...register("address")} placeholder="Contoh: Jl. Melati No. 10" className={inputClassName} />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">
          No. Telepon <span className="text-muted-foreground/50 font-normal">(Opsional)</span>
        </label>
        <Input type="tel" {...register("phoneNumber")} placeholder="Contoh: +6281234567890" className={inputClassName} />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">
          No. Telepon Orang Tua <span className="text-muted-foreground/50 font-normal">(Opsional)</span>
        </label>
        <Input type="tel" {...register("parentPhoneNumber")} placeholder="Contoh: +628129999999" className={inputClassName} />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">
          Nama Orang Tua <span className="text-muted-foreground/50 font-normal">(Opsional)</span>
        </label>
        <Input {...register("parentName")} placeholder="Contoh: Ibu Suryani" className={inputClassName} />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">
          Riwayat Penyakit Bawaan <span className="text-muted-foreground/50 font-normal">(Opsional)</span>
        </label>
        <Input {...register("medicalHistory")} placeholder="Contoh: Asma" className={inputClassName} />
      </div>

      <div className="space-y-2 md:col-span-2">
        <label className="text-xs font-semibold text-muted-foreground">
          Alamat Orang Tua <span className="text-muted-foreground/50 font-normal">(Opsional)</span>
        </label>
        <Input {...register("parentAddress")} placeholder="Contoh: Gandul, Cinere" className={inputClassName} />
      </div>

      <div className="space-y-2 md:col-span-2">
        <label className="text-xs font-semibold text-muted-foreground">Kelompok</label>
        <Controller
          control={control}
          name="groupId"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value || ""} disabled={isGroupsLoading}>
              <SelectTrigger className={inputClassName}>
                <SelectValue>
                  {groups?.find((g: Group) => g.id === field.value)?.name || (isGroupsLoading ? "Memuat..." : "Pilih Kelompok")}
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
    </div>
  );
}
