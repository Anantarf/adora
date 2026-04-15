/*
  Warnings:

  - Added the required column `updatedAt` to the `Group` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `player` DROP FOREIGN KEY `Player_parentId_fkey`;

-- AlterTable
ALTER TABLE `event` ADD COLUMN `homebaseId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `group` ADD COLUMN `homebaseId` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `player` ADD COLUMN `preferred_homebaseId` VARCHAR(191) NULL,
    MODIFY `parentId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Homebase` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Homebase_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Event_homebaseId_idx` ON `Event`(`homebaseId`);

-- CreateIndex
CREATE INDEX `Group_homebaseId_idx` ON `Group`(`homebaseId`);

-- CreateIndex
CREATE INDEX `Player_preferred_homebaseId_idx` ON `Player`(`preferred_homebaseId`);

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_homebaseId_fkey` FOREIGN KEY (`homebaseId`) REFERENCES `Homebase`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Group` ADD CONSTRAINT `Group_homebaseId_fkey` FOREIGN KEY (`homebaseId`) REFERENCES `Homebase`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Player` ADD CONSTRAINT `Player_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Player` ADD CONSTRAINT `Player_preferred_homebaseId_fkey` FOREIGN KEY (`preferred_homebaseId`) REFERENCES `Homebase`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RedefineIndex
CREATE INDEX `Event_date_idx` ON `Event`(`date`);
DROP INDEX `event_date_idx` ON `event`;
