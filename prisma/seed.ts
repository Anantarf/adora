import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcrypt";

// Initialize Prisma 7 MariaDB adapter
const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("password", 10);
  
  const admin = await prisma.user.upsert({
    where: { username: "superadmin" },
    update: {
      password: hashedPassword,
    },
    create: {
      username: "superadmin",
      password: hashedPassword,
      name: "Super Administrator",
      email: "master@adora.club",
      role: "ADMIN",
    },
  });

  console.log("Superadmin updated/created successfully:", admin.username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
