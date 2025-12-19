-- CreateTable
CREATE TABLE `OAuthOnboarding` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `requestedPlan` VARCHAR(191) NULL,
    `context` VARCHAR(191) NOT NULL DEFAULT 'root',
    `companyId` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `isUsed` BOOLEAN NOT NULL DEFAULT false,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `OAuthOnboarding_token_key`(`token`),
    UNIQUE INDEX `OAuthOnboarding_userId_key`(`userId`),
    INDEX `OAuthOnboarding_token_idx`(`token`),
    INDEX `OAuthOnboarding_userId_idx`(`userId`),
    INDEX `OAuthOnboarding_expiresAt_idx`(`expiresAt`),
    INDEX `OAuthOnboarding_isUsed_idx`(`isUsed`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OAuthOnboarding` ADD CONSTRAINT `OAuthOnboarding_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
