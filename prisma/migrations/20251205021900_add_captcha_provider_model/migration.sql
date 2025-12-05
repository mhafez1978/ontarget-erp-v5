-- CreateTable
CREATE TABLE `CaptchaProvider` (
    `id` VARCHAR(191) NOT NULL,
    `provider` ENUM('GOOGLE_RECAPTCHA') NOT NULL DEFAULT 'GOOGLE_RECAPTCHA',
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `siteKey` VARCHAR(191) NULL,
    `secretKey` TEXT NULL,
    `scope` VARCHAR(191) NOT NULL DEFAULT 'GLOBAL',
    `companyId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CaptchaProvider_provider_idx`(`provider`),
    INDEX `CaptchaProvider_isActive_idx`(`isActive`),
    INDEX `CaptchaProvider_scope_idx`(`scope`),
    INDEX `CaptchaProvider_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
