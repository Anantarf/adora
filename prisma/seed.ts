import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Memulai proses seeding data ADORA BBC (Minimalis)...\n");

  const pw = await bcrypt.hash("password", 10);

  // 1. ADMIN USER
  await prisma.user.upsert({
    where: { username: "superadmin" },
    update: { password: pw },
    create: { 
      id: crypto.randomUUID(), 
      username: "superadmin", 
      password: pw, 
      name: "Head Coach Admin", 
      email: "admin@adorabbc.com", 
      role: "ADMIN" 
    },
  });

  // 2. HOMEBASES
  const hbPusat = await prisma.homebase.upsert({
    where: { name: "ADORA Gandul (Pusat)" },
    update: { description: "Home Court Cinere" },
    create: { 
      name: "ADORA Gandul (Pusat)", 
      address: "Jl. Raya Timur No. 2, Cinere, Depok", 
      phone: "6281296701301",
      description: "Home Court Cinere"
    },
  });

  const hbCibubur = await prisma.homebase.upsert({
    where: { name: "ADORA Cibubur" },
    update: { description: "GOR Cileungsi (Cabang Cibubur)" },
    create: { 
      name: "ADORA Cibubur", 
      address: "Pasir Angin, Kec. Cileungsi, Kab. Bogor", 
      phone: "6281770776888",
      description: "GOR Cileungsi (Cabang Cibubur)"
    },
  });

  // 3. CLUB SETTINGS
  const settings = [
    { key: "rapor_header_url", value: "/logo-adora-full.png" },
    { key: "rapor_coach_name", value: "Danuri Akbar" },
    { key: "rapor_ceo_name", value: "M. Arief, S.Ak" },
  ];
  for (const s of settings) {
    await prisma.clubSetting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }

  console.log("✓ Admin user (superadmin) berhasil di-seed.");
  console.log("✓ Lokasi Latihan (Homebases) berhasil di-seed.");
  console.log("✓ Pengaturan Klub (Club Settings) berhasil di-seed.");
  console.log("\n✨ SEEDING SELESAI (MODE MINIMALIS)! ✨");
}

main()
  .catch((e) => { 
    console.error(e); 
    process.exit(1); 
  })
  .finally(() => prisma.$disconnect());
