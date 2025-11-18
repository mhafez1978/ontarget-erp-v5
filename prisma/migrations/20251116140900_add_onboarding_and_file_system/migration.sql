-- CreateTable
CREATE TABLE `OnboardingToken` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `isUsed` BOOLEAN NOT NULL DEFAULT false,
    `step1Complete` BOOLEAN NOT NULL DEFAULT false,
    `step2Complete` BOOLEAN NOT NULL DEFAULT false,
    `step3Complete` BOOLEAN NOT NULL DEFAULT false,
    `step4Complete` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `OnboardingToken_token_key`(`token`),
    UNIQUE INDEX `OnboardingToken_staffId_key`(`staffId`),
    INDEX `OnboardingToken_token_idx`(`token`),
    INDEX `OnboardingToken_staffId_idx`(`staffId`),
    INDEX `OnboardingToken_expiresAt_idx`(`expiresAt`),
    INDEX `OnboardingToken_isUsed_idx`(`isUsed`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FileFolder` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `type` ENUM('SHARED', 'EMPLOYEE', 'CONTRACTOR', 'CUSTOM') NOT NULL DEFAULT 'CUSTOM',
    `ownerId` VARCHAR(191) NULL,
    `isPasswordProtected` BOOLEAN NOT NULL DEFAULT false,
    `passwordHash` VARCHAR(191) NULL,
    `fileCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FileFolder_companyId_idx`(`companyId`),
    INDEX `FileFolder_parentId_idx`(`parentId`),
    INDEX `FileFolder_type_idx`(`type`),
    INDEX `FileFolder_ownerId_idx`(`ownerId`),
    UNIQUE INDEX `FileFolder_companyId_path_key`(`companyId`, `path`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FileRecord` (
    `id` VARCHAR(191) NOT NULL,
    `folderId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `primaryPath` VARCHAR(191) NOT NULL,
    `backupPath` VARCHAR(191) NULL,
    `storageProvider` VARCHAR(191) NOT NULL,
    `uploadedById` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `tags` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FileRecord_folderId_idx`(`folderId`),
    INDEX `FileRecord_uploadedById_idx`(`uploadedById`),
    INDEX `FileRecord_fileName_idx`(`fileName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OnboardingToken` ADD CONSTRAINT `OnboardingToken_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `CompanyStaff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileFolder` ADD CONSTRAINT `FileFolder_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileFolder` ADD CONSTRAINT `FileFolder_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `FileFolder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileRecord` ADD CONSTRAINT `FileRecord_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `FileFolder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileRecord` ADD CONSTRAINT `FileRecord_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
