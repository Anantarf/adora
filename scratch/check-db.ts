import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });
async function main() {
  console.log(await prisma.homebase.findMany());
  console.log(await prisma.group.findMany());
}
main().finally(() => prisma.$disconnect());
