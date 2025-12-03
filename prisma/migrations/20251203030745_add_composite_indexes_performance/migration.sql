-- AlterTable
ALTER TABLE `Company` ADD COLUMN `industry` VARCHAR(191) NULL,
    ADD COLUMN `storeBlogEnabled` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `CompanyStaff` ADD COLUMN `currency` VARCHAR(191) NULL DEFAULT 'USD',
    ADD COLUMN `employmentClassification` VARCHAR(191) NULL,
    ADD COLUMN `payFrequency` VARCHAR(191) NULL DEFAULT 'HOURLY',
    ADD COLUMN `payRate` DECIMAL(10, 2) NULL,
    ADD COLUMN `payrollJurisdictionId` VARCHAR(191) NULL,
    ADD COLUMN `taxWithholdingConfig` JSON NULL;

-- AlterTable
ALTER TABLE `PayrollEntry` ADD COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    ADD COLUMN `deductionsBreakdown` JSON NULL,
    ADD COLUMN `hoursWorked` DECIMAL(8, 2) NULL,
    ADD COLUMN `jurisdictionId` VARCHAR(191) NULL,
    ADD COLUMN `overtimeHours` DECIMAL(8, 2) NULL;

-- CreateTable
CREATE TABLE `AiStorefrontGenerationLog` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `plan` ENUM('SUPER_USER', 'GUEST', 'COMPANY_CUSTOMER', 'ESSENTIAL', 'GROWTH', 'ENTERPRISE') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AiStorefrontGenerationLog_companyId_createdAt_idx`(`companyId`, `createdAt`),
    INDEX `AiStorefrontGenerationLog_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorefrontPost` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `excerpt` TEXT NULL,
    `content` TEXT NOT NULL,
    `heroImage` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `tags` TEXT NULL,
    `seoTitle` VARCHAR(191) NULL,
    `seoDescription` TEXT NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StorefrontPost_companyId_idx`(`companyId`),
    INDEX `StorefrontPost_status_idx`(`status`),
    UNIQUE INDEX `StorefrontPost_companyId_slug_key`(`companyId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupportArticle` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `summary` TEXT NULL,
    `category` VARCHAR(191) NULL,
    `tags` TEXT NULL,
    `featuredImage` LONGTEXT NULL,
    `content` LONGTEXT NOT NULL,
    `isGlobal` BOOLEAN NOT NULL DEFAULT false,
    `readTimeMinutes` INTEGER NOT NULL DEFAULT 5,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PUBLISHED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SupportArticle_companyId_idx`(`companyId`),
    INDEX `SupportArticle_authorId_idx`(`authorId`),
    INDEX `SupportArticle_status_idx`(`status`),
    UNIQUE INDEX `SupportArticle_companyId_slug_key`(`companyId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiProviderSetting` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL DEFAULT 'openai',
    `scope` VARCHAR(191) NOT NULL DEFAULT 'GLOBAL',
    `apiKey` TEXT NOT NULL,
    `model` VARCHAR(191) NULL,
    `apiBase` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AiProviderSetting_scope_provider_idx`(`scope`, `provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TimeEntry` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `clockIn` DATETIME(3) NOT NULL,
    `clockOut` DATETIME(3) NULL,
    `breakStart` DATETIME(3) NULL,
    `breakEnd` DATETIME(3) NULL,
    `breakMinutes` INTEGER NOT NULL DEFAULT 0,
    `totalMinutes` INTEGER NULL,
    `totalHours` DECIMAL(5, 2) NULL,
    `status` ENUM('CLOCKED_IN', 'ON_BREAK', 'CLOCKED_OUT') NOT NULL DEFAULT 'CLOCKED_IN',
    `notes` TEXT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `isApproved` BOOLEAN NOT NULL DEFAULT false,
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `payrollEntryId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TimeEntry_staffId_idx`(`staffId`),
    INDEX `TimeEntry_companyId_idx`(`companyId`),
    INDEX `TimeEntry_clockIn_idx`(`clockIn`),
    INDEX `TimeEntry_status_idx`(`status`),
    INDEX `TimeEntry_isApproved_idx`(`isApproved`),
    INDEX `TimeEntry_payrollEntryId_idx`(`payrollEntryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PayrollJurisdiction` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `countryCode` VARCHAR(191) NOT NULL,
    `regionCode` VARCHAR(191) NULL,
    `taxConfig` JSON NOT NULL,
    `requiredForms` JSON NULL,
    `filingFrequency` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PayrollJurisdiction_code_key`(`code`),
    INDEX `PayrollJurisdiction_countryCode_idx`(`countryCode`),
    INDEX `PayrollJurisdiction_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_CompanyToPayrollJurisdiction` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_CompanyToPayrollJurisdiction_AB_unique`(`A`, `B`),
    INDEX `_CompanyToPayrollJurisdiction_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `AuditLog_companyId_createdAt_idx` ON `AuditLog`(`companyId`, `createdAt`);

-- CreateIndex
CREATE INDEX `Cart_userId_companyId_idx` ON `Cart`(`userId`, `companyId`);

-- CreateIndex
CREATE INDEX `CompanyMember_companyId_role_idx` ON `CompanyMember`(`companyId`, `role`);

-- CreateIndex
CREATE INDEX `CompanyStaff_payrollJurisdictionId_idx` ON `CompanyStaff`(`payrollJurisdictionId`);

-- CreateIndex
CREATE INDEX `FailedLoginAttempt_ipAddress_attemptedAt_idx` ON `FailedLoginAttempt`(`ipAddress`, `attemptedAt`);

-- CreateIndex
CREATE INDEX `FailedLoginAttempt_email_attemptedAt_idx` ON `FailedLoginAttempt`(`email`, `attemptedAt`);

-- CreateIndex
CREATE INDEX `PayrollEntry_jurisdictionId_idx` ON `PayrollEntry`(`jurisdictionId`);

-- CreateIndex
CREATE INDEX `Project_companyId_status_idx` ON `Project`(`companyId`, `status`);

-- CreateIndex
CREATE INDEX `Session_userId_expires_idx` ON `Session`(`userId`, `expires`);

-- CreateIndex
CREATE INDEX `StorefrontOrder_companyId_status_idx` ON `StorefrontOrder`(`companyId`, `status`);

-- CreateIndex
CREATE INDEX `StorefrontOrder_companyId_createdAt_idx` ON `StorefrontOrder`(`companyId`, `createdAt`);

-- CreateIndex
CREATE INDEX `Subscription_subscriberCompanyId_status_idx` ON `Subscription`(`subscriberCompanyId`, `status`);

-- AddForeignKey
ALTER TABLE `AiStorefrontGenerationLog` ADD CONSTRAINT `AiStorefrontGenerationLog_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiStorefrontGenerationLog` ADD CONSTRAINT `AiStorefrontGenerationLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorefrontPost` ADD CONSTRAINT `StorefrontPost_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorefrontPost` ADD CONSTRAINT `StorefrontPost_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportArticle` ADD CONSTRAINT `SupportArticle_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportArticle` ADD CONSTRAINT `SupportArticle_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompanyStaff` ADD CONSTRAINT `CompanyStaff_payrollJurisdictionId_fkey` FOREIGN KEY (`payrollJurisdictionId`) REFERENCES `PayrollJurisdiction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimeEntry` ADD CONSTRAINT `TimeEntry_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `CompanyStaff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimeEntry` ADD CONSTRAINT `TimeEntry_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimeEntry` ADD CONSTRAINT `TimeEntry_payrollEntryId_fkey` FOREIGN KEY (`payrollEntryId`) REFERENCES `PayrollEntry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayrollEntry` ADD CONSTRAINT `PayrollEntry_jurisdictionId_fkey` FOREIGN KEY (`jurisdictionId`) REFERENCES `PayrollJurisdiction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CompanyToPayrollJurisdiction` ADD CONSTRAINT `_CompanyToPayrollJurisdiction_A_fkey` FOREIGN KEY (`A`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CompanyToPayrollJurisdiction` ADD CONSTRAINT `_CompanyToPayrollJurisdiction_B_fkey` FOREIGN KEY (`B`) REFERENCES `PayrollJurisdiction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
