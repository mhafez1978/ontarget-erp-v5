-- AlterTable
ALTER TABLE `Task` ADD COLUMN `timeEntry` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `ProjectNote` (
    `id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `timeEntry` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProjectNote_projectId_idx`(`projectId`),
    INDEX `ProjectNote_authorId_idx`(`authorId`),
    INDEX `ProjectNote_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProjectNote` ADD CONSTRAINT `ProjectNote_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectNote` ADD CONSTRAINT `ProjectNote_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `CompanyStaff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
