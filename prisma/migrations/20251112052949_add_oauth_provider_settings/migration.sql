-- CreateTable
CREATE TABLE `OAuthProviderSetting` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `clientId` VARCHAR(191) NULL,
    `clientSecret` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `OAuthProviderSetting_provider_key`(`provider`),
    INDEX `OAuthProviderSetting_provider_idx`(`provider`),
    INDEX `OAuthProviderSetting_enabled_idx`(`enabled`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
