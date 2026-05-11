import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Midnight Jakarta (+07:00) helper
const jkt = (d: string) => new Date(`${d}T00:00:00+07:00`);

async function main() {
  console.log("🚀 Memulai proses seeding data ADORA BBC (Operational Focus)...\n");

  const pw = await bcrypt.hash("password", 10);

  // 1. USERS (Admin & Parents)
  await prisma.user.upsert({
    where: { username: "superadmin" },
    update: { password: pw },
    create: { id: crypto.randomUUID(), username: "superadmin", password: pw, name: "Head Coach Admin", email: "admin@adora.club", role: "ADMIN" },
  });

  const parentData = [
    { username: "indra_wijaya", name: "Dr. Indra Wijaya", email: "dr.indra@outlook.com" },
    { username: "maya_kusuma", name: "Maya Kusuma, M.Pd", email: "maya.kusuma@gmail.com" },
    { username: "bambang_sutrisno", name: "Bambang Sutrisno", email: "bambang_s@perusahaan.co.id" },
    { username: "nina_herlina", name: "Nina Herlina", email: "nina.herlina@yahoo.com" },
    { username: "dedy_kurniawan", name: "Dedy Kurniawan", email: "dedy.k@techindo.com" },
    { username: "santi_susanti", name: "Santi Susanti", email: "santi.susanti@gmail.com" },
    { username: "fajar_ramadhan", name: "Fajar Ramadhan", email: "fajar.ram@gmail.com" },
    { username: "dewi_fortuna", name: "Dewi Fortuna", email: "dewi.fortuna@gmail.com" },
  ];

  const parents: Record<string, { id: string }> = {};
  for (const p of parentData) {
    parents[p.username] = await prisma.user.upsert({
      where: { username: p.username },
      update: {},
      create: { id: crypto.randomUUID(), username: p.username, name: p.name, email: p.email, password: pw, role: "PARENT" },
    });
  }

  // 2. HOMEBASES
  const hbPusat = await prisma.homebase.upsert({
    where: { name: "ADORA Gandul (Pusat)" },
    update: {},
    create: {
      name: "ADORA Gandul (Pusat)",
      address: "Jl. Raya Timur No. 2, Pangkalan Jati, Kec. Cinere, Kota Depok",
      phone: "6281296701301",
      description: "Pusat pelatihan utama dengan fasilitas lapangan indoor standar kompetisi.",
    },
  });

  const hbCibubur = await prisma.homebase.upsert({
    where: { name: "ADORA Cibubur" },
    update: {},
    create: {
      name: "ADORA Cibubur",
      address: "Limus Nunggal, Kec. Cileungsi, Kabupaten Bogor",
      phone: "6281770776888",
      description: "Cabang strategis dengan lingkungan latihan yang asri.",
    },
  });

  // 3. GROUPS
  const groupDefs = [
    { name: "Adora Rookies (U-10)", homebaseId: hbPusat.id, description: "Pengenalan basket dasar." },
    { name: "Adora Rising Stars (U-13)", homebaseId: hbPusat.id, description: "Pengembangan teknik individu." },
    { name: "Adora Elite (U-16)", homebaseId: hbPusat.id, description: "Persiapan kompetisi tingkat lanjut." },
    { name: "Adora Stars Cibubur (U-12)", homebaseId: hbCibubur.id, description: "Program gabungan Cibubur." },
  ];

  const groups: Record<string, { id: string }> = {};
  for (const g of groupDefs) {
    groups[g.name] = await prisma.group.upsert({
      where: { name: g.name },
      update: {},
      create: g,
    });
  }

  // 4. PLAYERS
  const playerDefs = [
    { name: "Arka Gibran Wijaya", dob: "2016-05-12", gender: "male", group: "Adora Rookies (U-10)", parent: "indra_wijaya" },
    { name: "Keysha Putri", dob: "2017-02-20", gender: "female", group: "Adora Rookies (U-10)", parent: "maya_kusuma" },
    { name: "Bimo Sakti", dob: "2016-11-05", gender: "male", group: "Adora Rookies (U-10)", parent: "bambang_sutrisno" },
    { name: "Zahra Amira", dob: "2017-08-14", gender: "female", group: "Adora Rookies (U-10)", parent: "nina_herlina" },
    { name: "Dimas Pratama", dob: "2013-03-25", gender: "male", group: "Adora Rising Stars (U-13)", parent: "dedy_kurniawan" },
    { name: "Larasati Dewi", dob: "2013-09-10", gender: "female", group: "Adora Rising Stars (U-13)", parent: "santi_susanti" },
    { name: "Rayyan Al-Fatih", dob: "2014-01-30", gender: "male", group: "Adora Rising Stars (U-13)", parent: "fajar_ramadhan" },
    { name: "Nabila Syakieb", dob: "2013-06-15", gender: "female", group: "Adora Rising Stars (U-13)", parent: "dewi_fortuna" },
    { name: "Kevin Sanjaya", dob: "2010-02-14", gender: "male", group: "Adora Elite (U-16)", parent: "indra_wijaya" },
    { name: "Alya Rohali", dob: "2011-05-22", gender: "female", group: "Adora Elite (U-16)", parent: "maya_kusuma" },
    { name: "Galang Ramadhan", dob: "2010-12-01", gender: "male", group: "Adora Elite (U-16)", parent: "bambang_sutrisno" },
    { name: "Farel Prayoga", dob: "2014-07-07", gender: "male", group: "Adora Stars Cibubur (U-12)", parent: "dedy_kurniawan" },
    { name: "Tiara Andini", dob: "2015-01-18", gender: "female", group: "Adora Stars Cibubur (U-12)", parent: "santi_susanti" },
  ];

  const players: Record<string, { id: string }> = {};
  for (const p of playerDefs) {
    const groupId = groups[p.group].id;
    players[p.name] = await prisma.player.upsert({
      where: { name_dateOfBirth_groupId: { name: p.name, dateOfBirth: jkt(p.dob), groupId } },
      update: {},
      create: {
        name: p.name,
        dateOfBirth: jkt(p.dob),
        gender: p.gender,
        groupId,
        parentId: parents[p.parent].id,
        preferredHomebaseId: p.group.includes("Cibubur") ? hbCibubur.id : hbPusat.id,
      },
    });
  }

  // 5. ATTENDANCE (Middle Quality: ~75% Present)
  const eventDates = ["2026-05-01", "2026-05-04", "2026-05-08", "2026-05-11"];
  for (const dateStr of eventDates) {
    const date = jkt(dateStr);
    for (const pName in players) {
      const playerId = players[pName].id;
      // Deterministic but varied attendance
      const hash = (playerId.charCodeAt(0) + date.getDate()) % 100;
      let status: "HADIR" | "IZIN" | "ALPA" = "HADIR";
      if (hash > 85) status = "ALPA";
      else if (hash > 70) status = "IZIN";

      await prisma.attendance.upsert({
        where: { playerId_date: { playerId, date } },
        update: { status },
        create: { playerId, date, status },
      });
    }
  }

  // 6. REGISTRATIONS (10 New Applicants)
  const regDefs = [
    { name: "Rizky Ramadhan", phone: "08121111001", ageGroup: "U-10", hb: hbPusat.id },
    { name: "Siti Aminah", phone: "08122222002", ageGroup: "U-10", hb: hbPusat.id },
    { name: "Budi Cahyono", phone: "08123333003", ageGroup: "U-12", hb: hbCibubur.id },
    { name: "Ani Maryani", phone: "08124444004", ageGroup: "U-13", hb: hbPusat.id },
    { name: "Eko Prasetyo", phone: "08125555005", ageGroup: "U-16", hb: hbPusat.id },
    { name: "Dina Larasati", phone: "08126666006", ageGroup: "U-12", hb: hbCibubur.id },
    { name: "Guntur Wibowo", phone: "08127777007", ageGroup: "U-10", hb: hbPusat.id },
    { name: "Hani Fitriani", phone: "08128888008", ageGroup: "U-13", hb: hbPusat.id },
    { name: "Iwan Setiawan", phone: "08129999009", ageGroup: "U-16", hb: hbPusat.id },
    { name: "Joko Susilo", phone: "08120000010", ageGroup: "U-12", hb: hbCibubur.id },
  ];

  for (const r of regDefs) {
    await prisma.registration.create({
      data: {
        playerName: r.name,
        phone: r.phone,
        email: `${r.name.toLowerCase().replace(/\s/g, ".")}@example.com`,
        ageGroup: r.ageGroup,
        homebaseId: r.hb,
        status: "PENDING",
      },
    });
  }

  // 7. CLUB SETTINGS (Keep the settings for PDF header/footer)
  const settings = [
    { key: "rapor_header_url", value: "/logo-adora-full.png" },
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

  console.log("✓ Kehadiran diset dengan kualitas menengah (~75% hadir).");
  console.log("✓ Berhasil menambahkan 10 pendaftar baru.");
  console.log("✓ Seed raport/statistik dihilangkan sesuai permintaan.");
  console.log("\n✨ SEEDING SELESAI! ✨");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
