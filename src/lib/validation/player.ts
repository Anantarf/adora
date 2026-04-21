import { z } from "zod";
import type { Player } from "@/types/dashboard";
import { toYYYYMMDD } from "@/lib/date-utils";

export const playerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  dateOfBirth: z.string().nonempty("TTL wajib diisi"),
  placeOfBirth: z.string().optional(),
  gender: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  schoolOrigin: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  phoneNumber: z.string().optional(),
  medicalHistory: z.string().optional(),
  parentName: z.string().optional(),
  parentAddress: z.string().optional(),
  parentPhoneNumber: z.string().optional(),
  groupId: z.string().nonempty("Kelompok wajib dipilih"),
  parentId: z.string().optional(),
});

export type PlayerFormValues = z.infer<typeof playerSchema>;

export function playerToFormValues(player: Player): PlayerFormValues {
  return {
    name: player.name,
    dateOfBirth: player.dateOfBirth ? toYYYYMMDD(player.dateOfBirth) : "",
    placeOfBirth: player.placeOfBirth || "",
    gender: player.gender || "",
    weight: player.weight || "",
    height: player.height || "",
    schoolOrigin: player.schoolOrigin || "",
    address: player.address || "",
    email: player.email || "",
    phoneNumber: player.phoneNumber || "",
    medicalHistory: player.medicalHistory || "",
    parentName: player.parentName || "",
    parentAddress: player.parentAddress || "",
    parentPhoneNumber: player.parentPhoneNumber || "",
    groupId: player.groupId || "",
    parentId: player.parentId || "",
  };
}
