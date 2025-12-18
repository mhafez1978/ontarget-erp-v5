/*
  Warnings:

  - A unique constraint covering the columns `[externalInvoiceId]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE `CustomerPaymentProvider` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `provider` ENUM('STRIPE', 'PAYPAL', 'OTHER') NOT NULL,
    `externalId` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CustomerPaymentProvider_userId_idx`(`userId`),
    UNIQUE INDEX `CustomerPaymentProvider_provider_externalId_key`(`provider`, `externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Invoice_externalInvoiceId_key` ON `Invoice`(`externalInvoiceId`);

-- AddForeignKey
ALTER TABLE `CustomerPaymentProvider` ADD CONSTRAINT `CustomerPaymentProvider_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
