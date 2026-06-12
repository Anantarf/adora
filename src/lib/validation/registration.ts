import { z } from "zod";
import { PROGRAMS } from "@/lib/constants/programs";

export const REGISTRATION_NAME_MAX = 100;
export const REGISTRATION_PHONE_REGEX = /^\+?\d{10,15}$/;
export const REGISTRATION_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_AGE_GROUPS = PROGRAMS.map((program) => program.label);

export const submitRegistrationSchema = z.object({
  playerName: z
    .string()
    .trim()
    .min(1, "Nama tidak valid.")
    .max(REGISTRATION_NAME_MAX, `Nama tidak valid (maks. ${REGISTRATION_NAME_MAX} karakter).`),
  phone: z
    .string()
    .trim()
    .regex(REGISTRATION_PHONE_REGEX, "Nomor WhatsApp tidak valid (10-15 digit)."),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || REGISTRATION_EMAIL_REGEX.test(value),
      "Format email tidak valid.",
    ),
  ageGroup: z
    .string()
    .refine((value) => VALID_AGE_GROUPS.includes(value), "Program tidak valid."),
  homebaseId: z
    .string()
    .trim()
    .min(1, "Homebase belum dipilih."),
});

export type SubmitRegistrationInput = z.input<typeof submitRegistrationSchema>;
export type SubmitRegistrationParsed = z.output<typeof submitRegistrationSchema>;

export const registrationIdSchema = z
  .string()
  .trim()
  .min(1, "ID pendaftar tidak valid.");

export function formatZodErrors(error: z.ZodError): string {
  const first = error.issues[0];
  return first?.message ?? "Data tidak valid.";
}
