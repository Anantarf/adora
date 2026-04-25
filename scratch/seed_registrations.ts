import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const homebases = await prisma.homebase.findMany();
  if (homebases.length === 0) {
    console.error("No homebase found");
    return;
  }
  
  const hbIds = homebases.map(h => h.id);
  
  // Clear existing pending registrations for a clean reset
  await prisma.registration.deleteMany({
    where: { status: "PENDING" }
  });
  
  const names = [
    "Andi Saputra", "Rizky Ramadhan", "Bima Arya", "Deni Setiawan", "Tegar Wicaksono", 
    "Satriya M", "Fajar N", "Rafi Ahmad", "Gilang Permana", "Wahyu Dwi"
  ];
  
  const categories = ["KU-7", "KU-10", "KU-15", "KU-18"];
  
  const data = names.map((name, i) => ({
    playerName: name,
    phone: "0812345678" + (90 + i),
    email: `pendaftar${i}@gmail.com`,
    ageGroup: categories[i % categories.length],
    homebaseId: hbIds[i % hbIds.length],
    status: "PENDING" as const
  }));
  
  await prisma.registration.createMany({
    data
  });
  
  console.log("Berhasil mereset dan membuat 10 pendaftar baru dengan kategori KU.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
