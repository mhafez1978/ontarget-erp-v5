-- AlterTable
ALTER TABLE `Company` ADD COLUMN `isRoot` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `Subscription` (
    `id` VARCHAR(191) NOT NULL,
    `rootCompanyId` VARCHAR(191) NOT NULL,
    `subscriberCompanyId` VARCHAR(191) NOT NULL,
    `plan` ENUM('ESSENTIAL', 'GROWTH', 'ENTERPRISE') NOT NULL DEFAULT 'ESSENTIAL',
    `status` ENUM('TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED') NOT NULL DEFAULT 'TRIAL',
    `trialEndsAt` DATETIME(3) NULL,
    `billingCycleStart` DATETIME(3) NULL,
    `billingCycleEnd` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Subscription_rootCompanyId_idx`(`rootCompanyId`),
    INDEX `Subscription_subscriberCompanyId_idx`(`subscriberCompanyId`),
    INDEX `Subscription_status_idx`(`status`),
    INDEX `Subscription_plan_idx`(`plan`),
    INDEX `Subscription_trialEndsAt_idx`(`trialEndsAt`),
    UNIQUE INDEX `Subscription_rootCompanyId_subscriberCompanyId_key`(`rootCompanyId`, `subscriberCompanyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Company_isRoot_idx` ON `Company`(`isRoot`);

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_rootCompanyId_fkey` FOREIGN KEY (`rootCompanyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_subscriberCompanyId_fkey` FOREIGN KEY (`subscriberCompanyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
