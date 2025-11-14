-- AlterTable
ALTER TABLE `User` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `StorageProvider` (
    `id` VARCHAR(191) NOT NULL,
    `provider` ENUM('LOCAL', 'GOOGLE_DRIVE', 'ONEDRIVE', 'AWS_S3', 'DIGITALOCEAN') NOT NULL DEFAULT 'LOCAL',
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `config` TEXT NULL,
    `lastTestedAt` DATETIME(3) NULL,
    `isConnected` BOOLEAN NOT NULL DEFAULT false,
    `lastError` TEXT NULL,
    `scope` VARCHAR(191) NOT NULL DEFAULT 'GLOBAL',
    `companyId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StorageProvider_provider_idx`(`provider`),
    INDEX `StorageProvider_isActive_idx`(`isActive`),
    INDEX `StorageProvider_scope_idx`(`scope`),
    INDEX `StorageProvider_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
