import { z } from "zod";

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

export function formatZodErrors(error: z.ZodError): string {
  const first = error.issues[0];
  return first?.message ?? "Data pengaturan tidak valid.";
}
