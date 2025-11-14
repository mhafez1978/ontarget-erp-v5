/*
  Warnings:

  - You are about to drop the column `address` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `postalCode` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `Company` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Company` DROP COLUMN `address`,
    DROP COLUMN `city`,
    DROP COLUMN `country`,
    DROP COLUMN `postalCode`,
    DROP COLUMN `state`;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `password` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `CompanyMember` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'MANAGER', 'STAFF', 'CONTRACTOR', 'SUPPLIER') NOT NULL DEFAULT 'STAFF',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CompanyMember_userId_idx`(`userId`),
    INDEX `CompanyMember_companyId_idx`(`companyId`),
    INDEX `CompanyMember_role_idx`(`role`),
    UNIQUE INDEX `CompanyMember_userId_companyId_key`(`userId`, `companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CompanyMember` ADD CONSTRAINT `CompanyMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompanyMember` ADD CONSTRAINT `CompanyMember_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
