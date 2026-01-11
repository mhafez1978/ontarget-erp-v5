-- CreateTable
CREATE TABLE `VideoGenerationJob` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NOT NULL,
    `variantId` VARCHAR(191) NOT NULL,
    `prompt` TEXT NOT NULL,
    `duration` INTEGER NULL DEFAULT 4,
    `resolution` VARCHAR(191) NULL DEFAULT '1920x1080',
    `status` VARCHAR(191) NOT NULL DEFAULT 'QUEUED',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `provider` VARCHAR(191) NULL,
    `resultUrl` TEXT NULL,
    `error` TEXT NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VideoGenerationJob_companyId_idx`(`companyId`),
    INDEX `VideoGenerationJob_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VideoGenerationLog` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `level` VARCHAR(191) NOT NULL DEFAULT 'info',
    `message` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VideoGenerationLog_jobId_idx`(`jobId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `VideoGenerationLog` ADD CONSTRAINT `VideoGenerationLog_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `VideoGenerationJob`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
