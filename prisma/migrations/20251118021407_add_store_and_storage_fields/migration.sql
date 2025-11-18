/*
  Warnings:

  - You are about to drop the column `issuedAt` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `ledgerId` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `paidAmount` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `pdfUrl` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `stripeChargeId` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `stripePaymentIntentId` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `taxAmount` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `Invoice` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subdomain]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[customDomain]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `amount` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `items` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Made the column `dueDate` on table `Invoice` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Invoice` DROP FOREIGN KEY `Invoice_ledgerId_fkey`;

-- DropForeignKey
ALTER TABLE `Invoice` DROP FOREIGN KEY `Invoice_orderId_fkey`;

-- DropIndex
DROP INDEX `Invoice_ledgerId_idx` ON `Invoice`;

-- DropIndex
DROP INDEX `Invoice_orderId_idx` ON `Invoice`;

-- AlterTable
ALTER TABLE `Company` ADD COLUMN `customDomain` VARCHAR(191) NULL,
    ADD COLUMN `isStoreEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `slug` VARCHAR(191) NULL,
    ADD COLUMN `storeBanner` VARCHAR(191) NULL,
    ADD COLUMN `storeConfiguredAt` DATETIME(3) NULL,
    ADD COLUMN `storeConfiguredBy` VARCHAR(191) NULL,
    ADD COLUMN `storeMetadata` JSON NULL,
    ADD COLUMN `storeTheme` VARCHAR(191) NULL DEFAULT 'default',
    ADD COLUMN `subdomain` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `CompanyStaff` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `Invoice` DROP COLUMN `issuedAt`,
    DROP COLUMN `ledgerId`,
    DROP COLUMN `orderId`,
    DROP COLUMN `paidAmount`,
    DROP COLUMN `pdfUrl`,
    DROP COLUMN `stripeChargeId`,
    DROP COLUMN `stripePaymentIntentId`,
    DROP COLUMN `taxAmount`,
    DROP COLUMN `totalAmount`,
    ADD COLUMN `amount` DECIMAL(10, 2) NOT NULL,
    ADD COLUMN `companyId` VARCHAR(191) NOT NULL,
    ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `customerPhone` VARCHAR(191) NULL,
    ADD COLUMN `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `internalNotes` TEXT NULL,
    ADD COLUMN `issueDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `items` JSON NOT NULL,
    ADD COLUMN `sentAt` DATETIME(3) NULL,
    ADD COLUMN `tax` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `terms` TEXT NULL,
    ADD COLUMN `total` DECIMAL(10, 2) NOT NULL,
    ADD COLUMN `type` ENUM('SUBSCRIPTION', 'STOREFRONT', 'CUSTOM', 'RECURRING') NOT NULL DEFAULT 'CUSTOM',
    ADD COLUMN `userId` VARCHAR(191) NULL,
    MODIFY `dueDate` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `Subscription` MODIFY `plan` ENUM('SUPER_USER', 'GUEST', 'COMPANY_CUSTOMER', 'ESSENTIAL', 'GROWTH', 'ENTERPRISE') NOT NULL DEFAULT 'ESSENTIAL';

-- AlterTable
ALTER TABLE `User` MODIFY `plan` ENUM('SUPER_USER', 'GUEST', 'COMPANY_CUSTOMER', 'ESSENTIAL', 'GROWTH', 'ENTERPRISE') NOT NULL DEFAULT 'GUEST';

-- CreateTable
CREATE TABLE `Cart` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Cart_sessionId_key`(`sessionId`),
    INDEX `Cart_sessionId_idx`(`sessionId`),
    INDEX `Cart_userId_idx`(`userId`),
    INDEX `Cart_companyId_idx`(`companyId`),
    INDEX `Cart_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CartItem` (
    `id` VARCHAR(191) NOT NULL,
    `cartId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NULL,
    `serviceId` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `price` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CartItem_cartId_idx`(`cartId`),
    INDEX `CartItem_productId_idx`(`productId`),
    INDEX `CartItem_serviceId_idx`(`serviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorefrontOrder` (
    `id` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NULL,
    `shippingAddress` JSON NULL,
    `billingAddress` JSON NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `paymentStatus` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `tax` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `shipping` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(10, 2) NOT NULL,
    `paymentMethod` VARCHAR(191) NULL,
    `paymentId` VARCHAR(191) NULL,
    `shippedAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `canceledAt` DATETIME(3) NULL,
    `customerNotes` TEXT NULL,
    `internalNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StorefrontOrder_orderNumber_key`(`orderNumber`),
    INDEX `StorefrontOrder_companyId_idx`(`companyId`),
    INDEX `StorefrontOrder_userId_idx`(`userId`),
    INDEX `StorefrontOrder_orderNumber_idx`(`orderNumber`),
    INDEX `StorefrontOrder_status_idx`(`status`),
    INDEX `StorefrontOrder_paymentStatus_idx`(`paymentStatus`),
    INDEX `StorefrontOrder_customerEmail_idx`(`customerEmail`),
    INDEX `StorefrontOrder_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorefrontOrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NULL,
    `serviceId` VARCHAR(191) NULL,
    `itemName` VARCHAR(191) NOT NULL,
    `itemSku` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StorefrontOrderItem_orderId_idx`(`orderId`),
    INDEX `StorefrontOrderItem_productId_idx`(`productId`),
    INDEX `StorefrontOrderItem_serviceId_idx`(`serviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentGateway` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT false,
    `isTestMode` BOOLEAN NOT NULL DEFAULT true,
    `publicKey` TEXT NULL,
    `secretKey` TEXT NULL,
    `webhookSecret` TEXT NULL,
    `merchantId` VARCHAR(191) NULL,
    `config` JSON NULL,
    `configuredBy` VARCHAR(191) NULL,
    `lastTestedAt` DATETIME(3) NULL,
    `lastTestResult` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PaymentGateway_companyId_idx`(`companyId`),
    INDEX `PaymentGateway_provider_idx`(`provider`),
    INDEX `PaymentGateway_isEnabled_idx`(`isEnabled`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlaidAccount` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `accessToken` TEXT NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `accountName` VARCHAR(191) NULL,
    `accountMask` VARCHAR(191) NULL,
    `accountType` VARCHAR(191) NULL,
    `accountSubtype` VARCHAR(191) NULL,
    `institutionId` VARCHAR(191) NULL,
    `institutionName` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `linkedBy` VARCHAR(191) NULL,
    `lastSyncAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PlaidAccount_companyId_idx`(`companyId`),
    INDEX `PlaidAccount_accountId_idx`(`accountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `gatewayId` VARCHAR(191) NULL,
    `invoiceId` VARCHAR(191) NULL,
    `orderId` VARCHAR(191) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `status` ENUM('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'REFUNDED', 'PARTIALLY_REFUNDED') NOT NULL DEFAULT 'PENDING',
    `paymentMethod` VARCHAR(191) NULL,
    `gatewayReference` VARCHAR(191) NULL,
    `gatewayResponse` JSON NULL,
    `customerEmail` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NULL,
    `processedAt` DATETIME(3) NULL,
    `failedAt` DATETIME(3) NULL,
    `refundedAt` DATETIME(3) NULL,
    `refundAmount` DECIMAL(10, 2) NULL,
    `refundReason` VARCHAR(191) NULL,
    `refundReference` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Payment_companyId_idx`(`companyId`),
    INDEX `Payment_gatewayId_idx`(`gatewayId`),
    INDEX `Payment_invoiceId_idx`(`invoiceId`),
    INDEX `Payment_orderId_idx`(`orderId`),
    INDEX `Payment_status_idx`(`status`),
    INDEX `Payment_paymentMethod_idx`(`paymentMethod`),
    INDEX `Payment_gatewayReference_idx`(`gatewayReference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentWebhook` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NULL,
    `payload` JSON NOT NULL,
    `signature` VARCHAR(191) NULL,
    `processed` BOOLEAN NOT NULL DEFAULT false,
    `processedAt` DATETIME(3) NULL,
    `processingError` TEXT NULL,
    `paymentId` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PaymentWebhook_eventId_key`(`eventId`),
    INDEX `PaymentWebhook_provider_idx`(`provider`),
    INDEX `PaymentWebhook_eventType_idx`(`eventType`),
    INDEX `PaymentWebhook_processed_idx`(`processed`),
    INDEX `PaymentWebhook_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LedgerInvoice` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `ledgerId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NULL,
    `customerEmail` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'DRAFT',
    `totalAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `paidAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `taxAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `paymentMethod` VARCHAR(191) NULL,
    `paidAt` DATETIME(3) NULL,
    `dueDate` DATETIME(3) NULL,
    `stripePaymentIntentId` VARCHAR(191) NULL,
    `stripeChargeId` VARCHAR(191) NULL,
    `pdfUrl` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LedgerInvoice_invoiceNumber_key`(`invoiceNumber`),
    INDEX `LedgerInvoice_ledgerId_idx`(`ledgerId`),
    INDEX `LedgerInvoice_orderId_idx`(`orderId`),
    INDEX `LedgerInvoice_status_idx`(`status`),
    INDEX `LedgerInvoice_dueDate_idx`(`dueDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Company_slug_key` ON `Company`(`slug`);

-- CreateIndex
CREATE UNIQUE INDEX `Company_subdomain_key` ON `Company`(`subdomain`);

-- CreateIndex
CREATE UNIQUE INDEX `Company_customDomain_key` ON `Company`(`customDomain`);

-- CreateIndex
CREATE INDEX `Invoice_companyId_idx` ON `Invoice`(`companyId`);

-- CreateIndex
CREATE INDEX `Invoice_userId_idx` ON `Invoice`(`userId`);

-- CreateIndex
CREATE INDEX `Invoice_invoiceNumber_idx` ON `Invoice`(`invoiceNumber`);

-- CreateIndex
CREATE INDEX `Invoice_type_idx` ON `Invoice`(`type`);

-- AddForeignKey
ALTER TABLE `Cart` ADD CONSTRAINT `Cart_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cart` ADD CONSTRAINT `Cart_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_cartId_fkey` FOREIGN KEY (`cartId`) REFERENCES `Cart`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorefrontOrder` ADD CONSTRAINT `StorefrontOrder_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorefrontOrder` ADD CONSTRAINT `StorefrontOrder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorefrontOrderItem` ADD CONSTRAINT `StorefrontOrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `StorefrontOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorefrontOrderItem` ADD CONSTRAINT `StorefrontOrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorefrontOrderItem` ADD CONSTRAINT `StorefrontOrderItem_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentGateway` ADD CONSTRAINT `PaymentGateway_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlaidAccount` ADD CONSTRAINT `PlaidAccount_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_gatewayId_fkey` FOREIGN KEY (`gatewayId`) REFERENCES `PaymentGateway`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `StorefrontOrder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LedgerInvoice` ADD CONSTRAINT `LedgerInvoice_ledgerId_fkey` FOREIGN KEY (`ledgerId`) REFERENCES `Ledger`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LedgerInvoice` ADD CONSTRAINT `LedgerInvoice_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
