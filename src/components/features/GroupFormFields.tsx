"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import type { GroupCategory } from "@/lib/group-meta";

const SCHOOL_LEVELS = ["TK/RA", "SD/MI", "SMP/MTS", "SMA/MA"] as const;

interface GroupFormValues {
  name: string;
  description?: string;
  homebaseId?: string;
}

interface GroupFormFieldsProps {
  register: UseFormRegister<GroupFormValues>;
  errors: FieldErrors<GroupFormValues>;
  watch: UseFormWatch<GroupFormValues>;
  setValue: UseFormSetValue<GroupFormValues>;
  category: GroupCategory;
  setCategory: (v: GroupCategory) => void;
  targetKu: string;
  setTargetKu: (v: string) => void;
  schoolLevel: string;
  setSchoolLevel: (v: string) => void;
  homebases: { id: string; name: string }[];
  checkboxIdSuffix?: string;
  targetKuError?: string;
  schoolLevelError?: string;
}

export function GroupFormFields({
  register,
  errors,
  watch,
  setValue,
  category,
  setCategory,
  targetKu,
  setTargetKu,
  schoolLevel,
  setSchoolLevel,
  homebases,
  checkboxIdSuffix = "",
  targetKuError,
  schoolLevelError,
}: GroupFormFieldsProps) {
  const isKu = category === "KELOMPOK_UMUR";
  const isSchool = category === "SEKOLAH";

  return (
    <>
      <div className="space-y-2">
        <label htmlFor={`group_name${checkboxIdSuffix}`} className="text-micro text-muted-foreground">
          Nama Kelompok
        </label>
        <p className="text-[10px] text-muted-foreground/75">Contoh: KU-16 Putra, Tim SD Gandul</p>
        <Input id={`group_name${checkboxIdSuffix}`} {...register("name")} placeholder="Contoh: KU-16 Putra" className="h-11" />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>

      <div className="space-y-4 pt-2 pb-2 border-t border-border/30">
        <div className="space-y-2 pt-3">
          <label className="text-micro text-muted-foreground">Kategori Kelompok</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {([
              { value: "SEKOLAH", label: "Sekolah", desc: "Kelompok berdasarkan tingkat sekolah" },
              { value: "KELOMPOK_UMUR", label: "Kelompok Umur", desc: "Kelompok berdasarkan batas usia" },
            ] as const).map((option) => {
              const active = category === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCategory(option.value)}
                  className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                    active ? "border-primary bg-primary/8 text-foreground" : "border-border/50 bg-background/30 text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <span className="block text-xs font-bold uppercase tracking-widest">{option.label}</span>
                  <span className="mt-1 block text-[11px] leading-relaxed">{option.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {isKu && (
          <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
            <label htmlFor={`group_targetKu${checkboxIdSuffix}`} className="text-micro text-muted-foreground">
              Batas Umur <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center gap-2">
              <Input id={`group_targetKu${checkboxIdSuffix}`} type="text" pattern="\d*" maxLength={2} value={targetKu} onChange={(e) => setTargetKu(e.target.value.replace(/\D/g, ""))} placeholder="16" className="h-10 w-16 text-center text-sm font-medium" />
              <span className="text-xs font-semibold text-muted-foreground">Tahun</span>
            </div>
            {targetKuError ? <p className="text-destructive text-xs">{targetKuError}</p> : null}
          </div>
        )}

        {isSchool && (
          <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
            <label className="text-micro text-muted-foreground">
              Tingkat Sekolah <span className="text-destructive">*</span>
            </label>
            <Select value={schoolLevel} onValueChange={(val: string | null) => setSchoolLevel(val || "")}>
              <SelectTrigger className="h-10 w-full font-medium">
                <SelectValue placeholder="Pilih Tingkat Sekolah" />
              </SelectTrigger>
              <SelectContent>
                {SCHOOL_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {schoolLevelError ? <p className="text-destructive text-xs">{schoolLevelError}</p> : null}
          </div>
        )}
      </div>

      {homebases.length > 0 && (
        <div className="space-y-2">
          <label className="text-micro text-muted-foreground">
            Lokasi Latihan <span className="normal-case font-normal">(Opsional)</span>
          </label>
          <Select
            value={watch("homebaseId") === "__none__" ? "none" : watch("homebaseId") || "none"}
            onValueChange={(val) => {
              if (val === "none") {
                setValue("homebaseId", undefined, { shouldDirty: true });
              } else {
                setValue("homebaseId", val || undefined, { shouldDirty: true });
              }
            }}
          >
            <SelectTrigger className="h-11 font-semibold">
              <SelectValue placeholder="Tanpa Lokasi">
                {watch("homebaseId") && watch("homebaseId") !== "none" && watch("homebaseId") !== "__none__" ? homebases.find((hb) => hb.id === watch("homebaseId"))?.name || "Tanpa Lokasi" : "Tanpa Lokasi"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-muted-foreground">
                Tanpa Lokasi
              </SelectItem>
              {homebases.map((hb) => (
                <SelectItem key={hb.id} value={hb.id}>
                  {hb.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
}
