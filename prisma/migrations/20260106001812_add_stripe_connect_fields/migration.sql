/*
  Warnings:

  - A unique constraint covering the columns `[stripeConnectedAccountId]` on the table `Company` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Company` ADD COLUMN `customPlatformFeePercent` DECIMAL(5, 2) NULL,
    ADD COLUMN `stripeAccountStatus` VARCHAR(191) NULL DEFAULT 'not_connected',
    ADD COLUMN `stripeConnectedAccountId` VARCHAR(191) NULL,
    ADD COLUMN `stripeOnboardedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Company_stripeConnectedAccountId_key` ON `Company`(`stripeConnectedAccountId`);
