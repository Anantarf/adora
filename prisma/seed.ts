import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Midnight Jakarta (+07:00) helper
const jkt = (d: string) => new Date(`${d}T00:00:00+07:00`);

/**
 * METRIC_PROFILES: 
 * A: Score >= 80
 * B: Score >= 70
 * C: Score >= 60
 * D: Score < 60
 */
const METRIC_PROFILES = {
  A: { dribble: { inAndOut: 88, crossover: 9, vLeft: 8, vRight: 9, betweenLegsLeft: 8, betweenLegsRight: 8 }, passing: { chestPass: 9, bouncePass: 9, overheadPass: 8 }, layUp: 9, shooting: 8 },
  B: { dribble: { inAndOut: 75, crossover: 8, vLeft: 7, vRight: 8, betweenLegsLeft: 6, betweenLegsRight: 7 }, passing: { chestPass: 8, bouncePass: 8, overheadPass: 7 }, layUp: 8, shooting: 7 },
  C: { dribble: { inAndOut: 62, crossover: 6, vLeft: 6, vRight: 6, betweenLegsLeft: 5, betweenLegsRight: 5 }, passing: { chestPass: 6, bouncePass: 6, overheadPass: 6 }, layUp: 6, shooting: 5 },
  D: { dribble: { inAndOut: 45, crossover: 5, vLeft: 4, vRight: 4, betweenLegsLeft: 4, betweenLegsRight: 4 }, passing: { chestPass: 5, bouncePass: 5, overheadPass: 4 }, layUp: 4, shooting: 4 },
};

function genMetrics(targetGrade: "A" | "B" | "C" | "D", seed: number) {
  const profile = METRIC_PROFILES[targetGrade];
  const variate = (val: number, max: number) => {
    const offset = (Math.abs(seed * val + 21) % 3) - 1; // -1 to +1 to keep it tight to the grade
    return Math.max(0, Math.min(max, val + offset));
  };

  return {
    dribble: {
      inAndOut: Math.max(0, Math.min(99, profile.dribble.inAndOut + ((Math.abs(seed + 11) % 7) - 3))),
      crossover: variate(profile.dribble.crossover, 10),
      vLeft: variate(profile.dribble.vLeft, 10),
      vRight: variate(profile.dribble.vRight, 10),
      betweenLegsLeft: variate(profile.dribble.betweenLegsLeft, 10),
      betweenLegsRight: variate(profile.dribble.betweenLegsRight, 10),
    },
    passing: {
      chestPass: variate(profile.passing.chestPass, 10),
      bouncePass: variate(profile.passing.bouncePass, 10),
      overheadPass: variate(profile.passing.overheadPass, 10),
    },
    layUp: variate(profile.layUp, 10),
    shooting: variate(profile.shooting, 10),
    notes: targetGrade === "D" ? "Perlu perhatian ekstra pada koordinasi dasar." : (targetGrade === "C" ? "Menunjukkan potensi, namun perlu konsistensi." : ""),
  };
}

async function main() {
  console.log("🚀 Memulai proses seeding data ADORA BBC (Humanized & Balanced Grades)...\n");

  const pw = await bcrypt.hash("password", 10);

  // 1. USERS
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

  // 4. PLAYERS (Assigned Target Grades)
  const playerDefs = [
    { name: "Arka Gibran Wijaya", dob: "2016-05-12", gender: "male", group: "Adora Rookies (U-10)", parent: "indra_wijaya", grade: "A" },
    { name: "Keysha Putri", dob: "2017-02-20", gender: "female", group: "Adora Rookies (U-10)", parent: "maya_kusuma", grade: "C" }, // Grade C
    { name: "Bimo Sakti", dob: "2016-11-05", gender: "male", group: "Adora Rookies (U-10)", parent: "bambang_sutrisno", grade: "D" }, // Grade D
    { name: "Zahra Amira", dob: "2017-08-14", gender: "female", group: "Adora Rookies (U-10)", parent: "nina_herlina", grade: "B" },
    
    { name: "Dimas Pratama", dob: "2013-03-25", gender: "male", group: "Adora Rising Stars (U-13)", parent: "dedy_kurniawan", grade: "A" },
    { name: "Larasati Dewi", dob: "2013-09-10", gender: "female", group: "Adora Rising Stars (U-13)", parent: "santi_susanti", grade: "B" },
    { name: "Rayyan Al-Fatih", dob: "2014-01-30", gender: "male", group: "Adora Rising Stars (U-13)", parent: "fajar_ramadhan", grade: "A" },
    { name: "Nabila Syakieb", dob: "2013-06-15", gender: "female", group: "Adora Rising Stars (U-13)", parent: "dewi_fortuna", grade: "B" },

    { name: "Kevin Sanjaya", dob: "2010-02-14", gender: "male", group: "Adora Elite (U-16)", parent: "indra_wijaya", grade: "A" },
    { name: "Alya Rohali", dob: "2011-05-22", gender: "female", group: "Adora Elite (U-16)", parent: "maya_kusuma", grade: "A" },
    { name: "Galang Ramadhan", dob: "2010-12-01", gender: "male", group: "Adora Elite (U-16)", parent: "bambang_sutrisno", grade: "B" },

    { name: "Farel Prayoga", dob: "2014-07-07", gender: "male", group: "Adora Stars Cibubur (U-12)", parent: "dedy_kurniawan", grade: "B" },
    { name: "Tiara Andini", dob: "2015-01-18", gender: "female", group: "Adora Stars Cibubur (U-12)", parent: "santi_susanti", grade: "B" },
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

  // 5. PERIODS & STATS
  const period = await prisma.evaluationPeriod.upsert({
    where: { id: "period-2026" },
    update: { isActive: true },
    create: { id: "period-2026", name: "Musim Kompetisi 2026", startDate: jkt("2026-01-01"), endDate: jkt("2026-12-31"), isActive: true },
  });

  for (const p of playerDefs) {
    const playerId = players[p.name].id;
    const seed = playerId.charCodeAt(0);
    await prisma.statistic.upsert({
      where: { playerId_periodId: { playerId, periodId: period.id } },
      update: { metricsJson: genMetrics(p.grade as any, seed) },
      create: { playerId, periodId: period.id, date: new Date(), metricsJson: genMetrics(p.grade as any, seed), status: "Published" },
    });
  }

  // 6. CLUB SETTINGS (Kop Surat & Tanda Tangan)
  const settings = [
    { key: "rapor_header_url", value: "/logo-adora-full.png" },
    { key: "rapor_coach_name", value: "Danuri Akbar" },
    { key: "rapor_ceo_name", value: "M. Arief, S.Ak" },
    // Untuk TTD, karena file aslinya mungkin belum ada di path /public, 
    // kita biarkan kosong atau berikan path default jika file tersedia.
    // { key: "rapor_ceo_sign_url", value: "/images/signatures/ceo-sign.png" },
    // { key: "rapor_coach_sign_url", value: "/images/signatures/coach-sign.png" },
    // { key: "rapor_stamp_url", value: "/images/signatures/stamp.png" },
  ];

  for (const s of settings) {
    await prisma.clubSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  console.log("✓ Berhasil mengonfigurasi Pengaturan Klub (Kop Surat & Nama Penandatangan).");
  console.log("✓ Berhasil menerbitkan statistik dengan variasi nilai A, B (mayoritas), C (1 orang), D (1 orang).");
  console.log("\n✨ SEEDING SELESAI! ✨");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
