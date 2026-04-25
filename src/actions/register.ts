"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server-auth";
import { PROGRAMS } from "@/lib/constants/programs";

const VALID_AGE_GROUPS = new Set<string>(PROGRAMS.map((p) => p.label));

export async function submitRegistration(data: {
  playerName: string;
  phone: string;
  email?: string;
  ageGroup: string;
  homebaseId: string;
}) {
  const name  = data.playerName.trim();
  const phone = data.phone.trim();
  const email = data.email?.trim() || null;

  if (!name || name.length > 100)
    return { success: false, error: "Nama tidak valid (maks. 100 karakter)." };

  if (!phone || !/^\+?\d{10,15}$/.test(phone))
    return { success: false, error: "Nomor WhatsApp tidak valid (10–15 digit)." };

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { success: false, error: "Format email tidak valid." };

  if (!VALID_AGE_GROUPS.has(data.ageGroup))
    return { success: false, error: "Program tidak valid." };

  if (!data.homebaseId)
    return { success: false, error: "Homebase belum dipilih." };

  try {
    const registration = await prisma.registration.create({
      data: { playerName: name, phone, email, ageGroup: data.ageGroup, homebaseId: data.homebaseId, status: "PENDING" },
    });

    revalidatePath("/dashboard/registrations");
    return { success: true, id: registration.id };
  } catch (error) {
    console.error("Failed to submit registration:", error);
    return { success: false, error: "Gagal mengirim pendaftaran. Silakan coba lagi." };
  }
}

export async function getPendingRegistrations() {
  await requireAdmin();
  try {
    return await prisma.registration.findMany({
      where: { status: { in: ["PENDING", "REVIEWED"] } },
      include: { homebase: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to get registrations:", error);
    return [];
  }
}

/** Untuk form action di Server Component — return void agar kompatibel dengan tipe action form Next.js */
export async function markRegistrationPaid(id: string): Promise<void> {
  await requireAdmin();
  await prisma.registration.update({ where: { id }, data: { status: "REVIEWED" } });
  revalidatePath("/dashboard/registrations");
}

export async function markRegistrationUnpaid(id: string): Promise<void> {
  await requireAdmin();
  await prisma.registration.update({ where: { id }, data: { status: "PENDING" } });
  revalidatePath("/dashboard/registrations");
}

export async function deleteRegistration(id: string): Promise<void> {
  await requireAdmin();
  await prisma.registration.delete({ where: { id } });
  revalidatePath("/dashboard/registrations");
}



export async function updateRegistrationStatus(id: string, status: "PENDING" | "REVIEWED" | "COMPLETED") {
  await requireAdmin();
  try {
    await prisma.registration.update({ where: { id }, data: { status } });
    revalidatePath("/dashboard/registrations");
    return { success: true };
  } catch (error) {
    console.error("Failed to update registration status:", error);
    return { success: false, error: "Gagal memperbarui status pendaftaran." };
  }
}
