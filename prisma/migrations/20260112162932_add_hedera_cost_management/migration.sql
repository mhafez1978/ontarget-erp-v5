-- AlterTable
ALTER TABLE `CompanyHederaSetting` ADD COLUMN `budgetExceeded` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `budgetResetDate` DATETIME(3) NULL,
    ADD COLUMN `currentMonthSpent` DECIMAL(20, 8) NOT NULL DEFAULT 0,
    ADD COLUMN `monthlyBudgetHbar` DECIMAL(20, 8) NULL,
    ADD COLUMN `transactionCount` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `HederaSetting` ADD COLUMN `balanceAlertSent` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `currentBalance` DECIMAL(20, 8) NULL,
    ADD COLUMN `estimatedCostPerTx` DECIMAL(20, 8) NOT NULL DEFAULT 0.0001,
    ADD COLUMN `lastBalanceCheck` DATETIME(3) NULL,
    ADD COLUMN `lowBalanceThreshold` DECIMAL(20, 8) NOT NULL DEFAULT 10,
    ADD COLUMN `totalCostHbar` DECIMAL(20, 8) NOT NULL DEFAULT 0,
    ADD COLUMN `totalTransactions` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `HederaTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `hash` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NOT NULL,
    `transactionId` VARCHAR(191) NULL,
    `consensusTimestamp` DATETIME(3) NULL,
    `costHbar` DECIMAL(20, 8) NULL,
    `balanceAfter` DECIMAL(20, 8) NULL,
    `auditLogId` VARCHAR(191) NULL,
    `outboxJobId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HederaTransaction_hash_key`(`hash`),
    INDEX `HederaTransaction_companyId_idx`(`companyId`),
    INDEX `HederaTransaction_hash_idx`(`hash`),
    INDEX `HederaTransaction_status_idx`(`status`),
    INDEX `HederaTransaction_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HederaCostAlert` (
    `id` VARCHAR(191) NOT NULL,
    `alertType` VARCHAR(191) NOT NULL,
    `severity` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `acknowledged` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HederaCostAlert_alertType_idx`(`alertType`),
    INDEX `HederaCostAlert_acknowledged_idx`(`acknowledged`),
    INDEX `HederaCostAlert_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
