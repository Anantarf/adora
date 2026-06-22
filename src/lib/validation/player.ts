import { z } from "zod";
import type { Player } from "@/types/dashboard";
import { formatDateForInput, isSupportedDateInput, parseFlexibleDateInput } from "@/lib/date-utils";

const phoneRegex = /^(?:\+62|62|0)[1-9]\d{7,14}$/;

const optionalText = z.string().trim().max(200).optional();
const optionalEmail = z.string().email("Format email tidak valid").max(200).optional().or(z.literal(""));
const optionalPhone = z.string().trim().max(30).optional().refine(val => !val || phoneRegex.test(val), {
  message: "Format nomor telepon tidak valid (contoh: 0812xxxxxx atau +62812xxxxxx)"
});

export const playerSchema = z
  .object({
    firstName: z.string().trim().min(1, "Nama depan wajib diisi").max(80, "Nama terlalu panjang"),
    lastName: z.string().trim().max(80, "Nama terlalu panjang").optional(),
    dateOfBirth: z
      .string()
      .trim()
      .nonempty("Tanggal lahir wajib diisi")
      .refine((value) => isSupportedDateInput(value), "Gunakan format tanggal dd/mm/yyyy"),
    placeOfBirth: optionalText,
    gender: z.string().trim().min(1, "Jenis kelamin wajib dipilih").max(40),
    religion: optionalText,
    weight: optionalText,
    height: optionalText,
    schoolOrigin: z.string().trim().min(1, "Asal sekolah wajib diisi").max(200),
    addressLine1: z.string().trim().min(1, "Alamat rumah wajib diisi").max(300),
    addressLine2: optionalText,
    city: z.string().trim().min(1, "Kota wajib diisi").max(100),
    province: z.string().trim().min(1, "Provinsi wajib diisi").max(100),
    postalCode: z.string().trim().min(1, "Kode pos wajib diisi").max(15),
    ktpAddress: optionalText,
    email: optionalEmail,
    phoneNumber: z
      .string()
      .trim()
      .min(1, "Nomor telepon wajib diisi")
      .max(30)
      .regex(phoneRegex, "Format nomor telepon tidak valid (contoh: 0812xxxxxx atau +62812xxxxxx)"),
    instagram: optionalText,
    hasMedicalCondition: z.boolean().default(false),
    medicalConditionDetail: optionalText,
    parentName: optionalText,
    parentAddress: optionalText,
    parentPhoneNumber: optionalPhone,
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
      const dob = parseFlexibleDateInput(data.dateOfBirth);
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
    form.dateOfBirth = formatDateForInput(player.dateOfBirth);
  }

  return form as unknown as PlayerFormValues;
}

export const batchPlayerSchema = z.object({
  name: z.string().trim().min(2).max(120, "Nama terlalu panjang"),
  dateOfBirth: z.string().trim().refine((value) => isSupportedDateInput(value), "Gunakan format tanggal dd/mm/yyyy"),
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


