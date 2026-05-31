"use client";

import { Textarea } from "@/components/ui/textarea";
import { Controller, useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import type { PlayerFormValues } from "@/lib/validation/player";
import { cn } from "@/lib/utils";
import { UploadField } from "@/components/features/player/UploadField";

interface MedicalDocsFieldsProps {
  register: UseFormRegister<PlayerFormValues>;
  control: Control<PlayerFormValues>;
  errors: FieldErrors<PlayerFormValues>;
  setValue: UseFormSetValue<PlayerFormValues>;
}

export function MedicalDocsFields({
  register,
  control,
  errors,
  setValue,
}: MedicalDocsFieldsProps) {
  const hasMedicalCondition = useWatch({ control, name: "hasMedicalCondition" });
  const photoUrl = useWatch({ control, name: "photoUrl" });
  const signatureUrl = useWatch({ control, name: "signatureUrl" });

  return (
    <>
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary/80">
          Data Pendukung dan Medis
        </p>
        <p className="text-xs text-muted-foreground">
          Lengkapi riwayat kesehatan dan unggah dokumen pendukung sebelum menyimpan data pemain.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
        {/* Toggle Riwayat Penyakit Bawaan */}
        <div className="space-y-2">
          <label className="text-micro text-muted-foreground">Riwayat Penyakit Bawaan</label>
          <Controller
            control={control}
            name="hasMedicalCondition"
            render={({ field }) => (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    field.onChange(false);
                    setValue("medicalConditionDetail", "", { shouldDirty: true, shouldValidate: true });
                  }}
                  className={cn(
                    "flex-1 h-11 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all",
                    !field.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border/50 bg-background/20 text-muted-foreground hover:border-border",
                  )}
                >
                  Tidak
                </button>
                <button
                  type="button"
                  onClick={() => field.onChange(true)}
                  className={cn(
                    "flex-1 h-11 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all",
                    field.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border/50 bg-background/20 text-muted-foreground hover:border-border",
                  )}
                >
                  Ya
                </button>
              </div>
            )}
          />
        </div>

        {/* Detail Jenis Penyakit */}
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="field-player-medicalConditionDetail" className="text-micro text-muted-foreground">
            Jenis Penyakit
          </label>
          <Textarea
            id="field-player-medicalConditionDetail"
            {...register("medicalConditionDetail")}
            disabled={!hasMedicalCondition}
            placeholder={hasMedicalCondition ? "Contoh: Asma ringan" : "Aktif jika memilih Ya"}
            className="min-h-22 rounded-xl resize-none bg-background/40 disabled:opacity-60"
          />
          {errors.medicalConditionDetail && (
            <p className="text-destructive text-xs">{errors.medicalConditionDetail.message}</p>
          )}
        </div>

        {/* Upload Pas Foto */}
        <UploadField
          label="Pas Foto"
          value={photoUrl}
          assetKey="player_photo"
          onUploaded={(url) => setValue("photoUrl", url, { shouldDirty: true, shouldValidate: true })}
          error={errors.photoUrl?.message}
        />

        {/* Upload Tanda Tangan Elektronik */}
        <UploadField
          label="Tanda Tangan Elektronik"
          value={signatureUrl}
          assetKey="player_signature"
          onUploaded={(url) => setValue("signatureUrl", url, { shouldDirty: true, shouldValidate: true })}
          error={errors.signatureUrl?.message}
        />
      </div>
    </>
  );
}
