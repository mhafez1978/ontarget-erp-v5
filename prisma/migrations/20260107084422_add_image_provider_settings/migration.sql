-- CreateTable
CREATE TABLE `ImageProvider` (
    `id` VARCHAR(191) NOT NULL,
    `provider` ENUM('UNSPLASH', 'PEXELS') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `scope` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `apiKey` TEXT NULL,
    `apiSecret` TEXT NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ImageProvider_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
