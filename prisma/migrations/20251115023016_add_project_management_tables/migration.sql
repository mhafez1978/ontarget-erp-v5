/*
  Warnings:

  - A unique constraint covering the columns `[verificationToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `EmailProvider` MODIFY `smtpPassword` TEXT NULL,
    MODIFY `sendgridApiKey` TEXT NULL,
    MODIFY `mailgunApiKey` TEXT NULL,
    MODIFY `awsAccessKey` TEXT NULL,
    MODIFY `awsSecretKey` TEXT NULL,
    MODIFY `office365ClientSecret` TEXT NULL,
    MODIFY `googleClientSecret` TEXT NULL,
    MODIFY `googleRefreshToken` TEXT NULL,
    MODIFY `resendApiKey` TEXT NULL;

-- AlterTable
ALTER TABLE `EmailTemplate` MODIFY `type` ENUM('PASSWORD_RESET', 'WELCOME_CUSTOMER', 'WELCOME_STAFF', 'ACCOUNT_VERIFICATION', 'VERIFY_EMAIL', 'PASSWORD_CHANGED', 'INVOICE_SENT', 'PAYMENT_RECEIVED', 'APPOINTMENT_REMINDER', 'CUSTOM') NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `mfaBackupCodes` JSON NULL,
    ADD COLUMN `mfaEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `mfaSecret` VARCHAR(191) NULL,
    ADD COLUMN `mfaSetupAt` DATETIME(3) NULL,
    ADD COLUMN `verificationToken` VARCHAR(191) NULL,
    ADD COLUMN `verificationTokenExpires` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `Team` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Team_companyId_idx`(`companyId`),
    INDEX `Team_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamMember` (
    `id` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'MANAGER', 'STAFF', 'CONTRACTOR') NOT NULL DEFAULT 'STAFF',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TeamMember_teamId_idx`(`teamId`),
    INDEX `TeamMember_staffId_idx`(`staffId`),
    INDEX `TeamMember_role_idx`(`role`),
    UNIQUE INDEX `TeamMember_teamId_staffId_key`(`teamId`, `staffId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `teamId` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `projectManagerId` VARCHAR(191) NULL,
    `teamLeadId` VARCHAR(191) NULL,
    `status` ENUM('PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PLANNING',
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Project_teamId_idx`(`teamId`),
    INDEX `Project_companyId_idx`(`companyId`),
    INDEX `Project_projectManagerId_idx`(`projectManagerId`),
    INDEX `Project_teamLeadId_idx`(`teamLeadId`),
    INDEX `Project_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Task` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `assignedToId` VARCHAR(191) NULL,
    `status` ENUM('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED') NOT NULL DEFAULT 'TODO',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `dueDate` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Task_projectId_idx`(`projectId`),
    INDEX `Task_assignedToId_idx`(`assignedToId`),
    INDEX `Task_status_idx`(`status`),
    INDEX `Task_priority_idx`(`priority`),
    INDEX `Task_order_idx`(`order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `User_verificationToken_key` ON `User`(`verificationToken`);

-- AddForeignKey
ALTER TABLE `Team` ADD CONSTRAINT `Team_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamMember` ADD CONSTRAINT `TeamMember_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamMember` ADD CONSTRAINT `TeamMember_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `CompanyStaff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_projectManagerId_fkey` FOREIGN KEY (`projectManagerId`) REFERENCES `CompanyStaff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_teamLeadId_fkey` FOREIGN KEY (`teamLeadId`) REFERENCES `CompanyStaff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `CompanyStaff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
