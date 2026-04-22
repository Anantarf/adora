import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcrypt";
import crypto from "crypto";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// Midnight Jakarta (+07:00)
const jkt = (d: string) => new Date(`${d}T00:00:00+07:00`);

// inAndOut: 0–99  |  all others: 0–10
const METRIC_PROFILES = [
  { dribble: { inAndOut: 72, crossover: 7, vLeft: 6, vRight: 7, betweenLegsLeft: 6, betweenLegsRight: 6 }, passing: { chestPass: 8, bouncePass: 7, overheadPass: 7 }, layUp: 7, shooting: 7 },
  { dribble: { inAndOut: 85, crossover: 8, vLeft: 8, vRight: 8, betweenLegsLeft: 7, betweenLegsRight: 7 }, passing: { chestPass: 9, bouncePass: 8, overheadPass: 8 }, layUp: 8, shooting: 8 },
  { dribble: { inAndOut: 55, crossover: 5, vLeft: 5, vRight: 5, betweenLegsLeft: 4, betweenLegsRight: 4 }, passing: { chestPass: 6, bouncePass: 6, overheadPass: 5 }, layUp: 6, shooting: 5 },
  { dribble: { inAndOut: 92, crossover: 9, vLeft: 9, vRight: 9, betweenLegsLeft: 8, betweenLegsRight: 8 }, passing: { chestPass: 9, bouncePass: 9, overheadPass: 9 }, layUp: 9, shooting: 9 },
  { dribble: { inAndOut: 78, crossover: 7, vLeft: 7, vRight: 7, betweenLegsLeft: 6, betweenLegsRight: 6 }, passing: { chestPass: 8, bouncePass: 7, overheadPass: 7 }, layUp: 8, shooting: 7 },
  { dribble: { inAndOut: 40, crossover: 4, vLeft: 4, vRight: 4, betweenLegsLeft: 3, betweenLegsRight: 3 }, passing: { chestPass: 5, bouncePass: 4, overheadPass: 4 }, layUp: 4, shooting: 4 },
];

function genMetrics(seed: number) {
  return JSON.stringify({ ...METRIC_PROFILES[Math.abs(seed) % METRIC_PROFILES.length], notes: "" });
}

function attendance(seed: number): "HADIR" | "IZIN" | "SAKIT" | "ALPA" {
  const r = Math.abs(seed * 3571 + 7) % 100;
  if (r < 82) return "HADIR";
  if (r < 90) return "IZIN";
  if (r < 96) return "SAKIT";
  return "ALPA";
}

