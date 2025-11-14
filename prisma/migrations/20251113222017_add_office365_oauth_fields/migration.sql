-- AlterTable
ALTER TABLE `EmailProvider` ADD COLUMN `office365ClientId` VARCHAR(191) NULL,
    ADD COLUMN `office365ClientSecret` VARCHAR(191) NULL,
    ADD COLUMN `office365FromEmail` VARCHAR(191) NULL,
    ADD COLUMN `office365TenantId` VARCHAR(191) NULL;
