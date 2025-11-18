-- CreateTable
CREATE TABLE `EmailTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('PASSWORD_RESET', 'WELCOME_CUSTOMER', 'WELCOME_STAFF', 'ACCOUNT_VERIFICATION', 'PASSWORD_CHANGED', 'INVOICE_SENT', 'PAYMENT_RECEIVED', 'APPOINTMENT_REMINDER', 'CUSTOM') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `bodyHtml` TEXT NOT NULL,
    `bodyText` TEXT NULL,
    `variables` JSON NULL,
    `scope` VARCHAR(191) NOT NULL DEFAULT 'GLOBAL',
    `companyId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EmailTemplate_type_idx`(`type`),
    INDEX `EmailTemplate_isActive_idx`(`isActive`),
    INDEX `EmailTemplate_scope_idx`(`scope`),
    INDEX `EmailTemplate_companyId_idx`(`companyId`),
    UNIQUE INDEX `EmailTemplate_type_scope_companyId_key`(`type`, `scope`, `companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EmailTemplate` ADD CONSTRAINT `EmailTemplate_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
