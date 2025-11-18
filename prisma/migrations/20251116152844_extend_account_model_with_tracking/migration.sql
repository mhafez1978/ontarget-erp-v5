-- AlterTable
ALTER TABLE `Account` ADD COLUMN `avatarUrl` VARCHAR(191) NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `displayName` VARCHAR(191) NULL,
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lastUsedAt` DATETIME(3) NULL,
    ADD COLUMN `linkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `profileUrl` VARCHAR(191) NULL,
    ADD COLUMN `timesUsed` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE INDEX `Account_provider_idx` ON `Account`(`provider`);

-- CreateIndex
CREATE INDEX `Account_isPrimary_idx` ON `Account`(`isPrimary`);

-- CreateIndex
CREATE INDEX `Account_lastUsedAt_idx` ON `Account`(`lastUsedAt`);
