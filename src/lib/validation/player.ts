import { z } from "zod";
import type { Player } from "@/types/dashboard";
import { toYYYYMMDD } from "@/lib/date-utils";

const optionalText = z.string().trim().optional();
const optionalEmail = z.string().email("Format email tidak valid").optional().or(z.literal(""));

export const playerSchema = z
  .object({
    firstName: z.string().trim().min(1, "Nama depan wajib diisi"),
    lastName: z.string().trim().optional(),
    dateOfBirth: z.string().nonempty("Tanggal lahir wajib diisi"),
    placeOfBirth: optionalText,
    gender: z.string().trim().min(1, "Jenis kelamin wajib dipilih"),
    religion: optionalText,
    weight: optionalText,
    height: optionalText,
    schoolOrigin: z.string().trim().min(1, "Asal sekolah wajib diisi"),
    addressLine1: z.string().trim().min(1, "Alamat rumah wajib diisi"),
    addressLine2: optionalText,
    city: z.string().trim().min(1, "Kota wajib diisi"),
    province: z.string().trim().min(1, "Provinsi wajib diisi"),
    postalCode: z.string().trim().min(1, "Kode pos wajib diisi"),
    ktpAddress: optionalText,
    email: optionalEmail,
    phoneNumber: z.string().trim().min(1, "Nomor telepon wajib diisi"),
    instagram: optionalText,
    hasMedicalCondition: z.boolean().default(false),
    medicalConditionDetail: optionalText,
    parentName: optionalText,
    parentAddress: optionalText,
    parentPhoneNumber: optionalText,
    groupId: z.string().nonempty("Kelompok wajib dipilih"),
    parentId: z.string().optional(),
    photoUrl: z.string().trim().optional().or(z.literal("")),
    signatureUrl: z.string().trim().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.hasMedicalCondition && !data.medicalConditionDetail?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Jenis penyakit wajib diisi jika riwayat penyakit memilih Ya.",
        path: ["medicalConditionDetail"],
      });
    }

    if (data.dateOfBirth) {
      const dob = new Date(data.dateOfBirth);
      if (!isNaN(dob.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        if (age < 18) {
          if (!data.parentName?.trim()) {
            ctx.addIssue({
              code: "custom",
              message: "Nama orang tua wajib diisi untuk pemain di bawah 18 tahun.",
              path: ["parentName"],
            });
          }
          if (!data.parentPhoneNumber?.trim()) {
            ctx.addIssue({
              code: "custom",
              message: "Nomor telepon orang tua wajib diisi untuk pemain di bawah 18 tahun.",
              path: ["parentPhoneNumber"],
            });
          }
        }
      }
    }
  });

export type PlayerFormValues = z.input<typeof playerSchema>;

export function playerToFormValues(player: Player): PlayerFormValues {
  const defaults: PlayerFormValues = {
    firstName: "", lastName: "", dateOfBirth: "", placeOfBirth: "", gender: "",
    religion: "", weight: "", height: "", schoolOrigin: "", addressLine1: "",
    addressLine2: "", city: "", province: "", postalCode: "", ktpAddress: "",
    email: "", phoneNumber: "", instagram: "", hasMedicalCondition: false,
    medicalConditionDetail: "", parentName: "", parentAddress: "", parentPhoneNumber: "",
    groupId: "", parentId: "", photoUrl: "", signatureUrl: ""
  };

  const form = { ...defaults } as Record<string, unknown>;
  for (const key of Object.keys(defaults)) {
    const val = (player as unknown as Record<string, unknown>)[key];
    if (val !== undefined && val !== null) {
      form[key] = val;
    }
  }

  // Terapkan penyesuaian khusus / fallback untuk kompatibilitas data lama
  form.addressLine1 = player.addressLine1 || player.address || "";
  form.medicalConditionDetail = player.medicalConditionDetail || player.medicalHistory || "";
  if (player.dateOfBirth) {
    form.dateOfBirth = toYYYYMMDD(player.dateOfBirth);
  }

  return form as unknown as PlayerFormValues;
}

export const batchPlayerSchema = z.object({
  name: z.string().trim().min(2),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  placeOfBirth: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  weight: z.string().trim().optional(),
  height: z.string().trim().optional(),
  schoolOrigin: z.string().trim().optional(),
  address: z.string().trim().optional(),
  email: z.string().trim().optional(),
  phoneNumber: z.string().trim().optional(),
  medicalHistory: z.string().trim().optional(),
  parentName: z.string().trim().optional(),
  parentAddress: z.string().trim().optional(),
  parentPhoneNumber: z.string().trim().optional(),
  groupId: z.string().trim().min(1),
  parentId: z.string().trim().optional(),
});

export const batchPlayersInputSchema = z.array(batchPlayerSchema).min(1).max(1000);

export const MAX_PLAYER_PAGE_SIZE = 50;
export const DEFAULT_PLAYER_PAGE_SIZE = 9;

export const playerListArgsSchema = z.object({
  groupId: z.string().trim().optional(),
  searchQuery: z.string().trim().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(MAX_PLAYER_PAGE_SIZE).optional(),
});


