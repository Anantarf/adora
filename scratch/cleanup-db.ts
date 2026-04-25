import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });
async function main() {
  await prisma.player.deleteMany({
    where: {
      group: {
        name: {
          in: ["Under-10 Cinere", "Under-13 Cinere", "Under-16 Cinere", "Under-12 Cibubur"]
        }
      }
    }
  });
  await prisma.group.deleteMany({
    where: {
      name: {
        in: ["Under-10 Cinere", "Under-13 Cinere", "Under-16 Cinere", "Under-12 Cibubur"]
      }
    }
  });
  console.log("Cleanup done.");
}
main().finally(() => prisma.$disconnect());
