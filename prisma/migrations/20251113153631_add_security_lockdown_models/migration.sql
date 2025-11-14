-- CreateTable
CREATE TABLE `FailedLoginAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NOT NULL,
    `ipv4` VARCHAR(191) NULL,
    `ipv6` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `countryCode` VARCHAR(191) NULL,
    `countryFlag` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `timezone` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `attemptedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NULL,

    INDEX `FailedLoginAttempt_email_idx`(`email`),
    INDEX `FailedLoginAttempt_ipAddress_idx`(`ipAddress`),
    INDEX `FailedLoginAttempt_attemptedAt_idx`(`attemptedAt`),
    INDEX `FailedLoginAttempt_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IpBlacklist` (
    `id` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NOT NULL,
    `ipv4` VARCHAR(191) NULL,
    `ipv6` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `countryCode` VARCHAR(191) NULL,
    `countryFlag` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `reason` VARCHAR(191) NOT NULL,
    `failedAttempts` INTEGER NOT NULL DEFAULT 0,
    `blockedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `blockedUntil` DATETIME(3) NOT NULL,
    `blockedById` VARCHAR(191) NULL,
    `isAutoBlocked` BOOLEAN NOT NULL DEFAULT true,
    `isPermanent` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `IpBlacklist_ipAddress_key`(`ipAddress`),
    INDEX `IpBlacklist_ipAddress_idx`(`ipAddress`),
    INDEX `IpBlacklist_blockedUntil_idx`(`blockedUntil`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FailedLoginAttempt` ADD CONSTRAINT `FailedLoginAttempt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IpBlacklist` ADD CONSTRAINT `IpBlacklist_blockedById_fkey` FOREIGN KEY (`blockedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
