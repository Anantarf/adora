import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
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
      description: "Homebase Utama / Pusat dengan fasilitas lapangan indoor standar FIBA.",
    },
  });

  const cibubur = await prisma.homebase.create({
    data: {
      name: "ADORA Cibubur",
      address: "GOR Cileungsi, Jl. Raya Cileungsi - Jonggol No. 45, Bogor, Jawa Barat 16820",
      phone: "081298765432",
      description: "Cabang Cibubur / Cileungsi dengan fasilitas outdoor & semi-indoor.",
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

  const parentUsers: Record<string, any> = {};
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

  // 7. SEED PLAYERS
  console.log("Seeding players...");
  const playersToCreate = [
    // KU-10 (Gandul)
    {
      firstName: "Rafi",
      lastName: "Satya",
      dateOfBirth: new Date("2016-04-12"),
      placeOfBirth: "Depok",
      gender: "Laki-laki",
      religion: "Islam",
      weight: "32 kg",
      height: "135 cm",
      schoolOrigin: "SDN Gandul 1",
      address: "Jl. Gandul Indah No. 3",
      addressLine1: "Jl. Gandul Indah No. 3",
      city: "Depok",
      province: "Jawa Barat",
      postalCode: "16514",
      phoneNumber: "081299998888",
      parentName: "Arya Satya",
      parentPhoneNumber: "081234567890",
      parentId: parentUsers["parent.arya"].id,
      groupId: ku10.id,
      preferredHomebaseId: gandul.id,
    },
    {
      firstName: "Alif",
      lastName: "Hermawan",
      dateOfBirth: new Date("2016-09-25"),
      placeOfBirth: "Jakarta",
      gender: "Laki-laki",
      religion: "Islam",
      weight: "34 kg",
      height: "138 cm",
      schoolOrigin: "SD Al-Azhar Cinere",
      address: "Cinere Residences Blok B/12",
      addressLine1: "Cinere Residences Blok B/12",
      city: "Depok",
      province: "Jawa Barat",
      postalCode: "16514",
      phoneNumber: "081277776666",
      parentName: "Budi Hermawan",
      parentPhoneNumber: "081298765432",
      parentId: parentUsers["parent.budi"].id,
      groupId: ku10.id,
      preferredHomebaseId: gandul.id,
    },
    {
      firstName: "Cika",
      lastName: "Lestari",
      dateOfBirth: new Date("2017-02-14"),
      placeOfBirth: "Depok",
      gender: "Perempuan",
      religion: "Islam",
      weight: "28 kg",
      height: "130 cm",
      schoolOrigin: "SD Limo 2",
      address: "Jl. Limo Raya No. 45",
      addressLine1: "Jl. Limo Raya No. 45",
      city: "Depok",
      province: "Jawa Barat",
      postalCode: "16515",
      phoneNumber: "081255554444",
      parentName: "Citra Lestari",
      parentPhoneNumber: "081244445555",
      parentId: parentUsers["parent.citra"].id,
      groupId: ku10.id,
      preferredHomebaseId: gandul.id,
    },

    // KU-12 (Gandul)
    {
      firstName: "Dimas",
      lastName: "Puspita",
      dateOfBirth: new Date("2014-05-18"),
      placeOfBirth: "Jakarta",
      gender: "Laki-laki",
      religion: "Kristen",
      weight: "40 kg",
      height: "148 cm",
      schoolOrigin: "SD Santo Paulus",
      address: "Jl. Pondok Labu No. 10",
      addressLine1: "Jl. Pondok Labu No. 10",
      city: "Jakarta Selatan",
      province: "DKI Jakarta",
      postalCode: "12450",
      phoneNumber: "081233332222",
      parentName: "Diana Puspita",
      parentPhoneNumber: "081233334444",
      parentId: parentUsers["parent.diana"].id,
      groupId: ku12.id,
      preferredHomebaseId: gandul.id,
    },
    {
      firstName: "Gibran",
      lastName: "Prasetyo",
      dateOfBirth: new Date("2014-11-03"),
      placeOfBirth: "Depok",
      gender: "Laki-laki",
      religion: "Islam",
      weight: "42 kg",
      height: "150 cm",
      schoolOrigin: "SDN Sawangan 3",
      address: "Puri Sawangan Elok Blok C/4",
      addressLine1: "Puri Sawangan Elok Blok C/4",
      city: "Depok",
      province: "Jawa Barat",
      postalCode: "16511",
      phoneNumber: "081211112222",
      parentName: "Eko Prasetyo",
      parentPhoneNumber: "081211110000",
      parentId: parentUsers["parent.eko"].id,
      groupId: ku12.id,
      preferredHomebaseId: gandul.id,
    },
    {
      firstName: "Farel",
      lastName: "Handayani",
      dateOfBirth: new Date("2015-01-22"),
      placeOfBirth: "Jakarta",
      gender: "Laki-laki",
      religion: "Islam",
      weight: "38 kg",
      height: "145 cm",
      schoolOrigin: "SD Harapan Bangsa",
      address: "Bukit Cinere Indah Blok H/8",
      addressLine1: "Bukit Cinere Indah Blok H/8",
      city: "Depok",
      province: "Jawa Barat",
      postalCode: "16514",
      phoneNumber: "081222223333",
      parentName: "Fitri Handayani",
      parentPhoneNumber: "081288887777",
      parentId: parentUsers["parent.fitri"].id,
      groupId: ku12.id,
      preferredHomebaseId: gandul.id,
    },

    // KU-14 (Cibubur)
    {
      firstName: "Kevin",
      lastName: "Sanjaya",
      dateOfBirth: new Date("2012-08-30"),
      placeOfBirth: "Bogor",
      gender: "Laki-laki",
      religion: "Kristen",
      weight: "48 kg",
      height: "162 cm",
      schoolOrigin: "SMPN 1 Cileungsi",
      address: "Kranggan Permai Blok RT 03/12",
      addressLine1: "Kranggan Permai Blok RT 03/12",
      city: "Bogor",
      province: "Jawa Barat",
      postalCode: "16820",
      phoneNumber: "081288889999",
      parentName: "Arya Satya",
      parentPhoneNumber: "081234567890",
      parentId: parentUsers["parent.arya"].id,
      groupId: ku14.id,
      preferredHomebaseId: cibubur.id,
    },
    {
      firstName: "Bagus",
      lastName: "Kahfi",
      dateOfBirth: new Date("2012-10-10"),
      placeOfBirth: "Bogor",
      gender: "Laki-laki",
      religion: "Islam",
      weight: "50 kg",
      height: "165 cm",
      schoolOrigin: "SMP Al-Azhar Cibubur",
      address: "Legenda Wisata Blok G3 No. 9",
      addressLine1: "Legenda Wisata Blok G3 No. 9",
      city: "Bogor",
      province: "Jawa Barat",
      postalCode: "16820",
      phoneNumber: "081244447777",
      parentName: "Budi Hermawan",
      parentPhoneNumber: "081298765432",
      parentId: parentUsers["parent.budi"].id,
      groupId: ku14.id,
      preferredHomebaseId: cibubur.id,
    },
    {
      firstName: "Zaki",
      lastName: "Lestari",
      dateOfBirth: new Date("2013-03-05"),
      placeOfBirth: "Jakarta",
      gender: "Laki-laki",
      religion: "Islam",
      weight: "46 kg",
      height: "160 cm",
      schoolOrigin: "SMP Penabur Cibubur",
      address: "CitraGran Blok J/5",
      addressLine1: "CitraGran Blok J/5",
      city: "Bekasi",
      province: "Jawa Barat",
      postalCode: "17433",
      phoneNumber: "081299001122",
      parentName: "Citra Lestari",
      parentPhoneNumber: "081244445555",
      parentId: parentUsers["parent.citra"].id,
      groupId: ku14.id,
      preferredHomebaseId: cibubur.id,
    },

    // KU-16 (Cibubur)
    {
      firstName: "Daniel",
      lastName: "Marthin",
      dateOfBirth: new Date("2010-02-12"),
      placeOfBirth: "Jakarta",
      gender: "Laki-laki",
      religion: "Katolik",
      weight: "58 kg",
      height: "175 cm",
      schoolOrigin: "SMA Penabur Kota Wisata",
      address: "Kota Wisata Cluster Nebraska Blok F2 No. 8",
      addressLine1: "Kota Wisata Cluster Nebraska Blok F2 No. 8",
      city: "Bogor",
      province: "Jawa Barat",
      postalCode: "16968",
      phoneNumber: "081266667777",
      parentName: "Diana Puspita",
      parentPhoneNumber: "081233334444",
      parentId: parentUsers["parent.diana"].id,
      groupId: ku16.id,
      preferredHomebaseId: cibubur.id,
    },
    {
      firstName: "Edo",
      lastName: "Prasetyo",
      dateOfBirth: new Date("2010-07-24"),
      placeOfBirth: "Bogor",
      gender: "Laki-laki",
      religion: "Islam",
      weight: "62 kg",
      height: "178 cm",
      schoolOrigin: "SMAN 1 Cileungsi",
      address: "Metland Transyogi Cluster Sherwood Blok A/1",
      addressLine1: "Metland Transyogi Cluster Sherwood Blok A/1",
      city: "Bogor",
      province: "Jawa Barat",
      postalCode: "16820",
      phoneNumber: "081288990011",
      parentName: "Eko Prasetyo",
      parentPhoneNumber: "081211110000",
      parentId: parentUsers["parent.eko"].id,
      groupId: ku16.id,
      preferredHomebaseId: cibubur.id,
    },
    {
      firstName: "Farhan",
      lastName: "Handayani",
      dateOfBirth: new Date("2011-12-01"),
      placeOfBirth: "Depok",
      gender: "Laki-laki",
      religion: "Islam",
      weight: "55 kg",
      height: "172 cm",
      schoolOrigin: "SMP Labschool Cibubur",
      address: "Kranggan Permai Raya No. 90",
      addressLine1: "Kranggan Permai Raya No. 90",
      city: "Bekasi",
      province: "Jawa Barat",
      postalCode: "17433",
      phoneNumber: "081277665544",
      parentName: "Fitri Handayani",
      parentPhoneNumber: "081288887777",
      parentId: parentUsers["parent.fitri"].id,
      groupId: ku16.id,
      preferredHomebaseId: cibubur.id,
    },
  ];

  const players: Record<string, any> = {};
  for (const p of playersToCreate) {
    const name = `${p.firstName} ${p.lastName}`.trim();
    const createdPlayer = await prisma.player.create({
      data: {
        name,
        firstName: p.firstName,
        lastName: p.lastName,
        dateOfBirth: p.dateOfBirth,
        placeOfBirth: p.placeOfBirth,
        gender: p.gender,
        religion: p.religion,
        weight: p.weight,
        height: p.height,
        schoolOrigin: p.schoolOrigin,
        address: p.address,
        addressLine1: p.addressLine1,
        city: p.city,
        province: p.province,
        postalCode: p.postalCode,
        phoneNumber: p.phoneNumber,
        parentName: p.parentName,
        parentPhoneNumber: p.parentPhoneNumber,
        parentId: p.parentId,
        groupId: p.groupId,
        preferredHomebaseId: p.preferredHomebaseId,
      },
    });
    players[name] = createdPlayer;
  }
  console.log(`Pemain berhasil di-seed (${Object.keys(players).length} pemain).`);

  // 8. EVALUATION PERIODS
  console.log("Seeding evaluation periods...");
  // V2 Config
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

  const periodPast = await prisma.evaluationPeriod.create({
    data: {
      name: "Periode Genap Maret - April 2026",
      startDate: new Date("2026-03-01T00:00:00.000Z"),
      endDate: new Date("2026-04-30T23:59:59.999Z"),
      isActive: false,
      evaluationConfigJson: null, // Legacy
    },
  });

  const periodActive = await prisma.evaluationPeriod.create({
    data: {
      name: "Periode Ganjil Mei - Juni 2026",
      startDate: new Date("2026-05-01T00:00:00.000Z"),
      endDate: new Date("2026-06-30T23:59:59.999Z"),
      isActive: true,
      evaluationConfigJson: evaluationConfigV2, // V2
    },
  });
  console.log("Evaluation periods berhasil di-seed.");

  // 9. SEED EVENTS (Past & Active periods)
  console.log("Seeding events & attendances...");
  
  // Helper to get dates between start & end
  const generateDates = (start: Date, end: Date, stepDays: number = 7) => {
    const list: Date[] = [];
    let curr = new Date(start.getTime());
    while (curr <= end) {
      list.push(new Date(curr));
      curr.setDate(curr.getDate() + stepDays);
    }
    return list;
  };

  const pastDates = generateDates(periodPast.startDate, periodPast.endDate, 7); // ~8 events
  const activeDates = generateDates(periodActive.startDate, periodActive.endDate, 7); // ~8 events

  const allEventsToCreate: any[] = [];
  const eventGroupMappings: { eventIndex: number; groupId: string }[] = [];

  // Create event definitions first
  // Past events
  pastDates.forEach((date, i) => {
    // Gandul event
    allEventsToCreate.push({
      title: `Latihan Rutin Gandul #${i + 1}`,
      description: "Fokus pada penguatan fundamental dribble dan passing.",
      date,
      type: i === pastDates.length - 1 ? "PERTANDINGAN" : "LATIHAN",
      location: "ADORA Gandul (Pusat)",
      homebaseId: gandul.id,
    });
    const idx1 = allEventsToCreate.length - 1;
    eventGroupMappings.push({ eventIndex: idx1, groupId: ku10.id });
    eventGroupMappings.push({ eventIndex: idx1, groupId: ku12.id });

    // Cibubur event
    allEventsToCreate.push({
      title: `Latihan Rutin Cibubur #${i + 1}`,
      description: "Fokus pada finishing lay-up dan endurance.",
      date,
      type: i === pastDates.length - 1 ? "SPARING" : "LATIHAN",
      location: "ADORA Cibubur",
      homebaseId: cibubur.id,
    });
    const idx2 = allEventsToCreate.length - 1;
    eventGroupMappings.push({ eventIndex: idx2, groupId: ku14.id });
    eventGroupMappings.push({ eventIndex: idx2, groupId: ku16.id });
  });

  // Active events
  activeDates.forEach((date, i) => {
    // Gandul event
    allEventsToCreate.push({
      title: `Latihan Rutin Gandul #${i + 1}`,
      description: "Fokus pada team play dan defense transition.",
      date,
      type: i === activeDates.length - 1 ? "EVALUASI" : "LATIHAN",
      location: "ADORA Gandul (Pusat)",
      homebaseId: gandul.id,
    });
    const idx1 = allEventsToCreate.length - 1;
    eventGroupMappings.push({ eventIndex: idx1, groupId: ku10.id });
    eventGroupMappings.push({ eventIndex: idx1, groupId: ku12.id });

    // Cibubur event
    allEventsToCreate.push({
      title: `Latihan Rutin Cibubur #${i + 1}`,
      description: "Fokus pada tactical offensive set play.",
      date,
      type: i === activeDates.length - 1 ? "EVALUASI" : "LATIHAN",
      location: "ADORA Cibubur",
      homebaseId: cibubur.id,
    });
    const idx2 = allEventsToCreate.length - 1;
    eventGroupMappings.push({ eventIndex: idx2, groupId: ku14.id });
    eventGroupMappings.push({ eventIndex: idx2, groupId: ku16.id });
  });

  const createdEvents = [];
  for (const e of allEventsToCreate) {
    const created = await prisma.event.create({ data: e });
    createdEvents.push(created);
  }

  // Create EventGroup relations
  for (const map of eventGroupMappings) {
    const event = createdEvents[map.eventIndex];
    await prisma.eventGroup.create({
      data: {
        eventId: event.id,
        groupId: map.groupId,
      },
    });
  }
  console.log(`Events & EventGroups berhasil di-seed (${createdEvents.length} events).`);

  // 10. SEED ATTENDANCES
  console.log("Seeding attendances per player...");
  // Group players by group
  const playersByGroup: Record<string, any[]> = {
    [ku10.id]: [],
    [ku12.id]: [],
    [ku14.id]: [],
    [ku16.id]: [],
  };
  Object.values(players).forEach((p) => {
    if (p.groupId && playersByGroup[p.groupId]) {
      playersByGroup[p.groupId].push(p);
    }
  });

  // Keep count of attendance status per player per period to calculate exact V2 score
  const playerAttendanceCounts: Record<string, Record<string, { HADIR: number; IZIN: number; SAKIT: number; ALPA: number }>> = {};

  for (const event of createdEvents) {
    // Find groups linked to this event
    const eGroups = await prisma.eventGroup.findMany({
      where: { eventId: event.id },
      select: { groupId: true },
    });

    const isPast = event.date < periodActive.startDate;
    const periodId = isPast ? periodPast.id : periodActive.id;

    for (const eg of eGroups) {
      const groupPlayers = playersByGroup[eg.groupId] || [];
      for (const p of groupPlayers) {
        if (!playerAttendanceCounts[p.id]) {
          playerAttendanceCounts[p.id] = {
            [periodPast.id]: { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 },
            [periodActive.id]: { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 },
          };
        }

        // Generate realistic status: 85% HADIR, 8% IZIN, 5% SAKIT, 2% ALPA
        const rand = Math.random();
        let status: "HADIR" | "IZIN" | "SAKIT" | "ALPA" = "HADIR";
        if (rand > 0.98) status = "ALPA";
        else if (rand > 0.93) status = "SAKIT";
        else if (rand > 0.85) status = "IZIN";

        playerAttendanceCounts[p.id][periodId][status]++;

        await prisma.attendance.create({
          data: {
            date: event.date,
            status,
            note: status !== "HADIR" ? `Izin karena keperluan keluarga / sakit.` : null,
            playerId: p.id,
            eventId: event.id,
          },
        });
      }
    }
  }
  console.log("Attendances berhasil di-seed.");

  // 11. SEED STATISTICS (Maret-April (legacy) and Mei-Juni (V2))
  console.log("Seeding statistics & statistics histories...");

  const groupInfo: Record<string, { group: any; homebase: any; coach: any }> = {
    [ku10.id]: { group: ku10, homebase: gandul, coach: coachDanuriProfile },
    [ku12.id]: { group: ku12, homebase: gandul, coach: coachRezaProfile },
    [ku14.id]: { group: ku14, homebase: cibubur, coach: coachFauziProfile },
    [ku16.id]: { group: ku16, homebase: cibubur, coach: coachDanuriProfile },
  };

  const getDribbleAndPassingScore = (p: any, type: string) => {
    // Generate scores based on player name/age
    const base = p.firstName.length % 3 === 0 ? 8 : p.firstName.length % 3 === 1 ? 9 : 7;
    if (type === "legacy") {
      return {
        inAndOut: base * 10 + 5,
        crossover: base,
        vLeft: base - 1,
        vRight: base,
        betweenLegsLeft: base - 2,
        betweenLegsRight: base - 1,
      };
    } else {
      return [
        { id: "in-and-out", label: "In & Out Dribble", maxScore: 99, score: base * 10 + 7 },
        { id: "crossover", label: "Crossover", maxScore: 10, score: base },
        { id: "v-left", label: "V Dribble (Kiri)", maxScore: 10, score: base },
        { id: "v-right", label: "V Dribble (Kanan)", maxScore: 10, score: base },
        { id: "between-legs-left", label: "Between Legs (Kiri)", maxScore: 10, score: base - 1 },
        { id: "between-legs-right", label: "Between Legs (Kanan)", maxScore: 10, score: base },
      ];
    }
  };

  for (const p of Object.values(players)) {
    const info = groupInfo[p.groupId];
    if (!info) continue;

    // A. Past Statistics (Legacy format, ALL PUBLISHED)
    const legacyScores = getDribbleAndPassingScore(p, "legacy") as any;
    const legacyMetrics: any = {
      dribble: legacyScores,
      passing: {
        chestPass: legacyScores.crossover,
        bouncePass: legacyScores.vLeft,
        overheadPass: legacyScores.vRight,
      },
      layUp: legacyScores.crossover,
      shooting: legacyScores.vLeft,
      notes: "Performa yang konsisten sepanjang periode Genap. Teknik dasar sudah cukup baik.",
    };

    const statPast = await prisma.statistic.create({
      data: {
        date: new Date("2026-04-28"),
        status: "Published",
        metricsJson: legacyMetrics,
        playerId: p.id,
        periodId: periodPast.id,
        groupIdSnapshot: info.group.id,
        groupNameSnapshot: info.group.name,
        homebaseIdSnapshot: info.homebase.id,
        homebaseNameSnapshot: info.homebase.name,
        coachProfileIdSnapshot: info.coach.id,
        coachNameSnapshot: info.coach.fullName,
      },
    });

    // Create 1 history entry for legacy
    await prisma.statisticHistory.create({
      data: {
        statisticId: statPast.id,
        metricsJson: legacyMetrics,
        status: "Published",
        editedAt: new Date("2026-04-28T10:00:00.000Z"),
        editedBy: info.coach.userId,
      },
    });

    // B. Active Statistics (V2 format, MIX OF DRAFT AND PUBLISHED)
    // Calculate attendance score from seed
    const pCounts = playerAttendanceCounts[p.id]?.[periodActive.id] || { HADIR: 8, IZIN: 0, SAKIT: 0, ALPA: 0 };
    const totalSessions = pCounts.HADIR + pCounts.IZIN + pCounts.SAKIT + pCounts.ALPA;
    const attWeight = 10;
    const weightedAttScore =
      pCounts.HADIR * 100 +
      pCounts.IZIN * 75 +
      pCounts.SAKIT * 75 +
      pCounts.ALPA * 0;
    const attScoreVal = totalSessions > 0 ? Math.round(weightedAttScore / totalSessions) : 0;

    const v2DribbleScores = getDribbleAndPassingScore(p, "v2") as any[];
    const isDraft = p.firstName.length % 4 === 0; // Some are draft, some are published

    const v2Metrics: any = {
      version: "v2",
      categories: [
        {
          id: "dribble",
          label: "Dribble",
          weight: 40,
          items: v2DribbleScores,
        },
        {
          id: "passing",
          label: "Passing",
          weight: 25,
          items: [
            { id: "chest-pass", label: "Chest Pass", maxScore: 10, score: v2DribbleScores[1].score },
            { id: "bounce-pass", label: "Bounce Pass", maxScore: 10, score: v2DribbleScores[2].score },
            { id: "overhead-pass", label: "Overhead Pass", maxScore: 10, score: v2DribbleScores[3].score },
          ],
        },
        {
          id: "finishing",
          label: "Finishing",
          weight: 20,
          items: [{ id: "lay-up", label: "Lay Up", maxScore: 10, score: v2DribbleScores[1].score }],
        },
        {
          id: "shooting",
          label: "Shooting",
          weight: 15,
          items: [{ id: "shooting", label: "Shooting", maxScore: 10, score: v2DribbleScores[2].score }],
        },
      ],
      attendance: {
        label: "Presensi",
        weight: attWeight,
        score: attScoreVal,
        counts: pCounts,
        totalSessions,
      },
      notes: isDraft
        ? "Draft nilai tengah semester, masih memerlukan beberapa penilaian tambahan."
        : "Penilaian akhir periode aktif selesai, progres dribble dan finishing sangat pesat.",
      grading: evaluationConfigV2.grading,
    };

    const statActive = await prisma.statistic.create({
      data: {
        date: new Date("2026-06-02"),
        status: isDraft ? "Draft" : "Published",
        metricsJson: v2Metrics,
        playerId: p.id,
        periodId: periodActive.id,
        groupIdSnapshot: info.group.id,
        groupNameSnapshot: info.group.name,
        homebaseIdSnapshot: info.homebase.id,
        homebaseNameSnapshot: info.homebase.name,
        coachProfileIdSnapshot: info.coach.id,
        coachNameSnapshot: info.coach.fullName,
      },
    });

    // Create history entries (Draft first, then edit)
    await prisma.statisticHistory.create({
      data: {
        statisticId: statActive.id,
        metricsJson: { ...v2Metrics, notes: "Evaluasi awal latihan." },
        status: "Draft",
        editedAt: new Date("2026-05-25T14:30:00.000Z"),
        editedBy: info.coach.userId,
      },
    });

    if (!isDraft) {
      await prisma.statisticHistory.create({
        data: {
          statisticId: statActive.id,
          metricsJson: v2Metrics,
          status: "Published",
          editedAt: new Date("2026-06-02T16:00:00.000Z"),
          editedBy: info.coach.userId,
        },
      });
    }
  }
  console.log("Statistics & histories berhasil di-seed.");

  // 12. SEED REPORT ARCHIVES
  console.log("Seeding report archives...");
  // We seed RELEASED PDF reports for all players for the past period (since it's closed)
  // And DRAFT reports for the published statistics of the active period
  for (const p of Object.values(players)) {
    const info = groupInfo[p.groupId];
    if (!info) continue;

    // A. Past Period Report (Always RELEASED)
    await prisma.reportArchive.create({
      data: {
        playerId: p.id,
        periodId: periodPast.id,
        groupId: info.group.id,
        groupNameSnapshot: info.group.name,
        homebaseIdSnapshot: info.homebase.id,
        homebaseNameSnapshot: info.homebase.name,
        coachProfileIdSnapshot: info.coach.id,
        coachNameSnapshot: info.coach.fullName,
        fileUrl: "/template-rapor-sd.pdf",
        status: "RELEASED",
        releasedAt: new Date("2026-04-30T17:00:00.000Z"),
        uploadedById: adminUser.id,
      },
    });

    // B. Active Period Report (DRAFT for published statistics)
    const activeStat = await prisma.statistic.findUnique({
      where: { playerId_periodId: { playerId: p.id, periodId: periodActive.id } },
      select: { status: true },
    });

    if (activeStat && activeStat.status === "Published") {
      await prisma.reportArchive.create({
        data: {
          playerId: p.id,
          periodId: periodActive.id,
          groupId: info.group.id,
          groupNameSnapshot: info.group.name,
          homebaseIdSnapshot: info.homebase.id,
          homebaseNameSnapshot: info.homebase.name,
          coachProfileIdSnapshot: info.coach.id,
          coachNameSnapshot: info.coach.fullName,
          fileUrl: "/template-rapor-sd.pdf", // Dummy pdf url
          status: "DRAFT",
          uploadedById: adminUser.id,
        },
      });
    }
  }
  console.log("Report archives berhasil di-seed.");

  // 13. SEED CERTIFICATES
  console.log("Seeding certificates...");
  const sampleCertificates = [
    { title: "Juara 3 Turnamen internal ADORA Cup KU-10", player: "Rafi Satya" },
    { title: "MVP Sparing vs Indonesia Muda KU-12", player: "Dimas Puspita" },
    { title: "Pemain Terbaik Latihan Rutin Mei 2026 KU-14", player: "Kevin Sanjaya" },
    { title: "Juara 1 Kejuaraan Kota Depok KU-16", player: "Daniel Marthin" },
  ];

  for (const c of sampleCertificates) {
    const p = players[c.player];
    if (p) {
      await prisma.certificate.create({
        data: {
          title: c.title,
          fileUrl: "/certificates/dummy-cert.pdf",
          playerId: p.id,
        },
      });
    }
  }
  console.log("Certificates berhasil di-seed.");

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
