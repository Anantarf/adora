import { config } from 'dotenv';
config();
import { prisma } from '../src/lib/prisma';

async function main() {
  const attends = await prisma.attendance.findMany({ take: 5 });
  console.log("Sample attendances:", JSON.stringify(attends, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
