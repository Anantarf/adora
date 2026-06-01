/*
  Warnings:

  - Made the column `playerId` on table `certificate` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "certificate" ALTER COLUMN "playerId" SET NOT NULL;
