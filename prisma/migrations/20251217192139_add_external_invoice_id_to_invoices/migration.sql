-- AlterTable
ALTER TABLE `Invoice` ADD COLUMN `externalInvoiceId` VARCHAR(191) NULL,
    ADD COLUMN `externalInvoiceUrl` VARCHAR(191) NULL;
