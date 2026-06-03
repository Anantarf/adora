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
        <p className="text-sm font-semibold text-foreground">
          Data Pendukung dan Medis
        </p>
        <p className="text-xs text-muted-foreground">
          Lengkapi riwayat kesehatan dan unggah dokumen pendukung sebelum menyimpan data pemain.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
        {/* Toggle Riwayat Penyakit Bawaan */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground/90 tracking-wide">Riwayat Penyakit Bawaan</label>
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
                    "flex-1 h-11 rounded-xl border text-sm font-semibold transition-all duration-300",
                    !field.value
                      ? "border-primary bg-primary/10 text-foreground shadow-sm shadow-primary/5 scale-[1.02]"
                      : "border-border/60 bg-background/30 text-muted-foreground hover:border-border",
                  )}
                >
                  Tidak
                </button>
                <button
                  type="button"
                  onClick={() => field.onChange(true)}
                  className={cn(
                    "flex-1 h-11 rounded-xl border text-sm font-semibold transition-all duration-300",
                    field.value
                      ? "border-primary bg-primary/10 text-foreground shadow-sm shadow-primary/5 scale-[1.02]"
                      : "border-border/60 bg-background/30 text-muted-foreground hover:border-border",
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
          <label htmlFor="field-player-medicalConditionDetail" className="text-xs font-semibold text-muted-foreground/90 tracking-wide">
            Jenis Penyakit {hasMedicalCondition && <span className="text-primary font-bold">*</span>}
          </label>
          <Textarea
            id="field-player-medicalConditionDetail"
            {...register("medicalConditionDetail")}
            disabled={!hasMedicalCondition}
            placeholder={hasMedicalCondition ? "Contoh: Asma ringan" : "Aktif jika memilih Ya"}
            className="min-h-22 rounded-xl resize-none border border-border/50 bg-background/55 hover:bg-background/75 focus:bg-background focus:border-primary/80 focus:ring-4 focus:ring-primary/10 transition-all p-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-muted/10"
          />
          {errors.medicalConditionDetail && (
            <p className="text-destructive text-xs animate-in fade-in-50 slide-in-from-top-1 duration-200">{errors.medicalConditionDetail.message}</p>
          )}
        </div>

        {/* Upload Pas Foto */}
        <UploadField
          label="Pas Foto"
          value={photoUrl}
          assetKey="player_photo"
          onUploaded={(url) => setValue("photoUrl", url, { shouldDirty: true, shouldValidate: true })}
          error={errors.photoUrl?.message}
          hint="Disarankan foto potret rasio 3:4, minimal 600 x 800 px agar tidak gepeng saat dipakai di detail pemain."
        />

        {/* Upload Tanda Tangan Elektronik */}
        <UploadField
          label="Tanda Tangan Elektronik"
          value={signatureUrl}
          assetKey="player_signature"
          onUploaded={(url) => setValue("signatureUrl", url, { shouldDirty: true, shouldValidate: true })}
          error={errors.signatureUrl?.message}
          hint="Gunakan gambar dengan area tanda tangan yang rapat agar tetap jelas saat ditampilkan kecil."
        />
      </div>
    </>
  );
}
