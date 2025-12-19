-- CreateTable
CREATE TABLE `PlanPricing` (
    `id` VARCHAR(191) NOT NULL,
    `plan` VARCHAR(191) NOT NULL,
    `monthlyPrice` DOUBLE NOT NULL,
    `monthlyPromoPrice` DOUBLE NULL,
    `annualPrice` DOUBLE NOT NULL,
    `annualPriceMonthly` DOUBLE NOT NULL,
    `transactionFeePercent` DOUBLE NOT NULL,
    `transactionFeeFixed` DOUBLE NOT NULL,
    `baseStorageGB` INTEGER NOT NULL,
    `extraStoragePricePer100GB` DOUBLE NOT NULL,
    `extraStoragePricePerGB` DOUBLE NOT NULL,
    `isPopular` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,

    UNIQUE INDEX `PlanPricing_plan_key`(`plan`),
    INDEX `PlanPricing_plan_idx`(`plan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
