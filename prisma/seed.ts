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
 * A: Score >= 80 (Excellent)
 * B: Score >= 70 (Good)
 * C: Score >= 60 (Average)
 * D: Score < 60  (Needs Improvement)
 */
const METRIC_PROFILES = {
  A: { dribble: { inAndOut: 85, crossover: 9, vLeft: 8, vRight: 9, btlLeft: 8, btlRight: 8 }, passing: { chest: 9, bounce: 8, overhead: 8 }, layUp: 9, shooting: 8 },
  B: { dribble: { inAndOut: 72, crossover: 7, vLeft: 7, vRight: 7, btlLeft: 6, btlRight: 6 }, passing: { chest: 7, bounce: 7, overhead: 7 }, layUp: 7, shooting: 7 },
  C: { dribble: { inAndOut: 60, crossover: 6, vLeft: 5, vRight: 5, btlLeft: 5, btlRight: 5 }, passing: { chest: 6, bounce: 5, overhead: 5 }, layUp: 6, shooting: 5 },
  D: { dribble: { inAndOut: 40, crossover: 4, vLeft: 4, vRight: 4, btlLeft: 3, btlRight: 3 }, passing: { chest: 4, bounce: 4, overhead: 4 }, layUp: 4, shooting: 3 },
};

function genMetrics(grade: keyof typeof METRIC_PROFILES, seed: number) {
  const p = METRIC_PROFILES[grade];
  const v = (val: number, max: number) => {
    const shift = (Math.abs(seed * val + 7) % 3) - 1; // -1, 0, or 1
    return Math.max(0, Math.min(max, val + shift));
  };

  return {
    dribble: {
      inAndOut: Math.max(0, Math.min(99, p.dribble.inAndOut + ((seed % 10) - 5))),
      crossover: v(p.dribble.crossover, 10),
      vLeft: v(p.dribble.vLeft, 10),
      vRight: v(p.dribble.vRight, 10),
      betweenLegsLeft: v(p.dribble.btlLeft, 10),
      betweenLegsRight: v(p.dribble.btlRight, 10),
    },
    passing: {
      chestPass: v(p.passing.chest, 10),
      bouncePass: v(p.passing.bounce, 10),
      overheadPass: v(p.passing.overhead, 10),
    },
    layUp: v(p.layUp, 10),
    shooting: v(p.shooting, 10),
    notes: grade === "A" ? "Performa luar biasa, terus pertahankan disiplin berlatih." :
           grade === "B" ? "Stabilitas bermain sudah baik, fokus pada teknik finishing." :
           grade === "C" ? "Fundamental sudah ada, perlu meningkatkan intensitas latihan fisik." :
                           "Perlu bimbingan khusus pada koordinasi dasar dribble.",
  };
}

