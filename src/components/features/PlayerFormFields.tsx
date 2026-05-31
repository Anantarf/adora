"use client";

import { type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import type { PlayerFormValues } from "@/lib/validation/player";
import type { Group } from "@/hooks/use-groups";
import { PersonalDataFields } from "@/components/features/player/PersonalDataFields";
import { ContactAddressFields } from "@/components/features/player/ContactAddressFields";
import { MedicalDocsFields } from "@/components/features/player/MedicalDocsFields";

interface PlayerFormFieldsProps {
  register: UseFormRegister<PlayerFormValues>;
  control: Control<PlayerFormValues>;
  errors: FieldErrors<PlayerFormValues>;
  setValue: UseFormSetValue<PlayerFormValues>;
  groups: Group[] | undefined;
  isGroupsLoading?: boolean;
  /** Kelas CSS tambahan untuk elemen Input (default: "h-11 rounded-xl bg-background/40"). */
  inputClassName?: string;
  /** Tampilkan semua langkah sekaligus atau hanya langkah tertentu (1, 2, 3). */
  step?: number | "all";
  /** Teks petunjuk tambahan di bawah dropdown Kelompok Latihan. */
  groupFieldHint?: string;
}

/**
 * PlayerFormFields — Orchestrator multi-step formulir data pemain.
 *
 * Setiap langkah formulir dikelola oleh sub-komponen terpisah:
 *  - Langkah 1: PersonalDataFields  (nama, tgl lahir, kelompok, gender, dll.)
 *  - Langkah 2: ContactAddressFields (alamat domisili, kontak, orang tua, KTP)
 *  - Langkah 3: MedicalDocsFields  (kondisi medis, pas foto, tanda tangan)
 */
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
  const showStep = (target: number) => step === "all" || step === target;

  const stepAnimation = (target: number) =>
    target === 1 ? "animate-in fade-in-0 duration-base" : "animate-in slide-in-from-right-4 duration-base";

  return (
    <>
      {/* Langkah 1: Data Pribadi */}
      <div
        className={`space-y-5 ${showStep(1) ? "block" : "hidden"} ${step === 1 ? stepAnimation(1) : ""}`}
      >
        <PersonalDataFields
          register={register}
          control={control}
          errors={errors}
          groups={groups}
          isGroupsLoading={isGroupsLoading}
          inputClassName={inputClassName}
          groupFieldHint={groupFieldHint}
        />
      </div>

      {/* Langkah 2: Kontak dan Alamat */}
      <div
        className={`space-y-5 ${showStep(2) ? "block" : "hidden"} ${step === 2 ? stepAnimation(2) : ""}`}
      >
        <ContactAddressFields
          register={register}
          control={control}
          errors={errors}
          setValue={setValue}
          inputClassName={inputClassName}
        />
      </div>

      {/* Langkah 3: Data Pendukung dan Medis */}
      <div
        className={`space-y-5 ${showStep(3) ? "block" : "hidden"} ${step === 3 ? stepAnimation(3) : ""}`}
      >
        <MedicalDocsFields
          register={register}
          control={control}
          errors={errors}
          setValue={setValue}
        />
      </div>
    </>
  );
}
