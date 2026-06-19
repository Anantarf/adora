"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import type { PlayerFormValues } from "@/lib/validation/player";
import { calculateAgeFromDate } from "@/lib/player-profile";

interface ContactAddressFieldsProps {
  register: UseFormRegister<PlayerFormValues>;
  control: Control<PlayerFormValues>;
  errors: FieldErrors<PlayerFormValues>;
  setValue: UseFormSetValue<PlayerFormValues>;
  inputClassName?: string;
}

/**
 * Checkbox gaya kustom yang menyinkronkan alamat orang tua atau KTP
 * dengan alamat domisili utama pemain.
 */
function SameAddressCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer select-none transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="appearance-none size-4 rounded-md border border-border/70 bg-background/60 checked:bg-primary checked:border-primary cursor-pointer transition-all flex items-center justify-center after:content-['✓'] after:text-primary-foreground after:text-[10px] after:font-bold after:hidden checked:after:block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
      />
      {label}
    </label>
  );
}

export function ContactAddressFields({
  register,
  control,
  errors,
  setValue,
  inputClassName = "h-11 rounded-xl bg-background/55 hover:bg-background/75 focus:bg-background border border-border/50 focus:border-primary/80 focus:ring-4 focus:ring-primary/10 transition-all",
}: ContactAddressFieldsProps) {
  const [sameKtpAddress, setSameKtpAddress] = useState(false);
  const [sameParentAddress, setSameParentAddress] = useState(false);

  const dateOfBirth = useWatch({ control, name: "dateOfBirth" });
  const addressLine1 = useWatch({ control, name: "addressLine1" });
  const addressLine2 = useWatch({ control, name: "addressLine2" });
  const city = useWatch({ control, name: "city" });
  const province = useWatch({ control, name: "province" });
  const postalCode = useWatch({ control, name: "postalCode" });

  const playerAge = useMemo(() => calculateAgeFromDate(dateOfBirth), [dateOfBirth]);

  const fullAddress = useMemo(
    () => [addressLine1, addressLine2, city, province, postalCode].filter(Boolean).join(", "),
    [addressLine1, addressLine2, city, province, postalCode],
  );

  // Sinkronkan alamat KTP secara otomatis jika checkbox aktif
  useEffect(() => {
    if (sameKtpAddress) {
      setValue("ktpAddress", fullAddress, { shouldDirty: true, shouldValidate: true });
    }
  }, [sameKtpAddress, fullAddress, setValue]);

  // Sinkronkan alamat orang tua secara otomatis jika checkbox aktif
  useEffect(() => {
    if (sameParentAddress) {
      setValue("parentAddress", fullAddress, { shouldDirty: true, shouldValidate: true });
    }
  }, [sameParentAddress, fullAddress, setValue]);

  const textareaClassName =
    "min-h-22 rounded-xl resize-none border border-border/50 bg-background/55 p-3 text-sm text-foreground transition-all hover:bg-background/75 focus:bg-background focus:border-primary/80 focus:ring-4 focus:ring-primary/10 dark:bg-background/55 dark:text-foreground dark:scheme-dark";

  return (
    <>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">Kontak dan Alamat</p>
        <p className="text-xs text-muted-foreground">
          Alamat rumah utama wajib diisi. Detail tambahan dan alamat KTP/KK bisa dilengkapi bila perlu.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
        {/* Alamat Rumah */}
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="field-player-addressLine1" className="text-xs font-semibold text-muted-foreground/90 tracking-wide">
            Alamat Rumah <span className="text-primary font-bold">*</span>
          </label>
          <Input
            id="field-player-addressLine1"
            {...register("addressLine1")}
            placeholder="Jalan, nomor rumah, RT/RW"
            className={inputClassName}
            aria-required="true"
            aria-invalid={Boolean(errors.addressLine1)}
            aria-describedby={errors.addressLine1 ? "field-player-addressLine1-error" : undefined}
          />
          {errors.addressLine1 && (
            <p id="field-player-addressLine1-error" role="alert" className="text-destructive text-xs animate-in fade-in-50 slide-in-from-top-1 duration-200">{errors.addressLine1.message}</p>
          )}
        </div>

        {/* Detail Alamat Tambahan */}
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="field-player-addressLine2" className="text-xs font-semibold text-muted-foreground/90 tracking-wide">
            Detail Alamat Tambahan
          </label>
          <Input
            id="field-player-addressLine2"
            {...register("addressLine2")}
            placeholder="Patokan, blok, atau catatan tambahan (opsional)"
            className={inputClassName}
          />
          <p className="text-xs text-muted-foreground">Opsional. Boleh dikosongkan jika tidak ada.</p>
        </div>

        {/* Kota */}
        <div className="space-y-2">
          <label htmlFor="field-player-city" className="text-xs font-semibold text-muted-foreground/90 tracking-wide">
            Kota <span className="text-primary font-bold">*</span>
          </label>
          <Input
            id="field-player-city"
            {...register("city")}
            placeholder="Contoh: Depok"
            className={inputClassName}
            aria-required="true"
            aria-invalid={Boolean(errors.city)}
            aria-describedby={errors.city ? "field-player-city-error" : undefined}
          />
          {errors.city && (
            <p id="field-player-city-error" role="alert" className="text-destructive text-xs animate-in fade-in-50 slide-in-from-top-1 duration-200">{errors.city.message}</p>
          )}
        </div>

        {/* Provinsi */}
        <div className="space-y-2">
          <label htmlFor="field-player-province" className="text-xs font-semibold text-muted-foreground/90 tracking-wide">
            Provinsi <span className="text-primary font-bold">*</span>
          </label>
          <Input
            id="field-player-province"
            {...register("province")}
            placeholder="Contoh: Jawa Barat"
            className={inputClassName}
            aria-required="true"
            aria-invalid={Boolean(errors.province)}
            aria-describedby={errors.province ? "field-player-province-error" : undefined}
          />
          {errors.province && (
            <p id="field-player-province-error" role="alert" className="text-destructive text-xs animate-in fade-in-50 slide-in-from-top-1 duration-200">{errors.province.message}</p>
          )}
        </div>

        {/* Kode Pos */}
        <div className="space-y-2">
          <label htmlFor="field-player-postalCode" className="text-xs font-semibold text-muted-foreground/90 tracking-wide">
            Kode Pos <span className="text-primary font-bold">*</span>
          </label>
          <Input
            id="field-player-postalCode"
            {...register("postalCode")}
            placeholder="Contoh: 16514"
            className={inputClassName}
            aria-required="true"
            aria-invalid={Boolean(errors.postalCode)}
            aria-describedby={errors.postalCode ? "field-player-postalCode-error" : undefined}
          />
          {errors.postalCode && (
            <p id="field-player-postalCode-error" role="alert" className="text-destructive text-xs animate-in fade-in-50 slide-in-from-top-1 duration-200">{errors.postalCode.message}</p>
          )}
        </div>

        {/* Nomor Telepon */}
        <div className="space-y-2">
          <label htmlFor="field-player-phoneNumber" className="text-xs font-semibold text-muted-foreground/90 tracking-wide">
            Nomor Telepon <span className="text-primary font-bold">*</span>
          </label>
          <Input
            id="field-player-phoneNumber"
            type="tel"
            {...register("phoneNumber")}
            placeholder="Contoh: 081234567890"
            className={inputClassName}
            aria-required="true"
            aria-invalid={Boolean(errors.phoneNumber)}
            aria-describedby={errors.phoneNumber ? "field-player-phoneNumber-error" : "field-player-phoneNumber-hint"}
          />
          {errors.phoneNumber && (
            <p id="field-player-phoneNumber-error" role="alert" className="text-destructive text-xs animate-in fade-in-50 slide-in-from-top-1 duration-200">{errors.phoneNumber.message}</p>
          )}
          <p id="field-player-phoneNumber-hint" className="text-xs text-muted-foreground">
            Jika pemain belum punya nomor sendiri, isi dengan nomor orang tua.
          </p>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="field-player-email" className="text-xs font-semibold text-muted-foreground/90 tracking-wide">
            Email
          </label>
          <Input
            id="field-player-email"
            type="email"
            {...register("email")}
            placeholder="Contoh: nama@email.com"
            className={inputClassName}
          />
          {errors.email && (
            <p className="text-destructive text-xs animate-in fade-in-50 slide-in-from-top-1 duration-200">{errors.email.message}</p>
          )}
        </div>

        {/* Instagram */}
        <div className="space-y-2">
          <label htmlFor="field-player-instagram" className="text-xs font-semibold text-muted-foreground/90 tracking-wide">
            Akun Instagram
          </label>
          <Input
            id="field-player-instagram"
            {...register("instagram")}
            placeholder="Contoh: @adora_player"
            className={inputClassName}
          />
        </div>

        {/* Alamat KTP/KK */}
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <label htmlFor="field-player-ktpAddress" className="text-xs font-semibold text-muted-foreground/90 tracking-wide">
              Alamat Sesuai KTP/KK
            </label>
            <SameAddressCheckbox
              checked={sameKtpAddress}
              onChange={setSameKtpAddress}
              label="Sama dengan alamat domisili"
            />
          </div>
          <Textarea
            id="field-player-ktpAddress"
            {...register("ktpAddress")}
            readOnly={sameKtpAddress}
            placeholder={sameKtpAddress ? "Sama dengan alamat domisili" : "Isi jika berbeda dengan alamat domisili saat ini"}
            className={`${textareaClassName} ${sameKtpAddress ? "cursor-not-allowed border-dashed border-border/80 bg-muted/20 text-muted-foreground opacity-80 dark:bg-muted/20" : ""}`}
          />
        </div>

        {/* Nama Orang Tua */}
        <div className="space-y-2">
          <label htmlFor="field-player-parentName" className="text-xs font-semibold text-muted-foreground/90 tracking-wide">
            Nama Orang Tua{" "}
            {playerAge !== null && playerAge < 18 && (
              <span className="text-primary font-bold">*</span>
            )}
          </label>
          <Input
            id="field-player-parentName"
            {...register("parentName")}
            placeholder="Contoh: Ibu Suryani"
            className={inputClassName}
          />
          {errors.parentName && (
            <p className="text-destructive text-xs animate-in fade-in-50 slide-in-from-top-1 duration-200">{errors.parentName.message}</p>
          )}
        </div>

        {/* Nomor Telepon Orang Tua */}
        <div className="space-y-2">
          <label htmlFor="field-player-parentPhoneNumber" className="text-xs font-semibold text-muted-foreground/90 tracking-wide">
            Nomor Telepon Orang Tua{" "}
            {playerAge !== null && playerAge < 18 && (
              <span className="text-primary font-bold">*</span>
            )}
          </label>
          <Input
            id="field-player-parentPhoneNumber"
            type="tel"
            {...register("parentPhoneNumber")}
            placeholder="Contoh: 081234567890"
            className={inputClassName}
          />
          {errors.parentPhoneNumber && (
            <p className="text-destructive text-xs animate-in fade-in-50 slide-in-from-top-1 duration-200">{errors.parentPhoneNumber.message}</p>
          )}
        </div>

        {/* Alamat Orang Tua */}
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <label htmlFor="field-player-parentAddress" className="text-xs font-semibold text-muted-foreground/90 tracking-wide">
              Alamat Orang Tua
            </label>
            <SameAddressCheckbox
              checked={sameParentAddress}
              onChange={setSameParentAddress}
              label="Sama dengan alamat domisili"
            />
          </div>
          <Textarea
            id="field-player-parentAddress"
            {...register("parentAddress")}
            readOnly={sameParentAddress}
            placeholder={sameParentAddress ? "Sama dengan alamat domisili" : "Alamat orang tua/wali"}
            className={`${textareaClassName} ${sameParentAddress ? "cursor-not-allowed border-dashed border-border/80 bg-muted/20 text-muted-foreground opacity-80 dark:bg-muted/20" : ""}`}
          />
        </div>
      </div>
    </>
  );
}
