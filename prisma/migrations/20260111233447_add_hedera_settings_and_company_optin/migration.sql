-- AlterTable
ALTER TABLE `GeneratedSection` MODIFY `kind` ENUM('HERO', 'ABOUT', 'FOOD_MENU', 'LOGGED_IN_TOP_NAVBAR', 'LOGGED_OUT_TOP_NAVBAR', 'LOGGED_IN_SIDE_NAVBAR', 'LOGGED_OUT_SIDE_NAVBAR', 'LOGGED_IN_MOBILE_NAVBAR', 'LOGGED_OUT_MOBILE_NAVBAR', 'TESTIMONIAL', 'CTA', 'GALLERY', 'SERVICES', 'FEEDBACK', 'CUSTOM', 'PRODUCTS', 'TEAM', 'PRICING', 'FAQ', 'CONTACT', 'VALUE_PROP', 'CTA_PRIMARY', 'LEAD_CAPTURE', 'COMPARISON', 'CASE_STUDIES', 'CLIENT_LOGOS') NOT NULL;

-- AlterTable
ALTER TABLE `GenerationJob` MODIFY `sectionKind` ENUM('HERO', 'ABOUT', 'FOOD_MENU', 'LOGGED_IN_TOP_NAVBAR', 'LOGGED_OUT_TOP_NAVBAR', 'LOGGED_IN_SIDE_NAVBAR', 'LOGGED_OUT_SIDE_NAVBAR', 'LOGGED_IN_MOBILE_NAVBAR', 'LOGGED_OUT_MOBILE_NAVBAR', 'TESTIMONIAL', 'CTA', 'GALLERY', 'SERVICES', 'FEEDBACK', 'CUSTOM', 'PRODUCTS', 'TEAM', 'PRICING', 'FAQ', 'CONTACT', 'VALUE_PROP', 'CTA_PRIMARY', 'LEAD_CAPTURE', 'COMPARISON', 'CASE_STUDIES', 'CLIENT_LOGOS') NOT NULL;

-- CreateTable
CREATE TABLE `HederaSetting` (
    `id` VARCHAR(191) NOT NULL,
    `scope` VARCHAR(191) NOT NULL DEFAULT 'GLOBAL',
    `hederaAccount` TEXT NULL,
    `hederaKey` TEXT NULL,
    `topicId` VARCHAR(191) NULL,
    `hashSalt` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `useTestnet` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `HederaSetting_scope_idx`(`scope`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompanyHederaSetting` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `historicalAnchored` BOOLEAN NOT NULL DEFAULT false,
    `historicalJobId` VARCHAR(191) NULL,
    `enabledById` VARCHAR(191) NULL,
    `enabledAt` DATETIME(3) NULL,

    UNIQUE INDEX `CompanyHederaSetting_companyId_key`(`companyId`),
    INDEX `CompanyHederaSetting_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HederaCompanyAudit` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `actorId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HederaCompanyAudit_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CompanyHederaSetting` ADD CONSTRAINT `CompanyHederaSetting_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