async function main() {
  console.log("🌱 Memulai seeding data ADORA Basketball...\n");

  // ─── USERS ────────────────────────────────────────────────────────────────
  const pw = await bcrypt.hash("password", 10);

  const admin = await prisma.user.upsert({
    where: { username: "superadmin" },
    update: { password: pw },
    create: { id: crypto.randomUUID(), username: "superadmin", password: pw, name: "Super Administrator", email: "master@adora.club", role: "ADMIN" },
  });

  const parentData = [
    { username: "budi_santoso",   name: "Budi Santoso",   email: "budi@gmail.com" },
    { username: "siti_rahayu",    name: "Siti Rahayu",    email: "siti@gmail.com" },
    { username: "ahmad_fauzi",    name: "Ahmad Fauzi",    email: "ahmad@gmail.com" },
    { username: "dewi_lestari",   name: "Dewi Lestari",   email: "dewi@gmail.com" },
    { username: "rudi_hermawan",  name: "Rudi Hermawan",  email: "rudi@gmail.com" },
    { username: "maya_putri",     name: "Maya Putri",     email: "maya@gmail.com" },
    { username: "dian_pratama",   name: "Dian Pratama",   email: "dian@gmail.com" },
    { username: "eka_susanti",    name: "Eka Susanti",    email: "eka@gmail.com" },
  ];

  const parents: Record<string, { id: string }> = {};
  for (const p of parentData) {
    parents[p.username] = await prisma.user.upsert({
      where: { username: p.username },
      update: {},
      create: { id: crypto.randomUUID(), username: p.username, name: p.name, email: p.email, password: pw, role: "PARENT" },
    });
  }
  console.log(`✓ ${1 + parentData.length} akun pengguna`);

  // ─── HOMEBASES ────────────────────────────────────────────────────────────
  const hbPusat = await prisma.homebase.upsert({
    where: { name: "ADORA Pusat" },
    update: {},
    create: {
      name: "ADORA Pusat",
      address: "Jl. Ahmad Yani No. 15, Pulogadung, Jakarta Timur",
      phone: "021-4708800",
      description: "Markas utama ADORA Basketball Club. GOR berkapasitas 400 penonton dengan 2 lapangan penuh.",
    },
  });

  const hbSelatan = await prisma.homebase.upsert({
    where: { name: "ADORA Selatan" },
    update: {},
    create: {
      name: "ADORA Selatan",
      address: "Jl. Fatmawati Raya No. 22, Cilandak, Jakarta Selatan",
      phone: "021-7691234",
      description: "Cabang Jakarta Selatan. GOR indoor dengan kapasitas 200 penonton.",
    },
  });
  console.log("✓ 2 homebase");

  // ─── GROUPS ───────────────────────────────────────────────────────────────
  const groupDefs = [
    { name: "Under-10 Pusat",  homebaseId: hbPusat.id,   description: "Kelompok usia dini 8–10 tahun di Jakarta Timur." },
    { name: "Under-13 Pusat",  homebaseId: hbPusat.id,   description: "Kelompok usia muda 11–13 tahun di Jakarta Timur." },
    { name: "Under-16 Pusat",  homebaseId: hbPusat.id,   description: "Kelompok remaja 14–16 tahun di Jakarta Timur." },
    { name: "Under-12 Selatan",homebaseId: hbSelatan.id, description: "Kelompok usia 10–12 tahun di Jakarta Selatan." },
  ];

  const groups: Record<string, { id: string }> = {};
  for (const g of groupDefs) {
    groups[g.name] = await prisma.group.upsert({
      where: { name: g.name },
      update: {},
      create: g,
    });
  }
  console.log("✓ 4 kelompok latihan");

  // ─── PLAYERS ──────────────────────────────────────────────────────────────
  const playerDefs = [
    // Under-10 Pusat
    { name: "Rafif Arya Putra",    dob: "2016-03-15", gender: "male",   group: "Under-10 Pusat",  parent: "budi_santoso",  school: "SDN Jatinegara 01",  phone: "08111234567" },
    { name: "Naila Zahra Putri",   dob: "2016-07-22", gender: "female", group: "Under-10 Pusat",  parent: "siti_rahayu",   school: "SDN Klender 03",     phone: "08122345678" },
    { name: "Keanu Bima Sakti",    dob: "2017-01-10", gender: "male",   group: "Under-10 Pusat",  parent: null,            school: "SDN Cipinang 02",    phone: null },
    { name: "Siti Fatimah Azzahra",dob: "2016-11-05", gender: "female", group: "Under-10 Pusat",  parent: "maya_putri",    school: "SDN Rawamangun 01",  phone: "08134567890" },
    { name: "Daffa Rizky Nugroho", dob: "2017-04-18", gender: "male",   group: "Under-10 Pusat",  parent: null,            school: "SDN Jatinegara 05",  phone: null },
    { name: "Alisha Permata Sari", dob: "2016-09-30", gender: "female", group: "Under-10 Pusat",  parent: "eka_susanti",   school: "SDN Pulogadung 01",  phone: "08156789012" },

    // Under-13 Pusat
    { name: "Farhan Aditya",       dob: "2013-05-12", gender: "male",   group: "Under-13 Pusat",  parent: null,            school: "SMPN 19 Jakarta",    phone: "08198765432" },
    { name: "Zhafira Nur Aisyah",  dob: "2014-02-28", gender: "female", group: "Under-13 Pusat",  parent: "siti_rahayu",   school: "SMPN 44 Jakarta",    phone: "08187654321" },
    { name: "Rizky Pratama",       dob: "2013-09-17", gender: "male",   group: "Under-13 Pusat",  parent: "dian_pratama",  school: "SMPN 73 Jakarta",    phone: "08176543210" },
    { name: "Dara Anggraini",      dob: "2014-06-04", gender: "female", group: "Under-13 Pusat",  parent: null,            school: "SMPN 55 Jakarta",    phone: null },
    { name: "Andika Surya Putra",  dob: "2013-11-23", gender: "male",   group: "Under-13 Pusat",  parent: null,            school: "SMPN 49 Jakarta",    phone: null },
    { name: "Keisha Amanda",       dob: "2014-08-15", gender: "female", group: "Under-13 Pusat",  parent: "maya_putri",    school: "SMPN 103 Jakarta",   phone: "08165432109" },
    { name: "Bagas Trihandoko",    dob: "2013-07-03", gender: "male",   group: "Under-13 Pusat",  parent: null,            school: "SMPN 67 Jakarta",    phone: null },

    // Under-16 Pusat
    { name: "Rayhan Dinata",       dob: "2010-04-25", gender: "male",   group: "Under-16 Pusat",  parent: "ahmad_fauzi",   school: "SMAN 68 Jakarta",    phone: "08211234567" },
    { name: "Reva Maharani",       dob: "2011-01-19", gender: "female", group: "Under-16 Pusat",  parent: "dewi_lestari",  school: "SMAN 81 Jakarta",    phone: "08222345678" },
    { name: "Akbar Maulana",       dob: "2010-08-07", gender: "male",   group: "Under-16 Pusat",  parent: null,            school: "SMAN 14 Jakarta",    phone: null },
    { name: "Nadya Wulandari",     dob: "2011-05-31", gender: "female", group: "Under-16 Pusat",  parent: "eka_susanti",   school: "SMAN 39 Jakarta",    phone: "08244567890" },
    { name: "Gibran Kusuma",       dob: "2010-12-14", gender: "male",   group: "Under-16 Pusat",  parent: null,            school: "SMAN 32 Jakarta",    phone: null },
    { name: "Intan Purnama Sari",  dob: "2011-03-22", gender: "female", group: "Under-16 Pusat",  parent: "dewi_lestari",  school: "SMAN 26 Jakarta",    phone: "08266789012" },

    // Under-12 Selatan
    { name: "Farel Hardiansyah",   dob: "2014-06-18", gender: "male",   group: "Under-12 Selatan",parent: "rudi_hermawan", school: "SDN Cilandak 01",    phone: "08277890123" },
    { name: "Calista Dewi Putri",  dob: "2014-10-03", gender: "female", group: "Under-12 Selatan",parent: null,            school: "SDN Lebak Bulus 02", phone: null },
    { name: "Yoga Pratama",        dob: "2015-02-14", gender: "male",   group: "Under-12 Selatan",parent: "budi_santoso",  school: "SDN Cipete 03",      phone: "08299012345" },
    { name: "Shafira Nurfadila",   dob: "2014-08-27", gender: "female", group: "Under-12 Selatan",parent: "maya_putri",    school: "SDN Fatmawati 01",   phone: "08210123456" },
    { name: "Bintang Ramadhan",    dob: "2015-04-09", gender: "male",   group: "Under-12 Selatan",parent: null,            school: "SDN Pondok Labu 02", phone: null },
  ];

  const players: Record<string, { id: string }> = {};
  for (const p of playerDefs) {
    const groupId = groups[p.group].id;
    const parentId = p.parent ? parents[p.parent].id : null;
    const hbId = p.group.includes("Selatan") ? hbSelatan.id : hbPusat.id;
    const existing = await prisma.player.findFirst({
      where: { name: p.name, dateOfBirth: jkt(p.dob), groupId },
    });
    if (existing) {
      players[p.name] = existing;
    } else {
      players[p.name] = await prisma.player.create({
        data: {
          name: p.name,
          dateOfBirth: jkt(p.dob),
          gender: p.gender,
          schoolOrigin: p.school,
          phoneNumber: p.phone ?? undefined,
          groupId,
          parentId: parentId ?? undefined,
          preferred_homebaseId: hbId,
          isDeleted: false,
        },
      });
    }
  }
  console.log(`✓ ${playerDefs.length} pemain`);

  // ─── EVALUATION PERIODS ───────────────────────────────────────────────────
  const period2025S1 = await prisma.evaluationPeriod.upsert({
    where: { id: "period-2025-s1" },
    update: {},
    create: { id: "period-2025-s1", name: "Semester 1 2025", startDate: jkt("2025-01-01"), endDate: jkt("2025-06-30"), isActive: false },
  });
  const period2025S2 = await prisma.evaluationPeriod.upsert({
    where: { id: "period-2025-s2" },
    update: {},
    create: { id: "period-2025-s2", name: "Semester 2 2025", startDate: jkt("2025-07-01"), endDate: jkt("2025-12-31"), isActive: false },
  });
  const period2026S1 = await prisma.evaluationPeriod.upsert({
    where: { id: "period-2026-s1" },
    update: { isActive: true },
    create: { id: "period-2026-s1", name: "Semester 1 2026", startDate: jkt("2026-01-01"), endDate: jkt("2026-06-30"), isActive: true },
  });
  console.log("✓ 3 periode evaluasi (aktif: Semester 1 2026)");

  // ─── EVENTS ───────────────────────────────────────────────────────────────
  // groupTargets: array of group names for EventGroup mapping
  type EventDef = { id: string; date: string; title: string; type: string; location: string; homebaseId: string; groupTargets: string[] };

  const ALL_PUSAT = ["Under-10 Pusat", "Under-13 Pusat", "Under-16 Pusat"];
  const ALL_SELATAN = ["Under-12 Selatan"];
  const ALL = [...ALL_PUSAT, ...ALL_SELATAN];

  const eventDefs: EventDef[] = [
    // Januari 2026
    { id: "ev-2026-01-04", date: "2026-01-04", title: "Latihan Rutin Pekan 1 Januari", type: "LATIHAN", location: "GOR ADORA Pusat", homebaseId: hbPusat.id, groupTargets: ALL_PUSAT },
    { id: "ev-2026-01-06", date: "2026-01-06", title: "Latihan Rutin Selatan Januari", type: "LATIHAN", location: "GOR ADORA Selatan", homebaseId: hbSelatan.id, groupTargets: ALL_SELATAN },
    { id: "ev-2026-01-11", date: "2026-01-11", title: "Latihan Rutin Pekan 2 Januari", type: "LATIHAN", location: "GOR ADORA Pusat", homebaseId: hbPusat.id, groupTargets: ALL_PUSAT },
    { id: "ev-2026-01-14", date: "2026-01-14", title: "Tes Evaluasi Awal Semester 1 2026", type: "EVALUASI", location: "GOR ADORA Pusat", homebaseId: hbPusat.id, groupTargets: ALL_PUSAT },
    { id: "ev-2026-01-18", date: "2026-01-18", title: "Latihan Rutin Pekan 3 Januari", type: "LATIHAN", location: "GOR ADORA Pusat", homebaseId: hbPusat.id, groupTargets: ALL_PUSAT },
    { id: "ev-2026-01-20", date: "2026-01-20", title: "Latihan Rutin Selatan Pekan 3", type: "LATIHAN", location: "GOR ADORA Selatan", homebaseId: hbSelatan.id, groupTargets: ALL_SELATAN },
    { id: "ev-2026-01-25", date: "2026-01-25", title: "Sparing vs SPARTA Basketball Academy", type: "SPARING", location: "GOR ADORA Pusat", homebaseId: hbPusat.id, groupTargets: ["Under-13 Pusat", "Under-16 Pusat"] },
    // Februari 2026
    { id: "ev-2026-02-01", date: "2026-02-01", title: "Latihan Rutin Pekan 1 Februari", type: "LATIHAN", location: "GOR ADORA Pusat", homebaseId: hbPusat.id, groupTargets: ALL_PUSAT },
    { id: "ev-2026-02-03", date: "2026-02-03", title: "Latihan Rutin Selatan Februari", type: "LATIHAN", location: "GOR ADORA Selatan", homebaseId: hbSelatan.id, groupTargets: ALL_SELATAN },
    { id: "ev-2026-02-08", date: "2026-02-08", title: "Latihan Rutin Pekan 2 Februari", type: "LATIHAN", location: "GOR ADORA Pusat", homebaseId: hbPusat.id, groupTargets: ALL_PUSAT },
    { id: "ev-2026-02-15", date: "2026-02-15", title: "Kejuaraan Basket Antar Akademi Jakarta 2026", type: "PERTANDINGAN", location: "GOR Cempaka Putih, Jakarta Pusat", homebaseId: hbPusat.id, groupTargets: ["Under-13 Pusat", "Under-16 Pusat"] },
    { id: "ev-2026-02-22", date: "2026-02-22", title: "Latihan Rutin Pekan 4 Februari", type: "LATIHAN", location: "GOR ADORA Pusat", homebaseId: hbPusat.id, groupTargets: ALL_PUSAT },
    { id: "ev-2026-02-24", date: "2026-02-24", title: "Latihan Gabungan Pusat & Selatan", type: "LATIHAN", location: "GOR ADORA Pusat", homebaseId: hbPusat.id, groupTargets: ALL },
    // Maret 2026
    { id: "ev-2026-03-01", date: "2026-03-01", title: "Latihan Rutin Pekan 1 Maret", type: "LATIHAN", location: "GOR ADORA Pusat", homebaseId: hbPusat.id, groupTargets: ALL_PUSAT },
    { id: "ev-2026-03-03", date: "2026-03-03", title: "Latihan Rutin Selatan Maret", type: "LATIHAN", location: "GOR ADORA Selatan", homebaseId: hbSelatan.id, groupTargets: ALL_SELATAN },
    { id: "ev-2026-03-08", date: "2026-03-08", title: "Sparing vs Bintang Timur Basketball", type: "SPARING", location: "GOR ADORA Pusat", homebaseId: hbPusat.id, groupTargets: ALL },
    { id: "ev-2026-03-15", date: "2026-03-15", title: "Latihan Rutin Pekan 3 Maret", type: "LATIHAN", location: "GOR ADORA Pusat", homebaseId: hbPusat.id, groupTargets: ALL_PUSAT },
    { id: "ev-2026-03-22", date: "2026-03-22", title: "Latihan Rutin Pekan 4 Maret", type: "LATIHAN", location: "GOR ADORA Pusat", homebaseId: hbPusat.id, groupTargets: ALL_PUSAT },
    { id: "ev-2026-03-24", date: "2026-03-24", title: "Latihan Teknik Selatan", type: "LATIHAN", location: "GOR ADORA Selatan", homebaseId: hbSelatan.id, groupTargets: ALL_SELATAN },
    { id: "ev-2026-03-29", date: "2026-03-29", title: "Latihan Rutin Pekan 5 Maret", type: "LATIHAN", location: "GOR ADORA Pusat", homebaseId: hbPusat.id, groupTargets: ALL_PUSAT },
    // April 2026 (sebagian sudah berlalu)
    { id: "ev-2026-04-05", date: "2026-04-05", title: "Latihan Rutin Pekan 1 April", type: "LATIHAN", location: "GOR ADORA Pusat", homebaseId: hbPusat.id, groupTargets: ALL_PUSAT },
    { id: "ev-2026-04-07", date: "2026-04-07", title: "Latihan Rutin Selatan April", type: "LATIHAN", location: "GOR ADORA Selatan", homebaseId: hbSelatan.id, groupTargets: ALL_SELATAN },
    { id: "ev-2026-04-12", date: "2026-04-12", title: "Sparing Selatan vs Akademi Cipete", type: "SPARING", location: "GOR ADORA Selatan", homebaseId: hbSelatan.id, groupTargets: ALL_SELATAN },
    { id: "ev-2026-04-19", date: "2026-04-19", title: "Latihan Rutin Pekan 3 April", type: "LATIHAN", location: "GOR ADORA Pusat", homebaseId: hbPusat.id, groupTargets: ALL_PUSAT },
    { id: "ev-2026-04-22", date: "2026-04-22", title: "Latihan Teknik & Fisik", type: "LATIHAN", location: "GOR ADORA Pusat", homebaseId: hbPusat.id, groupTargets: ALL_PUSAT },
    // Mendatang
    { id: "ev-2026-04-26", date: "2026-04-26", title: "Kejuaraan Open U-16 DKI Jakarta 2026", type: "PERTANDINGAN", location: "GOR Soemantri Brodjonegoro, Kuningan", homebaseId: hbPusat.id, groupTargets: ["Under-16 Pusat"] },
    { id: "ev-2026-05-03", date: "2026-05-03", title: "Latihan Rutin Pekan 1 Mei", type: "LATIHAN", location: "GOR ADORA Pusat", homebaseId: hbPusat.id, groupTargets: ALL_PUSAT },
    { id: "ev-2026-05-10", date: "2026-05-10", title: "Latihan Rutin Pekan 2 Mei", type: "LATIHAN", location: "GOR ADORA Pusat", homebaseId: hbPusat.id, groupTargets: ALL },
    { id: "ev-2026-05-17", date: "2026-05-17", title: "Sparing vs Generasi Emas Jakarta", type: "SPARING", location: "GOR ADORA Pusat", homebaseId: hbPusat.id, groupTargets: ALL_PUSAT },
  ];

  const eventIds: Record<string, string> = {};
  for (const ev of eventDefs) {
    const created = await prisma.event.upsert({
      where: { id: ev.id },
      update: {},
      create: { id: ev.id, title: ev.title, type: ev.type, date: jkt(ev.date), location: ev.location, homebaseId: ev.homebaseId },
    });
    eventIds[ev.id] = created.id;

    // EventGroup mapping
    for (const gName of ev.groupTargets) {
      const gId = groups[gName].id;
      await prisma.eventGroup.upsert({
        where: { eventId_groupId: { eventId: created.id, groupId: gId } },
        update: {},
        create: { eventId: created.id, groupId: gId },
      });
    }
  }
  console.log(`✓ ${eventDefs.length} event + EventGroup mapping`);

  // ─── ATTENDANCE ───────────────────────────────────────────────────────────
  // Hanya buat attendance untuk event yang sudah berlalu (≤ hari ini)
  const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
  const today = jkt(todayStr);
  const pastEvents = eventDefs.filter(ev => jkt(ev.date) <= today);

  let attendanceCount = 0;
  for (const ev of pastEvents) {
    const evDate = jkt(ev.date);
    for (const gName of ev.groupTargets) {
      const groupPlayers = playerDefs.filter(p => p.group === gName);
      for (const p of groupPlayers) {
        const playerId = players[p.name].id;
        const seed = playerId.charCodeAt(0) + ev.id.charCodeAt(5);
        const status = attendance(seed);
        await prisma.attendance.upsert({
          where: { playerId_date: { playerId, date: evDate } },
          update: { status, eventId: eventIds[ev.id] },
          create: { playerId, date: evDate, status, eventId: eventIds[ev.id] },
        });
        attendanceCount++;
      }
    }
  }
  console.log(`✓ ${attendanceCount} record absensi`);

  // ─── STATISTICS ───────────────────────────────────────────────────────────
  // Semester 1 2025 — semua pemain, Published
  // Semester 2 2025 — semua pemain, Published
  // Semester 1 2026 (aktif) — semua pemain, Published
  const statPeriods = [
    { period: period2025S1, status: "Published" },
    { period: period2025S2, status: "Published" },
    { period: period2026S1, status: "Published" },
  ] as const;

  let statCount = 0;
  for (const { period, status } of statPeriods) {
    for (const p of playerDefs) {
      const playerId = players[p.name].id;
      const seedNum = playerId.charCodeAt(0) * 31 + period.id.charCodeAt(7) * 7;
      const existing = await prisma.statistic.findUnique({
        where: { playerId_periodId: { playerId, periodId: period.id } },
      });
      if (!existing) {
        await prisma.statistic.create({
          data: {
            playerId,
            periodId: period.id,
            date: period.startDate,
            metricsJson: genMetrics(seedNum),
            status,
          },
        });
        statCount++;
      }
    }
  }
  console.log(`✓ ${statCount} record statistik (3 periode × ${playerDefs.length} pemain)`);

  // ─── CERTIFICATES ─────────────────────────────────────────────────────────
  const certDefs = [
    // Kelompok
    { groupName: "Under-16 Pusat",  title: "Juara 2 Basket Antar Akademi Jakarta 2025",  fileUrl: "https://drive.google.com/file/d/example-cert-u16-2025" },
    { groupName: "Under-13 Pusat",  title: "Juara 3 Turnamen Basket Usia Dini DKI 2025", fileUrl: "https://drive.google.com/file/d/example-cert-u13-2025" },
    { groupName: "Under-12 Selatan",title: "Peserta Terbaik Open Tournament Selatan 2025",fileUrl: "https://drive.google.com/file/d/example-cert-u12-selatan" },
    // Individu
    { playerName: "Rayhan Dinata",   title: "MVP Kejuaraan Antar Akademi Jakarta Feb 2026", fileUrl: "https://drive.google.com/file/d/example-cert-rayhan-mvp" },
    { playerName: "Reva Maharani",   title: "Best Defender Turnamen DKI 2025",             fileUrl: "https://drive.google.com/file/d/example-cert-reva-defender" },
    { playerName: "Farhan Aditya",   title: "Top Scorer Under-13 Regional Jakarta 2025",   fileUrl: "https://drive.google.com/file/d/example-cert-farhan-scorer" },
  ];

  let certCount = 0;
  for (const c of certDefs) {
    const existing = await prisma.certificate.findFirst({ where: { title: c.title } });
    if (!existing) {
      if ("groupName" in c && c.groupName) {
        await prisma.certificate.create({ data: { title: c.title, fileUrl: c.fileUrl, groupId: groups[c.groupName].id } });
      } else if ("playerName" in c && c.playerName) {
        await prisma.certificate.create({ data: { title: c.title, fileUrl: c.fileUrl, playerId: players[c.playerName].id } });
      }
      certCount++;
    }
  }
  console.log(`✓ ${certCount} sertifikat`);

  // ─── SELESAI ──────────────────────────────────────────────────────────────
  console.log("\n🎉 Seeding selesai! Akun login:");
  console.log("   Admin   → username: superadmin  | password: password");
  console.log("   Parent  → username: budi_santoso | password: password  (dan 7 akun ortu lainnya)");
  console.log("   Pemain  → 24 pemain, 4 kelompok, 2 homebase");
  console.log("   Event   → 29 event (Jan–Mei 2026), 3 mendatang");
  console.log("   Statistik → 3 periode tersedia, Semester 1 2026 aktif");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
