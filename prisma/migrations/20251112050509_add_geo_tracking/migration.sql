-- AlterTable
ALTER TABLE `Session` ADD COLUMN `sessionCity` VARCHAR(191) NULL,
    ADD COLUMN `sessionCountry` VARCHAR(191) NULL,
    ADD COLUMN `sessionCountryFlag` VARCHAR(191) NULL,
    ADD COLUMN `sessionIpAddress` VARCHAR(191) NULL,
    ADD COLUMN `sessionState` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `capturedCity` VARCHAR(191) NULL,
    ADD COLUMN `capturedCountry` VARCHAR(191) NULL,
    ADD COLUMN `capturedCountryFlag` VARCHAR(191) NULL,
    ADD COLUMN `capturedIpAddress` VARCHAR(191) NULL,
    ADD COLUMN `capturedState` VARCHAR(191) NULL,
    ADD COLUMN `lastLoginAt` DATETIME(3) NULL,
    ADD COLUMN `lastLoginCity` VARCHAR(191) NULL,
    ADD COLUMN `lastLoginCountry` VARCHAR(191) NULL,
    ADD COLUMN `lastLoginCountryFlag` VARCHAR(191) NULL,
    ADD COLUMN `lastLoginIpAddress` VARCHAR(191) NULL,
    ADD COLUMN `lastLoginState` VARCHAR(191) NULL,
    ADD COLUMN `role` ENUM('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'ERP_CUSTOMER', 'COMPANY_CUSTOMER', 'CONTRACTOR', 'SUPPLIER', 'GUEST') NOT NULL DEFAULT 'GUEST';

-- CreateTable
CREATE TABLE `Company` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `logo` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `postalCode` VARCHAR(191) NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Company_ownerId_idx`(`ownerId`),
    INDEX `Company_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GeoTrackingSetting` (
    `id` VARCHAR(191) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `apiUrl` VARCHAR(191) NOT NULL DEFAULT 'https://ipapi.co/json/',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisitorTracking` (
    `id` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `countryFlag` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `referrer` VARCHAR(191) NULL,
    `landingPage` VARCHAR(191) NULL,
    `visitedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VisitorTracking_ipAddress_idx`(`ipAddress`),
    INDEX `VisitorTracking_visitedAt_idx`(`visitedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `User_role_idx` ON `User`(`role`);

-- CreateIndex
CREATE INDEX `User_email_idx` ON `User`(`email`);

-- AddForeignKey
ALTER TABLE `Company` ADD CONSTRAINT `Company_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
