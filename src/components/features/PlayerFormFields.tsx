"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Controller, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue, type UseFormGetValues } from "react-hook-form";
import type { PlayerFormValues } from "@/lib/validation/player";
import type { Group } from "@/hooks/use-groups";

type ParentAccount = { id: string; username: string | null; name: string | null };

const NO_PARENT = "_none_";

interface PlayerFormFieldsProps {
  register: UseFormRegister<PlayerFormValues>;
  control: Control<PlayerFormValues>;
  errors: FieldErrors<PlayerFormValues>;
  setValue: UseFormSetValue<PlayerFormValues>;
  getValues: UseFormGetValues<PlayerFormValues>;
  groups: Group[] | undefined;
  isGroupsLoading?: boolean;
  inputClassName?: string;
  step?: number;
  parentAccounts?: ParentAccount[];
  isParentAccountsLoading?: boolean;
}

export function PlayerFormFields({
  register,
  control,
  errors,
  setValue,
  getValues,
  groups,
  isGroupsLoading,
  inputClassName = "h-11 rounded-xl bg-background/40",
  step = 1,
  parentAccounts,
  isParentAccountsLoading,
}: PlayerFormFieldsProps) {
  const lastAutoFilledRef = useRef("");

  const handleParentChange = (newId: string | null) => {
    const resolved = !newId || newId === NO_PARENT ? "" : newId;
    setValue("parentId", resolved);
    if (!resolved) {
      lastAutoFilledRef.current = "";
      return;
    }
    const selected = parentAccounts?.find((a) => a.id === resolved);
    if (!selected) return;
    const autoName = selected.name ?? selected.username ?? "";
    const currentParentName = getValues("parentName") ?? "";
    if (!currentParentName || currentParentName === lastAutoFilledRef.current) {
      setValue("parentName", autoName);
      lastAutoFilledRef.current = autoName;
    }
  };

  return (
    <>
      {/* STEP 1: Data Diri Dasar & Fisik */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5 ${step === 1 ? "block animate-in fade-in-0 duration-base" : "hidden"}`}>
        <div className="space-y-2 md:col-span-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            Nama Lengkap <span className="text-destructive">*</span>
          </label>
          <Input 
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
          {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            No. Telepon <span className="text-muted-foreground/50 font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Input 
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

        <div className="space-y-2 md:col-span-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            Akun Orang Tua <span className="text-muted-foreground/50 font-normal normal-case tracking-normal">(Opsional)</span>
          </label>
          <Controller
            control={control}
            name="parentId"
            render={({ field }) => (
              <Select
                onValueChange={handleParentChange}
                value={field.value || NO_PARENT}
                disabled={isParentAccountsLoading}
              >
                <SelectTrigger className={`w-full ${inputClassName}`}>
                  <SelectValue>
                    {field.value
                      ? (parentAccounts?.find((a) => a.id === field.value)?.username ?? "Akun tidak ditemukan")
                      : "Tidak Ada / Tidak Terhubung"}

                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={NO_PARENT}>Tidak Ada / Tidak Terhubung</SelectItem>
                  {parentAccounts?.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id} className="font-medium text-sm">
                      {acc.username ?? acc.id}{acc.name ? ` — ${acc.name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
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
          <Input 
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
