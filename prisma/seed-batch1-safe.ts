import "dotenv/config";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Menyiapkan dummy data aman untuk Batch 1...");

  const passwordHash = await bcrypt.hash("password", 10);

  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN", isDeleted: false },
    select: { id: true, username: true },
  });

  if (!adminUser) {
    throw new Error("Tidak ada akun admin aktif untuk menautkan upload arsip rapor.");
  }

  const coachUser = await prisma.user.upsert({
    where: { username: "coachdemo" },
    update: {
      name: "Coach Danuri Akbar",
      email: "coach@adorabbc.com",
      password: passwordHash,
      role: "COACH",
      isDeleted: false,
      mustChangePassword: false,
    },
    create: {
      id: crypto.randomUUID(),
      username: "coachdemo",
      password: passwordHash,
      name: "Coach Danuri Akbar",
      email: "coach@adorabbc.com",
      role: "COACH",
    },
  });

  const coachProfile = await prisma.coachProfile.upsert({
    where: { userId: coachUser.id },
    update: {
      fullName: "Danuri Akbar",
      placeOfBirth: "Depok",
      dateOfBirth: new Date("1990-06-12T00:00:00.000Z"),
      gender: "Laki-laki",
      isDeleted: false,
    },
    create: {
      userId: coachUser.id,
      fullName: "Danuri Akbar",
      placeOfBirth: "Depok",
      dateOfBirth: new Date("1990-06-12T00:00:00.000Z"),
      gender: "Laki-laki",
    },
  });

  const targetGroup = await prisma.group.findFirst({
    where: {},
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  if (targetGroup) {
    await prisma.coachAssignment.upsert({
      where: { groupId: targetGroup.id },
      update: { coachProfileId: coachProfile.id },
      create: {
        coachProfileId: coachProfile.id,
        groupId: targetGroup.id,
      },
    });
  }

  const targetPeriod = await prisma.evaluationPeriod.findFirst({
    where: {},
    orderBy: { startDate: "desc" },
    select: { id: true, name: true },
  });

  const targetPlayer = await prisma.player.findFirst({
    where: { isDeleted: false },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, groupId: true },
  });

  if (targetPlayer && targetPeriod) {
    await prisma.reportArchive.upsert({
      where: {
        playerId_periodId: {
          playerId: targetPlayer.id,
          periodId: targetPeriod.id,
        },
      },
      update: {
        groupId: targetPlayer.groupId,
        fileUrl: "/template-rapor-sd.pdf",
        status: "RELEASED",
        releasedAt: new Date(),
        uploadedById: adminUser.id,
      },
      create: {
        playerId: targetPlayer.id,
        periodId: targetPeriod.id,
        groupId: targetPlayer.groupId,
        fileUrl: "/template-rapor-sd.pdf",
        status: "RELEASED",
        releasedAt: new Date(),
        uploadedById: adminUser.id,
      },
    });
  }

  console.log(`Coach demo siap: ${coachUser.username}`);
  if (targetGroup) {
    console.log(`Coach ditautkan ke group: ${targetGroup.name}`);
  } else {
    console.log("Belum ada group aktif, assignment coach dilewati.");
  }

  if (targetPlayer && targetPeriod) {
    console.log(`Arsip rapor dummy siap untuk pemain ${targetPlayer.name} pada periode ${targetPeriod.name}.`);
  } else {
    console.log("Belum ada player/periode yang cocok, arsip rapor dummy dilewati.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
