
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcrypt";
import * as dotenv from "dotenv";
import { URL } from "url";

dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is missing in .env");
}

const parsedUrl = new URL(url);
const adapter = new PrismaMariaDb({
  host: parsedUrl.hostname,
  port: Number(parsedUrl.port) || 3306,
  user: parsedUrl.username,
  password: parsedUrl.password,
  database: parsedUrl.pathname.slice(1),
  connectionLimit: 10,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Memulai proses seeding 10 akun orang tua...");
  
  const password = "password";
  const hashedPassword = await bcrypt.hash(password, 10);
  
  for (let i = 1; i <= 10; i++) {
    const username = `parent${i}`;
    const email = `parent${i}@adora.test`;
    const name = `Orang Tua Test ${i}`;
    
    try {
      const newUser = await prisma.user.upsert({
        where: { username },
        update: {
          password: hashedPassword,
          isDeleted: false
        },
        create: {
          username,
          email,
          name,
          password: hashedPassword,
          role: "PARENT",
          isDeleted: false
        }
      });
      console.log(`✓ [${i}/10] User ${newUser.username} siap.`);
    } catch (err) {
      console.error(`✗ Gagal membuat user ${username}:`, err);
    }
  }

  console.log("\nSeeding selesai. Semua akun menggunakan password: 'password'");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
