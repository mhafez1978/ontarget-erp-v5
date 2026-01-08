-- AlterTable
ALTER TABLE `GeneratedPageDraft` ADD COLUMN `pageId` VARCHAR(191) NULL,
    ADD COLUMN `pageSlug` VARCHAR(191) NULL,
    ADD COLUMN `pageTitle` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `GeneratedSection` ADD COLUMN `pageId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Page` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `meta` JSON NULL,
    `publishedDraftId` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Page_companyId_idx`(`companyId`),
    UNIQUE INDEX `Page_companyId_slug_key`(`companyId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NavigationItem` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `pageId` VARCHAR(191) NULL,
    `url` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `parentId` VARCHAR(191) NULL,
    `visible` BOOLEAN NOT NULL DEFAULT true,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `NavigationItem_companyId_idx`(`companyId`),
    INDEX `NavigationItem_pageId_idx`(`pageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `GeneratedPageDraft_pageId_idx` ON `GeneratedPageDraft`(`pageId`);

-- CreateIndex
CREATE INDEX `GeneratedSection_pageId_idx` ON `GeneratedSection`(`pageId`);
