-- CreateTable
CREATE TABLE `CompanyOAuthSetting` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `clientId` VARCHAR(191) NULL,
    `clientSecret` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CompanyOAuthSetting_companyId_idx`(`companyId`),
    INDEX `CompanyOAuthSetting_provider_idx`(`provider`),
    INDEX `CompanyOAuthSetting_enabled_idx`(`enabled`),
    UNIQUE INDEX `CompanyOAuthSetting_companyId_provider_key`(`companyId`, `provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CompanyOAuthSetting` ADD CONSTRAINT `CompanyOAuthSetting_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
