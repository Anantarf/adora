import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });
const users = await p.user.findMany({
  where: { role: 'PARENT' },
  include: { player: { select: { id: true, firstName: true, lastName: true } } },
});
const ranked = users
  .map((u) => ({ u: u.username, n: u.player?.length ?? 0, p: u.player?.map((x) => `${x.firstName} ${x.lastName ?? ''}`) }))
  .filter((x) => x.n > 0)
  .slice(0, 10);
console.log(JSON.stringify(ranked, null, 2));
await p.$disconnect();
