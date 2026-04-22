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
  console.log("Membuat akun orang tua default...");
  
  const password = "123";
  const hashedPassword = await bcrypt.hash(password, 10);
  const username = "orangtua";
  
  try {
    const newUser = await prisma.user.upsert({
      where: { username },
      update: {
        password: hashedPassword,
        isDeleted: false
      },
      create: {
        username,
        name: "Orang Tua Default",
        password: hashedPassword,
        role: "PARENT",
        isDeleted: false
      }
    });
    console.log(`✓ User ${newUser.username} berhasil dibuat dengan password: 123`);
  } catch (err) {
    console.error(`✗ Gagal membuat user ${username}:`, err);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
