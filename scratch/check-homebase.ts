import { prisma } from "../src/lib/prisma";

async function main() {
  const homebases = await prisma.homebase.findMany();
  console.log("Homebases count:", homebases.length);
  console.log(homebases.map(h => h.name));
}

main()
  .catch(e => console.error(e))
  .finally();
