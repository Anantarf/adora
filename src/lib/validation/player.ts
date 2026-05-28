import { z } from "zod";
import type { Player } from "@/types/dashboard";
import { toYYYYMMDD } from "@/lib/date-utils";

const optionalText = z.string().trim().optional();
const optionalEmail = z.string().email("Format email tidak valid").optional().or(z.literal(""));

export const playerSchema = z
  .object({
    firstName: z.string().trim().min(2, "Nama depan minimal 2 karakter"),
    lastName: z.string().trim().optional(),
    dateOfBirth: z.string().nonempty("Tanggal lahir wajib diisi"),
    placeOfBirth: optionalText,
    gender: z.string().trim().min(1, "Jenis kelamin wajib dipilih"),
    religion: optionalText,
    weight: optionalText,
    height: optionalText,
    schoolOrigin: z.string().trim().min(2, "Asal sekolah wajib diisi"),
    addressLine1: z.string().trim().min(3, "Alamat rumah wajib diisi"),
    addressLine2: optionalText,
    city: z.string().trim().min(2, "Kota wajib diisi"),
    province: z.string().trim().min(2, "Provinsi wajib diisi"),
    postalCode: z.string().trim().min(4, "Kode pos wajib diisi"),
    ktpAddress: optionalText,
    email: optionalEmail,
    phoneNumber: z.string().trim().min(8, "Nomor telepon wajib diisi"),
    instagram: optionalText,
    hasMedicalCondition: z.boolean().default(false),
    medicalConditionDetail: optionalText,
    parentName: optionalText,
    parentAddress: optionalText,
    parentPhoneNumber: optionalText,
    groupId: z.string().nonempty("Kelompok wajib dipilih"),
    parentId: z.string().optional(),
    photoUrl: z.string().trim().min(1, "Pas foto wajib diunggah"),
    signatureUrl: z.string().trim().min(1, "Tanda tangan wajib diunggah"),
  })
  .superRefine((data, ctx) => {
    if (data.hasMedicalCondition && !data.medicalConditionDetail?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Jenis penyakit wajib diisi jika riwayat penyakit memilih Ya.",
        path: ["medicalConditionDetail"],
      });
    }
  });

export type PlayerFormValues = z.input<typeof playerSchema>;

export function playerToFormValues(player: Player): PlayerFormValues {
  return {
    firstName: player.firstName || "",
    lastName: player.lastName || "",
    dateOfBirth: player.dateOfBirth ? toYYYYMMDD(player.dateOfBirth) : "",
    placeOfBirth: player.placeOfBirth || "",
    gender: player.gender || "",
    religion: player.religion || "",
    weight: player.weight || "",
    height: player.height || "",
    schoolOrigin: player.schoolOrigin || "",
    addressLine1: player.addressLine1 || player.address || "",
    addressLine2: player.addressLine2 || "",
    city: player.city || "",
    province: player.province || "",
    postalCode: player.postalCode || "",
    ktpAddress: player.ktpAddress || "",
    email: player.email || "",
    phoneNumber: player.phoneNumber || "",
    instagram: player.instagram || "",
    hasMedicalCondition: player.hasMedicalCondition || false,
    medicalConditionDetail: player.medicalConditionDetail || player.medicalHistory || "",
    parentName: player.parentName || "",
    parentAddress: player.parentAddress || "",
    parentPhoneNumber: player.parentPhoneNumber || "",
    groupId: player.groupId || "",
    parentId: player.parentId || "",
    photoUrl: player.photoUrl || "",
    signatureUrl: player.signatureUrl || "",
  };
}
