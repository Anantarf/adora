-- Sync migration: records all schema changes that were applied directly
-- without migration files (eventgroup, evaluationperiod, statistichistory,
-- player extra fields, attendance.eventId, statistic.periodId, user.isDeleted).

-- DropForeignKey (IF EXISTS: may not exist due to migration history inconsistency)
ALTER TABLE `event` DROP FOREIGN KEY IF EXISTS `Event_groupId_fkey`;

-- DropForeignKey: must drop before dropping the index it uses as backing index
ALTER TABLE `statistic` DROP FOREIGN KEY IF EXISTS `Statistic_playerId_fkey`;

-- DropIndex
DROP INDEX IF EXISTS `Event_groupId_fkey` ON `event`;

-- DropIndex (replaced by playerId_periodId unique constraint below)
DROP INDEX IF EXISTS `Statistic_playerId_date_key` ON `statistic`;

-- AlterTable
ALTER TABLE `attendance` ADD COLUMN `eventId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `event` DROP COLUMN `groupId`;

-- AlterTable
ALTER TABLE `player` ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `gender` VARCHAR(191) NULL,
    ADD COLUMN `height` VARCHAR(191) NULL,
    ADD COLUMN `medicalHistory` TEXT NULL,
    ADD COLUMN `parentAddress` VARCHAR(191) NULL,
    ADD COLUMN `parentName` VARCHAR(191) NULL,
    ADD COLUMN `parentPhoneNumber` VARCHAR(191) NULL,
    ADD COLUMN `phoneNumber` VARCHAR(191) NULL,
    ADD COLUMN `placeOfBirth` VARCHAR(191) NULL,
    ADD COLUMN `weight` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `statistic` ADD COLUMN `periodId` VARCHAR(191) NULL,
    ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `EventGroup` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,

    INDEX `EventGroup_eventId_idx`(`eventId`),
    INDEX `EventGroup_groupId_idx`(`groupId`),
    UNIQUE INDEX `EventGroup_eventId_groupId_key`(`eventId`, `groupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EvaluationPeriod` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StatisticHistory` (
    `id` VARCHAR(191) NOT NULL,
    `statisticId` VARCHAR(191) NOT NULL,
    `metricsJson` LONGTEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `editedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `editedBy` VARCHAR(191) NULL,

    INDEX `StatisticHistory_statisticId_idx`(`statisticId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Attendance_eventId_idx` ON `attendance`(`eventId`);

-- CreateIndex
CREATE INDEX `Statistic_periodId_idx` ON `statistic`(`periodId`);

-- CreateIndex
CREATE UNIQUE INDEX `Statistic_playerId_periodId_key` ON `statistic`(`playerId`, `periodId`);

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `Attendance_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventGroup` ADD CONSTRAINT `EventGroup_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventGroup` ADD CONSTRAINT `EventGroup_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `statistic` ADD CONSTRAINT `Statistic_periodId_fkey` FOREIGN KEY (`periodId`) REFERENCES `EvaluationPeriod`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StatisticHistory` ADD CONSTRAINT `StatisticHistory_statisticId_fkey` FOREIGN KEY (`statisticId`) REFERENCES `statistic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StatisticHistory` ADD CONSTRAINT `StatisticHistory_editedBy_fkey` FOREIGN KEY (`editedBy`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: re-add after old backing index was replaced
ALTER TABLE `statistic` ADD CONSTRAINT `Statistic_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
