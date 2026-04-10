-- CreateTable
CREATE TABLE `event` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `date` DATETIME(3) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'LATIHAN',
    `location` VARCHAR(191) NULL,
    `groupId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Event_groupId_fkey`(`groupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `event` ADD CONSTRAINT `Event_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `group`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
