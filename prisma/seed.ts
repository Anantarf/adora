import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Midnight Jakarta (+07:00) helper
const jkt = (d: string) => new Date(`${d}T00:00:00+07:00`);

// Logic for generating realistic metric data
const METRIC_PROFILES = [
  { dribble: { inAndOut: 75, crossover: 8, vLeft: 7, vRight: 8, betweenLegsLeft: 6, betweenLegsRight: 7 }, passing: { chestPass: 8, bouncePass: 8, overheadPass: 7 }, layUp: 8, shooting: 7 },
  { dribble: { inAndOut: 88, crossover: 9, vLeft: 8, vRight: 9, betweenLegsLeft: 8, betweenLegsRight: 8 }, passing: { chestPass: 9, bouncePass: 9, overheadPass: 8 }, layUp: 9, shooting: 8 },
  { dribble: { inAndOut: 60, crossover: 6, vLeft: 5, vRight: 6, betweenLegsLeft: 5, betweenLegsRight: 5 }, passing: { chestPass: 7, bouncePass: 6, overheadPass: 6 }, layUp: 7, shooting: 6 },
  { dribble: { inAndOut: 45, crossover: 4, vLeft: 4, vRight: 5, betweenLegsLeft: 3, betweenLegsRight: 4 }, passing: { chestPass: 5, bouncePass: 5, overheadPass: 4 }, layUp: 5, shooting: 4 },
];

