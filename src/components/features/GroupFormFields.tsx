"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";

const HOMEBASE_NONE = "__none__";

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
  isKu: boolean;
  setIsKu: (v: boolean) => void;
  targetKu: string;
  setTargetKu: (v: string) => void;
  isSchool: boolean;
  setIsSchool: (v: boolean) => void;
  schoolLevel: string;
  setSchoolLevel: (v: string) => void;
  homebases: { id: string; name: string }[];
  checkboxIdSuffix?: string;
}

export function GroupFormFields({
  register,
  errors,
  watch,
  setValue,
  isKu,
  setIsKu,
  targetKu,
  setTargetKu,
  isSchool,
  setIsSchool,
  schoolLevel,
  setSchoolLevel,
  homebases,
  checkboxIdSuffix = "",
}: GroupFormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <label htmlFor={`group_name${checkboxIdSuffix}`} className="text-xs font-semibold text-muted-foreground cursor-pointer">
          Nama Kelompok
        </label>
        <p className="text-[10px] text-muted-foreground/60">Bisa berdasarkan usia atau asal sekolah</p>
        <Input id={`group_name${checkboxIdSuffix}`} {...register("name")} placeholder="Contoh: KU-16 Putra" className="h-11" />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>

      <div className="space-y-4 pt-2 pb-2 border-t border-border/30">
        <div className="flex flex-wrap items-center gap-3 pt-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`isUsia${checkboxIdSuffix}`}
              checked={isKu}
              onChange={(e) => {
                setIsKu(e.target.checked);
                if (e.target.checked) setIsSchool(false);
              }}
              className="size-4 cursor-pointer rounded accent-primary bg-background border-border"
            />
            <label htmlFor={`isUsia${checkboxIdSuffix}`} className="text-xs font-semibold text-muted-foreground cursor-pointer whitespace-nowrap">
              Kelompok Umur
            </label>
          </div>

          {isKu && (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
              <Input
                type="text"
                pattern="\d*"
                maxLength={2}
                value={targetKu}
                onChange={(e) => setTargetKu(e.target.value.replace(/\D/g, ""))}
                placeholder="16"
                className="h-9 w-12 text-center text-sm font-medium"
              />
              <span className="text-xs font-semibold text-muted-foreground">Tahun</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`isSekolah${checkboxIdSuffix}`}
              checked={isSchool}
              onChange={(e) => {
                setIsSchool(e.target.checked);
                if (e.target.checked) setIsKu(false);
              }}
              className="size-4 cursor-pointer rounded accent-primary bg-background border-border"
            />
            <label htmlFor={`isSekolah${checkboxIdSuffix}`} className="text-xs font-semibold text-muted-foreground cursor-pointer whitespace-nowrap">
              Sekolah
            </label>
          </div>

          {isSchool && (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <Select value={schoolLevel} onValueChange={(val: string | null) => setSchoolLevel(val || "")}>
                <SelectTrigger className="h-9 w-full sm:w-48 font-medium">
                  <SelectValue placeholder="Pilih Tingkat Sekolah" />
                </SelectTrigger>
                <SelectContent>
                  {SCHOOL_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {homebases.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Lokasi Latihan <span className="text-muted-foreground/50 font-normal">(Opsional)</span>
          </label>
          <Select
            value={watch("homebaseId") ?? HOMEBASE_NONE}
            onValueChange={(val) => setValue("homebaseId", !val || val === HOMEBASE_NONE ? undefined : val)}
          >
            <SelectTrigger className="h-11 font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={HOMEBASE_NONE} className="text-muted-foreground">
                — Tanpa Lokasi Latihan —
              </SelectItem>
              {homebases.map((hb) => (
                <SelectItem key={hb.id} value={hb.id}>{hb.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
}
