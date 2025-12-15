-- AlterTable
ALTER TABLE `Product` ADD COLUMN `markupAmount` DECIMAL(13, 2) NULL,
    ADD COLUMN `markupPercent` DECIMAL(5, 2) NULL,
    ADD COLUMN `profitMarginPercent` DECIMAL(5, 2) NULL,
    ADD COLUMN `unitCost` DECIMAL(13, 2) NULL;

-- AlterTable
ALTER TABLE `Project` ADD COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    ADD COLUMN `estimatedCost` DECIMAL(13, 2) NULL,
    ADD COLUMN `estimatedMarkup` DECIMAL(13, 2) NULL,
    ADD COLUMN `featuredImage` LONGTEXT NULL,
    ADD COLUMN `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `projectType` ENUM('INTERNAL', 'COMPANY_CUSTOMER') NOT NULL DEFAULT 'INTERNAL';

-- AlterTable
ALTER TABLE `Service` ADD COLUMN `markupAmount` DECIMAL(13, 2) NULL,
    ADD COLUMN `markupPercent` DECIMAL(5, 2) NULL,
    ADD COLUMN `profitMarginPercent` DECIMAL(5, 2) NULL,
    ADD COLUMN `unitCost` DECIMAL(13, 2) NULL;

-- CreateTable
CREATE TABLE `ProjectDocument` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `url` LONGTEXT NOT NULL,
    `storageProvider` VARCHAR(191) NOT NULL,
    `documentType` ENUM('SSN_CARD', 'DRIVERS_LICENSE', 'PASSPORT', 'BIRTH_CERTIFICATE', 'WORK_AUTHORIZATION', 'W4_TAX_FORM', 'STATE_TAX_FORM', 'I9_FORM', 'DIRECT_DEPOSIT_FORM', 'EMPLOYEE_HANDBOOK_SIGNED', 'NDA_SIGNED', 'CONTRACT_SIGNED', 'INSURANCE_CARD', 'OTHER') NULL,
    `notes` TEXT NULL,
    `uploadedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProjectDocument_projectId_idx`(`projectId`),
    INDEX `ProjectDocument_uploadedById_idx`(`uploadedById`),
    INDEX `ProjectDocument_storageProvider_idx`(`storageProvider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectFinancialEntry` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `entryType` ENUM('EXPENSE', 'PURCHASE') NOT NULL,
    `description` TEXT NULL,
    `vendor` VARCHAR(191) NULL,
    `referenceId` VARCHAR(191) NULL,
    `amount` DECIMAL(13, 2) NOT NULL,
    `cost` DECIMAL(13, 2) NOT NULL,
    `markupPercent` DECIMAL(5, 2) NULL,
    `markupAmount` DECIMAL(13, 2) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `occurrenceDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `receiptUrl` LONGTEXT NULL,
    `notes` TEXT NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProjectFinancialEntry_projectId_idx`(`projectId`),
    INDEX `ProjectFinancialEntry_entryType_idx`(`entryType`),
    INDEX `ProjectFinancialEntry_createdById_idx`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Project_projectType_idx` ON `Project`(`projectType`);

-- CreateIndex
CREATE INDEX `Project_isFeatured_idx` ON `Project`(`isFeatured`);

-- AddForeignKey
ALTER TABLE `ProjectDocument` ADD CONSTRAINT `ProjectDocument_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectDocument` ADD CONSTRAINT `ProjectDocument_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `CompanyStaff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectFinancialEntry` ADD CONSTRAINT `ProjectFinancialEntry_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectFinancialEntry` ADD CONSTRAINT `ProjectFinancialEntry_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `CompanyStaff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
