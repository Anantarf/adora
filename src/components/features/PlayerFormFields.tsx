"use client";

import { type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from "react-hook-form";

import type { Group } from "@/hooks/use-groups";
import { ContactAddressFields } from "@/components/features/player/ContactAddressFields";
import { MedicalDocsFields } from "@/components/features/player/MedicalDocsFields";
import { PersonalDataFields } from "@/components/features/player/PersonalDataFields";
import type { PlayerFormValues } from "@/lib/validation/player";

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
    target === 1
      ? "animate-in fade-in-0 duration-base"
      : "animate-in slide-in-from-right-4 duration-base";

  return (
    <>
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
