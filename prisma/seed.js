require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  console.log("Using DATABASE_URL from process.env:", process.env.DATABASE_URL);
  
  const hashedPassword = await bcrypt.hash("adora123", 10);
  
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
      name: "Master Admin",
      role: "ADMIN",
    },
  });

  console.log("✅ Admin created successfully:", admin.username);
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
