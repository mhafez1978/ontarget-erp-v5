-- AlterTable
ALTER TABLE `Company` ADD COLUMN `aiStorefrontEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `aiStorefrontSpec` JSON NULL;
