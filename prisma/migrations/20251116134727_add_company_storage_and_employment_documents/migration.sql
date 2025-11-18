-- AlterTable
ALTER TABLE `Company` ADD COLUMN `storageConfig` JSON NULL,
    ADD COLUMN `storageConfiguredAt` DATETIME(3) NULL,
    ADD COLUMN `storageConfiguredBy` VARCHAR(191) NULL,
    ADD COLUMN `storageProvider` VARCHAR(191) NULL DEFAULT 'INHERIT';

-- AlterTable
ALTER TABLE `CompanyStaff` ADD COLUMN `canReceivePayroll` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `onboardingComplete` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `EmploymentDocument` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `docType` ENUM('SSN_CARD', 'DRIVERS_LICENSE', 'PASSPORT', 'BIRTH_CERTIFICATE', 'WORK_AUTHORIZATION', 'W4_TAX_FORM', 'STATE_TAX_FORM', 'I9_FORM', 'DIRECT_DEPOSIT_FORM', 'EMPLOYEE_HANDBOOK_SIGNED', 'NDA_SIGNED', 'CONTRACT_SIGNED', 'INSURANCE_CARD', 'OTHER') NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `primaryPath` VARCHAR(191) NOT NULL,
    `backupPath` VARCHAR(191) NULL,
    `storageProvider` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `reviewedBy` VARCHAR(191) NULL,
    `rejectionReason` TEXT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EmploymentDocument_staffId_idx`(`staffId`),
    INDEX `EmploymentDocument_status_idx`(`status`),
    INDEX `EmploymentDocument_docType_idx`(`docType`),
    INDEX `EmploymentDocument_uploadedAt_idx`(`uploadedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EmploymentDocument` ADD CONSTRAINT `EmploymentDocument_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `CompanyStaff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
