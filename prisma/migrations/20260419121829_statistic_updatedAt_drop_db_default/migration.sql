-- Migration 5 incorrectly added a DB-level DEFAULT + ON UPDATE to statistic.updatedAt.
-- Prisma manages @updatedAt at query level; DB-level default is redundant and causes schema drift.
ALTER TABLE `statistic` MODIFY `updatedAt` DATETIME(3) NOT NULL;
