/*
  Warnings:

  - You are about to drop the column `groupId` on the `certificate` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "certificate" DROP CONSTRAINT "Certificate_groupId_fkey";

-- DropIndex
DROP INDEX "Certificate_groupId_idx";

-- AlterTable
ALTER TABLE "certificate" DROP COLUMN "groupId";
