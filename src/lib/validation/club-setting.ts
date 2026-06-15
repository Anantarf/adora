import { z } from "zod";

import { normalizeExpectedPrivateUploadUrl } from "@/lib/private-upload";

/**
 * Whitelist of editable club settings. Keep in sync with
 * `actions/settings.ts` REPORT_SETTING_KEYS and the upload-policy
 * `assetKey` values that map to settings.
 */
export const CLUB_SETTING_KEYS = [
  "rapor_header_url",
  "rapor_ceo_sign_url",
  "rapor_coach_sign_url",
  "rapor_stamp_url",
  "report_signer_global_coach_profile_id",
  "rapor_coach_name",
  "rapor_ceo_name",
] as const;

export type ClubSettingKey = (typeof CLUB_SETTING_KEYS)[number];

const SETTING_KEY_SET = new Set<string>(CLUB_SETTING_KEYS);

export const clubSettingKeySchema = z
  .string()
  .refine((value) => SETTING_KEY_SET.has(value), "Jenis pengaturan tidak dikenali.");

export const clubSettingValueSchema = z
  .string()
  .max(2000, "Nilai pengaturan terlalu panjang.");

export const updateClubSettingSchema = z.object({
  key: clubSettingKeySchema,
  value: clubSettingValueSchema,
});

export type UpdateClubSettingInput = z.input<typeof updateClubSettingSchema>;

const SETTING_URL_RULES: Partial<
  Record<ClubSettingKey, { allowedPrefixes: string[]; allowedExtensions: string[]; label: string }>
> = {
  rapor_header_url: {
    allowedPrefixes: ["rapor_header_url_"],
    allowedExtensions: [".png", ".jpg", ".jpeg", ".pdf"],
    label: "Template rapor",
  },
  rapor_ceo_sign_url: {
    allowedPrefixes: ["rapor_ceo_sign_url_"],
    allowedExtensions: [".png"],
    label: "Tanda tangan CEO",
  },
  rapor_coach_sign_url: {
    allowedPrefixes: ["rapor_coach_sign_url_"],
    allowedExtensions: [".png"],
    label: "Tanda tangan coach global",
  },
  rapor_stamp_url: {
    allowedPrefixes: ["rapor_stamp_url_"],
    allowedExtensions: [".png"],
    label: "Stempel rapor",
  },
};

const SETTING_TEXT_RULES: Partial<Record<ClubSettingKey, { max: number; label: string }>> = {
  rapor_coach_name: {
    max: 120,
    label: "Nama coach global",
  },
  rapor_ceo_name: {
    max: 120,
    label: "Nama CEO",
  },
};

export function normalizeClubSettingValue(key: ClubSettingKey, value: string) {
  const trimmedValue = value.trim();
  const urlRule = SETTING_URL_RULES[key];

  if (urlRule) {
    return (
      normalizeExpectedPrivateUploadUrl(
        trimmedValue,
        {
          allowedPrefixes: urlRule.allowedPrefixes,
          allowedExtensions: urlRule.allowedExtensions,
        },
        urlRule.label,
      ) ?? ""
    );
  }

  const textRule = SETTING_TEXT_RULES[key];
  if (textRule && trimmedValue.length > textRule.max) {
    throw new Error(`${textRule.label} maksimal ${textRule.max} karakter.`);
  }

  return trimmedValue;
}

export function formatZodErrors(error: z.ZodError): string {
  const first = error.issues[0];
  return first?.message ?? "Data pengaturan tidak valid.";
}
