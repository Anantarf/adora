import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Migrate players from Under-12 Selatan → Under-12 Cibubur, then delete old group
  const cibubur = await prisma.group.findUnique({ where: { name: "Under-12 Cibubur" } });
  const selatan = await prisma.group.findUnique({ where: { name: "Under-12 Selatan" } });
  if (selatan && cibubur) {
    await prisma.player.updateMany({ where: { groupId: selatan.id }, data: { groupId: cibubur.id } });
    await prisma.event.updateMany({ where: { homebaseId: selatan.homebaseId }, data: {} }); // no-op, homebase same
    await prisma.group.delete({ where: { id: selatan.id } });
    console.log("✓ Merged Under-12 Selatan → Under-12 Cibubur, deleted old group.");
  } else {
    console.log("Nothing to merge.", { selatan: !!selatan, cibubur: !!cibubur });
  }
}
main().finally(() => prisma.$disconnect());
