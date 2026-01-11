-- CreateTable
CREATE TABLE `VideoProviderConfig` (
    `id` VARCHAR(191) NOT NULL,
    `scope` VARCHAR(191) NOT NULL DEFAULT 'GLOBAL',
    `ltxApiKey` TEXT NULL,
    `ltxSecret` TEXT NULL,
    `ltxEnabled` BOOLEAN NOT NULL DEFAULT false,
    `hfApiToken` TEXT NULL,
    `hfEnabled` BOOLEAN NOT NULL DEFAULT false,
    `primaryProvider` VARCHAR(191) NULL DEFAULT 'ltx',
    `lastTestedAt` DATETIME(3) NULL,
    `isConnected` BOOLEAN NOT NULL DEFAULT false,
    `lastError` TEXT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VideoProviderConfig_scope_idx`(`scope`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
