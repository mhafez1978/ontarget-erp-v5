-- CreateTable
CREATE TABLE `CompanyStaff` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'MANAGER', 'STAFF', 'CONTRACTOR', 'SUPPLIER') NOT NULL DEFAULT 'STAFF',
    `employmentType` ENUM('FULL_TIME', 'PART_TIME', 'CONTRACTOR_1099', 'SEASONAL') NOT NULL DEFAULT 'FULL_TIME',
    `status` ENUM('ACTIVE', 'ON_LEAVE', 'TERMINATED', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `hireDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `terminationDate` DATETIME(3) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `countryCode` VARCHAR(191) NULL,
    `countryFlag` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CompanyStaff_userId_idx`(`userId`),
    INDEX `CompanyStaff_companyId_idx`(`companyId`),
    INDEX `CompanyStaff_role_idx`(`role`),
    INDEX `CompanyStaff_employmentType_idx`(`employmentType`),
    INDEX `CompanyStaff_status_idx`(`status`),
    INDEX `CompanyStaff_hireDate_idx`(`hireDate`),
    UNIQUE INDEX `CompanyStaff_userId_companyId_key`(`userId`, `companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CompanyStaff` ADD CONSTRAINT `CompanyStaff_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompanyStaff` ADD CONSTRAINT `CompanyStaff_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
