import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Memulai proses seeding data ADORA BBC...\n");

  console.log("Membersihkan data lama...");
  await prisma.reportArchive.deleteMany();
  await prisma.statisticHistory.deleteMany();
  await prisma.statistic.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.coachAssignment.deleteMany();
  await prisma.coachProfile.deleteMany();
  await prisma.player.deleteMany();
  await prisma.eventGroup.deleteMany();
  await prisma.event.deleteMany();
  await prisma.group.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.evaluationPeriod.deleteMany();
  await prisma.user.deleteMany({ where: { role: "COACH" } });
  await prisma.user.deleteMany({ where: { role: "PARENT" } });
  console.log("Data lama berhasil dibersihkan.\n");

  const pw = await bcrypt.hash("password", 10);

  const adminUser = await prisma.user.upsert({
    where: { username: "superadmin" },
    update: { password: pw },
    create: {
      id: crypto.randomUUID(),
      username: "superadmin",
      password: pw,
      name: "Head Coach Admin",
      email: "admin@adorabbc.com",
      role: "ADMIN",
    },
  });

  const parentUser = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      username: "parentdemo",
      password: pw,
      name: "Bunda Arya",
      email: "parent@adorabbc.com",
      role: "PARENT",
    },
  });

  const coachUser = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      username: "coachdemo",
      password: pw,
      name: "Coach Danuri Akbar",
      email: "coach@adorabbc.com",
      role: "COACH",
    },
  });

  const hbPusat = await prisma.homebase.upsert({
    where: { name: "ADORA Gandul (Pusat)" },
    update: { description: "Home Court Cinere" },
    create: {
      name: "ADORA Gandul (Pusat)",
      address: "Jl. Raya Timur No. 2, Cinere, Depok",
      phone: "6281296701301",
      description: "Home Court Cinere",
    },
  });

  await prisma.homebase.upsert({
    where: { name: "ADORA Cibubur" },
    update: { description: "GOR Cileungsi (Cabang Cibubur)" },
    create: {
      name: "ADORA Cibubur",
      address: "Pasir Angin, Kec. Cileungsi, Kab. Bogor",
      phone: "6281770776888",
      description: "GOR Cileungsi (Cabang Cibubur)",
    },
  });

  const groupU12 = await prisma.group.create({
    data: {
      name: "KU-12 Elite",
      category: "KELOMPOK_UMUR",
      targetKu: 12,
      homebaseId: hbPusat.id,
    },
  });

  const evaluationPeriod = await prisma.evaluationPeriod.create({
    data: {
      name: "Evaluasi Mei 2026",
      startDate: new Date("2026-05-01T00:00:00.000Z"),
      endDate: new Date("2026-05-31T23:59:59.000Z"),
      isActive: true,
    },
  });

  const trainingEvent = await prisma.event.create({
    data: {
      title: "Latihan Ball Handling",
      description: "Sesi teknik dasar dan game situational.",
      date: new Date("2026-05-18T00:00:00.000Z"),
      type: "LATIHAN",
      location: "ADORA Gandul (Pusat)",
      homebaseId: hbPusat.id,
    },
  });

  await prisma.eventGroup.create({
    data: {
      eventId: trainingEvent.id,
      groupId: groupU12.id,
    },
  });

  const parentPlayer = await prisma.player.create({
    data: {
      name: "Arya Pratama",
      firstName: "Arya",
      lastName: "Pratama",
      dateOfBirth: new Date("2014-08-15T00:00:00.000Z"),
      gender: "Laki-laki",
      schoolOrigin: "SD Sukamaju",
      phoneNumber: "081299998888",
      addressLine1: "Jl. Contoh No. 10",
      city: "Depok",
      province: "Jawa Barat",
      postalCode: "16514",
      parentName: "Bunda Arya",
      parentPhoneNumber: "081277771111",
      groupId: groupU12.id,
      parentId: parentUser.id,
      preferredHomebaseId: hbPusat.id,
    },
  });

  const coachProfile = await prisma.coachProfile.create({
    data: {
      userId: coachUser.id,
      fullName: "Danuri Akbar",
      placeOfBirth: "Depok",
      dateOfBirth: new Date("1990-06-12T00:00:00.000Z"),
      gender: "Laki-laki",
    },
  });

  await prisma.coachAssignment.create({
    data: {
      coachProfileId: coachProfile.id,
      groupId: groupU12.id,
    },
  });

  await prisma.attendance.createMany({
    data: [
      {
        date: new Date("2026-05-18T00:00:00.000Z"),
        status: "HADIR",
        playerId: parentPlayer.id,
        eventId: trainingEvent.id,
      },
      {
        date: new Date("2026-05-11T00:00:00.000Z"),
        status: "IZIN",
        playerId: parentPlayer.id,
      },
    ],
  });

  const metrics = {
    dribble: {
      inAndOut: 8,
      crossover: 8,
      vLeft: 7,
      vRight: 8,
      betweenLegsLeft: 7,
      betweenLegsRight: 7,
    },
    passing: {
      chestPass: 8,
      bouncePass: 8,
      overheadPass: 7,
    },
    layUp: 8,
    shooting: 7,
    notes: "Perkembangan teknik dasar terlihat stabil. Fokus berikutnya adalah konsistensi finishing dan keberanian mengambil keputusan saat transisi.",
  };

  const statistic = await prisma.statistic.create({
    data: {
      date: new Date("2026-05-01T00:00:00.000Z"),
      metricsJson: metrics,
      status: "Published",
      playerId: parentPlayer.id,
      periodId: evaluationPeriod.id,
    },
  });

  await prisma.statisticHistory.create({
    data: {
      statisticId: statistic.id,
      metricsJson: metrics,
      status: "Published",
      editedBy: adminUser.id,
    },
  });

  await prisma.reportArchive.create({
    data: {
      playerId: parentPlayer.id,
      periodId: evaluationPeriod.id,
      groupId: groupU12.id,
      fileUrl: "/template-rapor-sd.pdf",
      status: "RELEASED",
      releasedAt: new Date("2026-05-31T10:00:00.000Z"),
      uploadedById: adminUser.id,
    },
  });

  const settings = [
    { key: "rapor_header_url", value: "/template-rapor-sd.pdf" },
    { key: "rapor_coach_name", value: "Danuri Akbar" },
    { key: "rapor_ceo_name", value: "M. Arief, S.Ak" },
  ];
  for (const s of settings) {
    await prisma.clubSetting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }

  console.log("Admin user (superadmin / password) berhasil di-seed.");
  console.log("Parent demo (parentdemo / password) berhasil di-seed.");
  console.log("Coach demo (coachdemo / password) berhasil di-seed.");
  console.log("Homebase, kelompok, agenda, attendance, dan rapor demo berhasil di-seed.");
  console.log("Pengaturan klub berhasil di-seed.");
  console.log("\nSEEDING SELESAI.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
