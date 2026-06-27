import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== MEMULAI SEEDING DATA DUMMY REALISTIS ADORA BBC ===\n");

  const passwordHash = await bcrypt.hash("password", 10);

  // 1. CLEANUP DATA LAMA (KECUALI ClubSetting)
  console.log("Membersihkan data lama...");
  await prisma.attendance.deleteMany();
  await prisma.statisticHistory.deleteMany();
  await prisma.statistic.deleteMany();
  await prisma.reportArchive.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.eventGroup.deleteMany();
  await prisma.event.deleteMany();
  await prisma.coachAssignment.deleteMany();
  await prisma.coachProfile.deleteMany();
  await prisma.player.deleteMany();
  await prisma.group.deleteMany();
  await prisma.homebase.deleteMany();
  await prisma.user.deleteMany();
  console.log("Cleanup selesai.");

  // 2. SEED HOMEBASE
  console.log("Seeding homebase...");
  const gandul = await prisma.homebase.create({
    data: {
      name: "ADORA Gandul (Pusat)",
      address: "Jl. Gandul Raya No. 15, Cinere, Kota Depok, Jawa Barat 16514",
      phone: "081234567890",
    },
  });

  const cibubur = await prisma.homebase.create({
    data: {
      name: "ADORA Cibubur",
      address: "GOR Cileungsi, Jl. Raya Cileungsi - Jonggol No. 45, Bogor, Jawa Barat 16820",
      phone: "081298765432",
    },
  });
  console.log("Homebase berhasil di-seed.");

  // 3. SEED USER (ADMIN, COACH)
  console.log("Seeding users...");
  
  // Admin
  const adminUser = await prisma.user.create({
    data: {
      username: "superadmin",
      email: "admin@adorabc.com",
      name: "Super Admin",
      password: passwordHash,
      role: "ADMIN",
    },
  });

  // Coach Danuri
  const coachDanuriUser = await prisma.user.create({
    data: {
      username: "coach.danuri",
      email: "danuri@adorabc.com",
      name: "Danuri Akbar",
      password: passwordHash,
      role: "COACH",
    },
  });

  console.log("Users berhasil di-seed.");

  // 4. SEED COACH PROFILES
  console.log("Seeding coach profiles...");
  const coachDanuriProfile = await prisma.coachProfile.create({
    data: {
      userId: coachDanuriUser.id,
      fullName: "Danuri Akbar",
      placeOfBirth: "Depok",
      dateOfBirth: new Date("1990-06-12"),
      gender: "Laki-laki",
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    },
  });
  console.log("Coach profiles berhasil di-seed.");

  // 5. EVALUATION PERIODS & CONFIG (V2)
  console.log("Seeding evaluation periods & config v2...");
  const evaluationConfigV2 = {
    version: "v2",
    categories: [
      {
        id: "dribble",
        label: "Dribble",
        weight: 40,
        items: [
          { id: "in-and-out", label: "In & Out Dribble", maxScore: 99 },
          { id: "crossover", label: "Crossover", maxScore: 10 },
          { id: "v-left", label: "V Dribble (Kiri)", maxScore: 10 },
          { id: "v-right", label: "V Dribble (Kanan)", maxScore: 10 },
          { id: "between-legs-left", label: "Between Legs (Kiri)", maxScore: 10 },
          { id: "between-legs-right", label: "Between Legs (Kanan)", maxScore: 10 },
        ],
      },
      {
        id: "passing",
        label: "Passing",
        weight: 25,
        items: [
          { id: "chest-pass", label: "Chest Pass", maxScore: 10 },
          { id: "bounce-pass", label: "Bounce Pass", maxScore: 10 },
          { id: "overhead-pass", label: "Overhead Pass", maxScore: 10 },
        ],
      },
      {
        id: "finishing",
        label: "Finishing",
        weight: 20,
        items: [{ id: "lay-up", label: "Lay Up", maxScore: 10 }],
      },
      {
        id: "shooting",
        label: "Shooting",
        weight: 15,
        items: [{ id: "shooting", label: "Shooting", maxScore: 10 }],
      },
    ],
    attendance: {
      enabled: true,
      label: "Presensi",
      weight: 10,
      statusScores: {
        HADIR: 100,
        IZIN: 75,
        SAKIT: 75,
        ALPA: 0,
      },
    },
    notesMaxLength: 160,
    grading: [
      { letter: "A", label: "SANGAT BAIK", minScore: 80 },
      { letter: "B", label: "BAIK", minScore: 70 },
      { letter: "C", label: "CUKUP BAIK", minScore: 60 },
      { letter: "D", label: "KURANG BAIK", minScore: 0 },
    ],
  };

  await prisma.evaluationPeriod.create({
    data: {
      name: "Periode Ganjil Mei - Juni 2026",
      startDate: new Date("2026-05-01T00:00:00.000Z"),
      endDate: new Date("2026-06-30T23:59:59.999Z"),
      isActive: true,
      evaluationConfigJson: evaluationConfigV2,
    },
  });
  console.log("Evaluation periods & config v2 berhasil di-seed.");

  // 6. SEED CLUB SETTINGS (UPSERT, JANGAN DIUBAH VALUE)
  console.log("Seeding club settings (upserting mandatory settings)...");
  const settings = [
    { key: "rapor_header_url", value: "/template-rapor-sd.pdf" },
    { key: "rapor_coach_name", value: "Danuri Akbar" },
    { key: "rapor_ceo_name", value: "M. Arief, S.Ak" },
  ];
  for (const s of settings) {
    await prisma.clubSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log("Pengaturan template rapor berhasil di-seed/di-pertahankan.");

  console.log("\n=== SEEDING SELESAI DENGAN SUKSES ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