function genMetrics(seed: number) {
  const profile = METRIC_PROFILES[Math.abs(seed) % METRIC_PROFILES.length];
  const variate = (val: number, max: number) => {
    const offset = (Math.abs(seed * val + 21) % 5) - 2; // -2 to +2
    return Math.max(0, Math.min(max, val + offset));
  };

  return {
    dribble: {
      inAndOut: Math.max(0, Math.min(99, profile.dribble.inAndOut + ((Math.abs(seed + 11) % 11) - 5))),
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
    notes: seed % 3 === 0 ? "Menunjukkan peningkatan pada koordinasi tangan kiri." : "",
  };
}

async function main() {
  console.log("🚀 Memulai proses seeding data ADORA BBC (Humanized Edition)...\n");

  const pw = await bcrypt.hash("password", 10);

  // 1. USERS (Admin & Diverse Parents)
  const admin = await prisma.user.upsert({
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
  console.log(`✓ Berhasil membuat ${1 + parentData.length} akun pengguna.`);

  // 2. HOMEBASES (With inviting descriptions)
  const hbPusat = await prisma.homebase.upsert({
    where: { name: "ADORA Gandul (Pusat)" },
    update: {
      address: "Jl. Raya Timur No. 2, Pangkalan Jati, Kec. Cinere, Kota Depok",
      phone: "6281296701301",
      description: "Pusat pelatihan utama dengan fasilitas lapangan indoor standar kompetisi. Fokus pada pengembangan teknik dasar dan mental juara.",
    },
    create: {
      name: "ADORA Gandul (Pusat)",
      address: "Jl. Raya Timur No. 2, Pangkalan Jati, Kec. Cinere, Kota Depok",
      phone: "6281296701301",
      description: "Pusat pelatihan utama dengan fasilitas lapangan indoor standar kompetisi. Fokus pada pengembangan teknik dasar dan mental juara.",
    },
  });

  const hbCibubur = await prisma.homebase.upsert({
    where: { name: "ADORA Cibubur" },
    update: {
      address: "Limus Nunggal, Kec. Cileungsi, Kabupaten Bogor",
      phone: "6281770776888",
      description: "Cabang strategis dengan lingkungan latihan yang asri dan mendukung fokus pemain usia dini.",
    },
    create: {
      name: "ADORA Cibubur",
      address: "Limus Nunggal, Kec. Cileungsi, Kabupaten Bogor",
      phone: "6281770776888",
      description: "Cabang strategis dengan lingkungan latihan yang asri dan mendukung fokus pemain usia dini.",
    },
  });
  console.log("✓ Berhasil menyiapkan 2 lokasi Homebase.");

  // 3. GROUPS (Aspirational Names)
  const groupDefs = [
    { name: "Adora Rookies (U-10)", homebaseId: hbPusat.id, description: "Pengenalan basket dasar untuk usia 7-10 tahun dengan metode 'Fun Learning'." },
    { name: "Adora Rising Stars (U-13)", homebaseId: hbPusat.id, description: "Pengembangan teknik individu dan kerjasama tim untuk usia 11-13 tahun." },
    { name: "Adora Elite (U-16)", homebaseId: hbPusat.id, description: "Persiapan kompetisi tingkat lanjut dan taktik pertandingan untuk usia 14-16 tahun." },
    { name: "Adora Stars Cibubur (U-12)", homebaseId: hbCibubur.id, description: "Program gabungan teknik dasar dan menengah untuk area Cibubur." },
  ];

  const groups: Record<string, { id: string }> = {};
  for (const g of groupDefs) {
    groups[g.name] = await prisma.group.upsert({
      where: { name: g.name },
      update: { description: g.description },
      create: g,
    });
  }
  console.log("✓ Berhasil membuat 4 kelompok latihan aspirasional.");

  // 4. PLAYERS (Detailed & Humanized)
  const playerDefs = [
    // Rookies (U-10)
    { name: "Arka Gibran Wijaya", dob: "2016-05-12", gender: "male", group: "Adora Rookies (U-10)", parent: "indra_wijaya", school: "SD Al-Azhar 1", weight: "32", height: "135", pob: "Jakarta" },
    { name: "Keysha Putri", dob: "2017-02-20", gender: "female", group: "Adora Rookies (U-10)", parent: "maya_kusuma", school: "SDN 01 Depok", weight: "28", height: "130", pob: "Depok" },
    { name: "Bimo Sakti", dob: "2016-11-05", gender: "male", group: "Adora Rookies (U-10)", parent: "bambang_sutrisno", school: "SD Global Islamic", weight: "35", height: "140", pob: "Jakarta" },
    { name: "Zahra Amira", dob: "2017-08-14", gender: "female", group: "Adora Rookies (U-10)", parent: "nina_herlina", school: "SD Cikal", weight: "26", height: "128", pob: "Bandung" },
    
    // Rising Stars (U-13)
    { name: "Dimas Pratama", dob: "2013-03-25", gender: "male", group: "Adora Rising Stars (U-13)", parent: "dedy_kurniawan", school: "SMPN 19 Jakarta", weight: "45", height: "155", pob: "Jakarta" },
    { name: "Larasati Dewi", dob: "2013-09-10", gender: "female", group: "Adora Rising Stars (U-13)", parent: "santi_susanti", school: "SMP Labschool", weight: "42", height: "152", pob: "Depok" },
    { name: "Rayyan Al-Fatih", dob: "2014-01-30", gender: "male", group: "Adora Rising Stars (U-13)", parent: "fajar_ramadhan", school: "SMP Al-Ikhlas", weight: "48", height: "160", pob: "Jakarta" },
    { name: "Nabila Syakieb", dob: "2013-06-15", gender: "female", group: "Adora Rising Stars (U-13)", parent: "dewi_fortuna", school: "SMPN 1 Depok", weight: "40", height: "150", pob: "Bekasi" },

    // Elite (U-16)
    { name: "Kevin Sanjaya", dob: "2010-02-14", gender: "male", group: "Adora Elite (U-16)", parent: "indra_wijaya", school: "SMAN 8 Jakarta", weight: "62", height: "178", pob: "Surabaya" },
    { name: "Alya Rohali", dob: "2011-05-22", gender: "female", group: "Adora Elite (U-16)", parent: "maya_kusuma", school: "SMA Tarakanita", weight: "55", height: "168", pob: "Jakarta" },
    { name: "Galang Ramadhan", dob: "2010-12-01", gender: "male", group: "Adora Elite (U-16)", parent: "bambang_sutrisno", school: "SMAN 70 Jakarta", weight: "68", height: "182", pob: "Depok" },

    // Cibubur (U-12)
    { name: "Farel Prayoga", dob: "2014-07-07", gender: "male", group: "Adora Stars Cibubur (U-12)", parent: "dedy_kurniawan", school: "SDN Cibubur 03", weight: "38", height: "145", pob: "Bogor" },
    { name: "Tiara Andini", dob: "2015-01-18", gender: "female", group: "Adora Stars Cibubur (U-12)", parent: "santi_susanti", school: "SD Madania", weight: "36", height: "142", pob: "Jakarta" },
  ];

  const players: Record<string, { id: string }> = {};
  for (const p of playerDefs) {
    const groupId = groups[p.group].id;
    const parentId = parents[p.parent].id;
    const hbId = p.group.includes("Cibubur") ? hbCibubur.id : hbPusat.id;
    players[p.name] = await prisma.player.upsert({
      where: { name_dateOfBirth_groupId: { name: p.name, dateOfBirth: jkt(p.dob), groupId } },
      update: { weight: p.weight, height: p.height, placeOfBirth: p.pob },
      create: {
        name: p.name,
        dateOfBirth: jkt(p.dob),
        gender: p.gender,
        schoolOrigin: p.school,
        weight: p.weight,
        height: p.height,
        placeOfBirth: p.pob,
        groupId,
        parentId,
        preferredHomebaseId: hbId,
      },
    });
  }
  console.log(`✓ Berhasil mendaftarkan ${playerDefs.length} pemain dengan data fisik lengkap.`);

  // 5. EVENTS (Varied & Engaging)
  const eventDefs = [
    { id: "ev-01", title: "Latihan Rutin: Fokus Shooting & Layup", type: "LATIHAN", date: "2026-05-20", location: "Indoor Court Gandul", hbId: hbPusat.id, targets: ["Adora Rookies (U-10)", "Adora Rising Stars (U-13)"] },
    { id: "ev-02", title: "Sparing Friendly: Adora vs Tiger Academy", type: "SPARING", date: "2026-05-25", location: "GOR Depok", hbId: hbPusat.id, targets: ["Adora Elite (U-16)"] },
    { id: "ev-03", title: "Family Day & Fun Match 2026", type: "KHUSUS", date: "2026-06-05", location: "Lapangan Utama Gandul", hbId: hbPusat.id, targets: ["Adora Rookies (U-10)", "Adora Rising Stars (U-13)", "Adora Elite (U-16)", "Adora Stars Cibubur (U-12)"] },
    { id: "ev-04", title: "Workshop Nutrisi Atlet Muda", type: "KHUSUS", date: "2026-06-12", location: "Ruang Teater Adora", hbId: hbPusat.id, targets: ["Adora Rising Stars (U-13)", "Adora Elite (U-16)"] },
    { id: "ev-05", title: "Evaluasi Semester Ganjil", type: "EVALUASI", date: "2026-06-20", location: "Masing-masing Homebase", hbId: hbPusat.id, targets: ["Adora Rookies (U-10)", "Adora Rising Stars (U-13)", "Adora Elite (U-16)", "Adora Stars Cibubur (U-12)"] },
  ];

  for (const ev of eventDefs) {
    const created = await prisma.event.upsert({
      where: { id: ev.id },
      update: {},
      create: { id: ev.id, title: ev.title, type: ev.type as any, date: jkt(ev.date), location: ev.location, homebaseId: ev.hbId },
    });
    for (const gName of ev.targets) {
      await prisma.eventGroup.upsert({
        where: { eventId_groupId: { eventId: created.id, groupId: groups[gName].id } },
        update: {},
        create: { eventId: created.id, groupId: groups[gName].id },
      });
    }
  }
  console.log("✓ Berhasil menjadwalkan 5 event variatif (Latihan, Sparing, Family Day, dll).");

  // 6. PERIODS & STATS
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
      update: { metricsJson: genMetrics(seed) },
      create: { playerId, periodId: period.id, date: new Date(), metricsJson: genMetrics(seed), status: "Published" },
    });
  }
  console.log("✓ Berhasil menerbitkan statistik performa untuk seluruh pemain.");

  console.log("\n✨ SEEDING SELESAI DENGAN SUKSES! ✨");
  console.log("Gunakan 'superadmin' / 'password' untuk akses penuh.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
