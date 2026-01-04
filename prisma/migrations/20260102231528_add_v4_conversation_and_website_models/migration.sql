-- CreateTable
CREATE TABLE `V4Conversation` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `phase` VARCHAR(191) NOT NULL DEFAULT 'greeting',
    `heroStyle` VARCHAR(191) NULL,
    `primaryColor` VARCHAR(191) NULL,
    `secondaryColor` VARCHAR(191) NULL,
    `accentColor` VARCHAR(191) NULL,
    `fontPairing` VARCHAR(191) NULL,
    `designStyle` VARCHAR(191) NULL,
    `sections` JSON NULL,
    `isComplete` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `V4Conversation_companyId_idx`(`companyId`),
    INDEX `V4Conversation_userId_idx`(`userId`),
    INDEX `V4Conversation_companyId_isComplete_idx`(`companyId`, `isComplete`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `V4Message` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `phase` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `V4Message_conversationId_idx`(`conversationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `V4Website` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `websiteData` JSON NOT NULL,
    `preferences` JSON NOT NULL,
    `qualityScore` DOUBLE NOT NULL DEFAULT 0,
    `creativityScore` DOUBLE NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `V4Website_companyId_idx`(`companyId`),
    INDEX `V4Website_conversationId_idx`(`conversationId`),
    INDEX `V4Website_userId_idx`(`userId`),
    INDEX `V4Website_companyId_isActive_idx`(`companyId`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `V4Conversation` ADD CONSTRAINT `V4Conversation_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `V4Conversation` ADD CONSTRAINT `V4Conversation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `V4Message` ADD CONSTRAINT `V4Message_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `V4Conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `V4Website` ADD CONSTRAINT `V4Website_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `V4Website` ADD CONSTRAINT `V4Website_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `V4Conversation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `V4Website` ADD CONSTRAINT `V4Website_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
