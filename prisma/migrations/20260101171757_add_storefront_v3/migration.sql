-- CreateTable
CREATE TABLE `StorefrontWebsiteV3` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `websiteData` JSON NOT NULL,
    `qualityScore` INTEGER NOT NULL,
    `seoCompliant` BOOLEAN NOT NULL DEFAULT false,
    `accessibilityCompliant` BOOLEAN NOT NULL DEFAULT false,
    `validationWarnings` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `generatedBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `publishedAt` DATETIME(3) NULL,

    INDEX `StorefrontWebsiteV3_companyId_idx`(`companyId`),
    INDEX `StorefrontWebsiteV3_companyId_isActive_idx`(`companyId`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StorefrontWebsiteV3` ADD CONSTRAINT `StorefrontWebsiteV3_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
