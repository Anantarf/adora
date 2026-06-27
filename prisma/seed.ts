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

  // 3. SEED USER (ADMIN, COACH, PARENT)
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

  // Coaches
  const coachDanuriUser = await prisma.user.create({
    data: {
      username: "coach.danuri",
      email: "danuri@adorabc.com",
      name: "Danuri Akbar",
      password: passwordHash,
      role: "COACH",
    },
  });

  const coachRezaUser = await prisma.user.create({
    data: {
      username: "coach.reza",
      email: "reza@adorabc.com",
      name: "Reza Kurniawan",
      password: passwordHash,
      role: "COACH",
    },
  });

  const coachFauziUser = await prisma.user.create({
    data: {
      username: "coach.fauzi",
      email: "fauzi@adorabc.com",
      name: "Ahmad Fauzi",
      password: passwordHash,
      role: "COACH",
    },
  });

  // Parents
  const parentsData = [
    { username: "parent.arya", email: "arya.satya@gmail.com", name: "Arya Satya" },
    { username: "parent.budi", email: "budi.hermawan@yahoo.com", name: "Budi Hermawan" },
    { username: "parent.citra", email: "citra.lestari@gmail.com", name: "Citra Lestari" },
    { username: "parent.diana", email: "diana.puspita@outlook.com", name: "Diana Puspita" },
    { username: "parent.eko", email: "eko.prasetyo@gmail.com", name: "Eko Prasetyo" },
    { username: "parent.fitri", email: "fitri.handayani@gmail.com", name: "Fitri Handayani" },
  ];

  const parentUsers: Record<string, Awaited<ReturnType<typeof prisma.user.create>>> = {};
  for (const parent of parentsData) {
    const createdParent = await prisma.user.create({
      data: {
        username: parent.username,
        email: parent.email,
        name: parent.name,
        password: passwordHash,
        role: "PARENT",
      },
    });
    parentUsers[parent.username] = createdParent;
  }
  console.log("Users berhasil di-seed.");

  // 4. SEED COACH PROFILES & ASSIGNMENTS
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

  const coachRezaProfile = await prisma.coachProfile.create({
    data: {
      userId: coachRezaUser.id,
      fullName: "Reza Kurniawan",
      placeOfBirth: "Jakarta",
      dateOfBirth: new Date("1993-08-20"),
      gender: "Laki-laki",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    },
  });

  const coachFauziProfile = await prisma.coachProfile.create({
    data: {
      userId: coachFauziUser.id,
      fullName: "Ahmad Fauzi",
      placeOfBirth: "Bogor",
      dateOfBirth: new Date("1995-03-15"),
      gender: "Laki-laki",
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    },
  });
  console.log("Coach profiles berhasil di-seed.");

  // 5. SEED GROUPS
  console.log("Seeding groups...");
  const ku10 = await prisma.group.create({
    data: {
      name: "KU-10 Pemula",
      category: "KELOMPOK_UMUR",
      targetKu: 10,
      homebaseId: gandul.id,
      description: JSON.stringify({ category: "KELOMPOK_UMUR", targetKu: 10 }),
    },
  });

  const ku12 = await prisma.group.create({
    data: {
      name: "KU-12 Elite",
      category: "KELOMPOK_UMUR",
      targetKu: 12,
      homebaseId: gandul.id,
      description: JSON.stringify({ category: "KELOMPOK_UMUR", targetKu: 12 }),
    },
  });

  const ku14 = await prisma.group.create({
    data: {
      name: "KU-14 Inti",
      category: "KELOMPOK_UMUR",
      targetKu: 14,
      homebaseId: cibubur.id,
      description: JSON.stringify({ category: "KELOMPOK_UMUR", targetKu: 14 }),
    },
  });

  const ku16 = await prisma.group.create({
    data: {
      name: "KU-16 Senior",
      category: "KELOMPOK_UMUR",
      targetKu: 16,
      homebaseId: cibubur.id,
      description: JSON.stringify({ category: "KELOMPOK_UMUR", targetKu: 16 }),
    },
  });
  console.log("Groups berhasil di-seed.");

  // 6. COACH ASSIGNMENTS
  console.log("Seeding coach assignments...");
  await prisma.coachAssignment.createMany({
    data: [
      { coachProfileId: coachDanuriProfile.id, groupId: ku10.id },
      { coachProfileId: coachRezaProfile.id, groupId: ku12.id },
      { coachProfileId: coachFauziProfile.id, groupId: ku14.id },
      { coachProfileId: coachDanuriProfile.id, groupId: ku16.id }, // Danuri handles KU-10 and KU-16
    ],
  });
  console.log("Coach assignments berhasil di-seed.");



  // 14. SEED REGISTRATIONS
  console.log("Seeding registrations...");
  await prisma.registration.createMany({
    data: [
      {
        playerName: "Rian Hidayat",
        phone: "081223344556",
        email: "rian.hidayat@outlook.com",
        ageGroup: "KU-10",
        homebaseId: gandul.id,
        status: "PENDING",
        createdAt: new Date("2026-06-01T08:30:00.000Z"),
      },
      {
        playerName: "Siti Rahma",
        phone: "081344556677",
        email: "siti.rahma@gmail.com",
        ageGroup: "KU-12",
        homebaseId: gandul.id,
        status: "PENDING",
        createdAt: new Date("2026-06-02T11:15:00.000Z"),
      },
      {
        playerName: "Taufik Hidayat",
        phone: "081566778899",
        email: "taufik.h@gmail.com",
        ageGroup: "KU-14",
        homebaseId: cibubur.id,
        status: "REVIEWED",
        createdAt: new Date("2026-05-28T09:00:00.000Z"),
      },
      {
        playerName: "Yusuf Pratama",
        phone: "081988990022",
        email: "yusuf.pratama@gmail.com",
        ageGroup: "KU-16",
        homebaseId: cibubur.id,
        status: "COMPLETED",
        createdAt: new Date("2026-05-25T14:00:00.000Z"),
      },
      {
        playerName: "Bambang Pamungkas",
        phone: "081277889900",
        email: "bambang.p@yahoo.com",
        ageGroup: "KU-14",
        homebaseId: cibubur.id,
        status: "COMPLETED",
        createdAt: new Date("2026-05-20T10:30:00.000Z"),
      },
    ],
  });
  console.log("Registrations berhasil di-seed.");

  // 15. SEED CLUB SETTINGS (UPSERT, JANGAN DIUBAH VALUE)
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
