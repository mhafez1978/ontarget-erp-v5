-- AlterTable
ALTER TABLE `CompanyStaff` ADD COLUMN `bio` TEXT NULL,
    ADD COLUMN `displayOrder` INTEGER NULL DEFAULT 0,
    ADD COLUMN `isFeatured` BOOLEAN NOT NULL DEFAULT false;
