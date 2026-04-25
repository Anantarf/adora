import { config } from 'dotenv';
config();
import { prisma } from '../src/lib/prisma';

async function main() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const totalAttendances = await prisma.attendance.count();
  const recentAttendances = await prisma.attendance.count({ where: { date: { gte: thirtyDaysAgo } } });
  
  console.log(`Total attendances: ${totalAttendances}`);
  console.log(`Recent attendances (last 30 days): ${recentAttendances}`);
  
  const stats = await prisma.statistic.findMany({
      where: {
        status: "Published",
      },
      orderBy: { date: "desc" },
  });
  
  console.log(`Total published stats: ${stats.length}`);
  if (stats.length > 0) {
      console.log(`Latest stat date: ${stats[0].date}`);
      console.log(`Oldest stat date: ${stats[stats.length - 1].date}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
