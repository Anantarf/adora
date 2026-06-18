"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-auth";
import { formatZodErrors, submitRegistrationSchema } from "@/lib/validation/registration";
import { consumeFixedWindowLimit } from "@/lib/shared-rate-limit";
import { RATE_LIMIT_POLICIES } from "@/lib/constants/rate-limits";
import { getRequestIp } from "@/lib/async-utils";
import { recordOperationalWarning } from "@/lib/observability";
import { createAuditLog } from "@/actions/audit";

type RegistrationStatus = "PENDING" | "REVIEWED" | "COMPLETED";

function revalidateRegistrations() {
  revalidatePath("/dashboard/registrations");
}

export async function submitRegistration(data: {
  playerName: string;
  phone: string;
  email?: string;
  ageGroup: string;
  homebaseId: string;
}) {
  const ip = await getRequestIp();
  const policy = RATE_LIMIT_POLICIES.submitRegistration;
  const rateLimit = await consumeFixedWindowLimit(
    policy.namespace,
    ip,
    policy.limit,
    policy.windowMs,
  );
  if (!rateLimit.allowed) {
    await recordOperationalWarning({
      source: "submit-registration",
      message: "Submit registration rate limit exceeded",
      statusCode: 429,
      metadata: { ip, count: rateLimit.count },
    });
    return {
      success: false,
      error: "Terlalu banyak percobaan. Coba lagi dalam beberapa saat.",
    };
  }

  const parsed = submitRegistrationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  const { playerName: name, phone, email, ageGroup, homebaseId } = parsed.data;

  try {
    const registration = await prisma.$transaction(async (tx) => {
      const created = await tx.registration.create({
        data: {
          playerName: name,
          phone,
          email: email || null,
          ageGroup,
          homebaseId,
          status: "PENDING",
        },
      });

      await createAuditLog(
        tx,
        "SUBMIT_REGISTRATION",
        "registration",
        created.id,
        null,
        {
          playerName: name,
          ageGroup,
          homebaseId,
          ip,
        },
      );

      return created;
    });

    revalidateRegistrations();
    return { success: true, id: registration.id };
  } catch (error) {
    console.error("Failed to submit registration:", error);
    return {
      success: false,
      error: "Gagal mengirim pendaftaran. Silakan coba lagi.",
    };
  }
}

export async function getPendingRegistrations() {
  await requireAdmin();

  try {
    return await prisma.registration.findMany({
      where: { status: { in: ["PENDING", "REVIEWED"] } },
      select: {
        id: true,
        createdAt: true,
        playerName: true,
        email: true,
        phone: true,
        ageGroup: true,
        status: true,
        homebase: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to get registrations:", error);
    return [];
  }
}

async function updateRegistrationStatus(id: string, status: RegistrationStatus) {
  const session = await requireAdmin();
  const userId = session.user.id;
  await prisma.$transaction(async (tx) => {
    await tx.registration.update({ where: { id }, data: { status } });
    await createAuditLog(tx, "UPDATE_REGISTRATION", "registration", id, userId, { status });
  });
  revalidateRegistrations();
}

export async function markRegistrationPaid(id: string): Promise<void> {
  await updateRegistrationStatus(id, "REVIEWED");
}

export async function markRegistrationUnpaid(id: string): Promise<void> {
  await updateRegistrationStatus(id, "PENDING");
}

export async function deleteRegistration(id: string): Promise<void> {
  const session = await requireAdmin();
  const userId = session.user.id;
  await prisma.$transaction(async (tx) => {
    const existing = await tx.registration.findUnique({
      where: { id },
      select: { playerName: true, ageGroup: true, homebaseId: true },
    });
    await tx.registration.delete({ where: { id } });
    await createAuditLog(tx, "DELETE_REGISTRATION", "registration", id, userId, existing ?? undefined);
  });
  revalidateRegistrations();
}