async function main() {
  console.log("🚀 Memulai proses seeding data ADORA BBC (Humanized & Varied Penilaian)...\n");

  const pw = await bcrypt.hash("password", 10);

  // 1. CLEANUP (Optional - only if we want a fresh start for these specific models)
  // await prisma.statistic.deleteMany();
  // await prisma.registration.deleteMany();

  // 2. USERS
  await prisma.user.upsert({
    where: { username: "superadmin" },
    update: { password: pw },
    create: { id: crypto.randomUUID(), username: "superadmin", password: pw, name: "Head Coach Admin", email: "admin@adorabbc.com", role: "ADMIN" },
  });

  const parentData = [
    { username: "indra_wijaya", name: "Dr. Indra Wijaya" },
    { username: "maya_kusuma", name: "Maya Kusuma, M.Pd" },
    { username: "bambang_sutrisno", name: "Bambang Sutrisno" },
    { username: "dedy_kurniawan", name: "Dedy Kurniawan" },
  ];

  const parents: Record<string, { id: string }> = {};
  for (const p of parentData) {
    parents[p.username] = await prisma.user.upsert({
      where: { username: p.username },
      update: {},
      create: { id: crypto.randomUUID(), username: p.username, name: p.name, password: pw, role: "PARENT" },
    });
  }

  // 3. HOMEBASES & GROUPS
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

  const groupDefs = [
    { name: "Adora Rookies (U-10)", hb: hbPusat.id },
    { name: "Adora Rising Stars (U-13)", hb: hbPusat.id },
    { name: "Adora Elite (U-16)", hb: hbPusat.id },
    { name: "Adora Cibubur (U-12)", hb: hbCibubur.id },
  ];

  const groups: Record<string, { id: string }> = {};
  for (const g of groupDefs) {
    groups[g.name] = await prisma.group.upsert({
      where: { name: g.name },
      update: {},
      create: { name: g.name, homebaseId: g.hb },
    });
  }

  // 4. PLAYERS
  const playerDefs = [
    { name: "Arka Gibran", group: "Adora Rookies (U-10)", parent: "indra_wijaya", grade: "A" as const },
    { name: "Keysha Putri", group: "Adora Rookies (U-10)", parent: "maya_kusuma", grade: "B" as const },
    { name: "Bimo Sakti", group: "Adora Rookies (U-10)", parent: "bambang_sutrisno", grade: "C" as const },
    { name: "Dimas Pratama", group: "Adora Rising Stars (U-13)", parent: "dedy_kurniawan", grade: "A" as const },
    { name: "Larasati Dewi", group: "Adora Rising Stars (U-13)", parent: "maya_kusuma", grade: "B" as const },
    { name: "Kevin Sanjaya", group: "Adora Elite (U-16)", parent: "indra_wijaya", grade: "A" as const },
    { name: "Galang Ramadhan", group: "Adora Elite (U-16)", parent: "bambang_sutrisno", grade: "D" as const }, // Variation D
    { name: "Farel Hardiansyah", group: "Adora Cibubur (U-12)", parent: "maya_kusuma", grade: "B" as const },
  ];

  const players: Record<string, { id: string }> = {};
  for (const p of playerDefs) {
    const groupId = groups[p.group].id;
    players[p.name] = await prisma.player.upsert({
      where: { name_dateOfBirth_groupId: { name: p.name, dateOfBirth: jkt("2015-01-01"), groupId } },
      update: {},
      create: { name: p.name, dateOfBirth: jkt("2015-01-01"), groupId, parentId: parents[p.parent].id },
    });
  }

  // 5. PENILAIAN (Statistics) - THE CORE REQUEST
  const period = await prisma.evaluationPeriod.upsert({
    where: { id: "period-2026-s1" },
    update: { isActive: true },
    create: { id: "period-2026-s1", name: "Semester 1 - 2026", startDate: jkt("2026-01-01"), endDate: jkt("2026-06-30"), isActive: true },
  });

  for (const p of playerDefs) {
    const playerId = players[p.name].id;
    const seedNum = playerId.length + p.name.length;
    await prisma.statistic.upsert({
      where: { playerId_periodId: { playerId, periodId: period.id } },
      update: { metricsJson: genMetrics(p.grade, seedNum), status: "Published" },
      create: { playerId, periodId: period.id, date: new Date(), metricsJson: genMetrics(p.grade, seedNum), status: "Published" },
    });
  }

  // 6. REGISTRATIONS (Clean & Fresh)
  const regNames = ["Rizky", "Siti", "Budi", "Ani", "Eko", "Dina", "Guntur", "Hani", "Iwan", "Joko"];
  for (let i = 0; i < regNames.length; i++) {
    await prisma.registration.upsert({
      where: { id: `reg-seed-${i}` },
      update: {},
      create: {
        id: `reg-seed-${i}`,
        playerName: `${regNames[i]} New Member`,
        phone: `0812000000${i}`,
        ageGroup: i % 2 === 0 ? "U-10" : "U-13",
        homebaseId: hbPusat.id,
        status: "PENDING",
      },
    });
  }

  // 7. CLUB SETTINGS
  const settings = [
    { key: "rapor_header_url", value: "/logo-adora-full.png" },
    { key: "rapor_coach_name", value: "Danuri Akbar" },
    { key: "rapor_ceo_name", value: "M. Arief, S.Ak" },
  ];
  for (const s of settings) {
    await prisma.clubSetting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }

  console.log("✓ Penilaian (Raport) berhasil di-seed ulang dengan variasi A, B, C, dan D.");
  console.log("✓ Data pendaftar (registrations) dipastikan bersih dan valid.");
  console.log("\n✨ SEEDING SELESAI! ✨");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
