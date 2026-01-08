-- CreateTable
CREATE TABLE `Persona` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `promptTemplate` TEXT NULL,
    `defaultModel` VARCHAR(191) NULL,
    `promptVersion` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Persona_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompanyVocabulary` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `singularLabel` VARCHAR(191) NOT NULL,
    `pluralLabel` VARCHAR(191) NOT NULL,
    `schemaOverrides` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CompanyVocabulary_companyId_idx`(`companyId`),
    UNIQUE INDEX `CompanyVocabulary_companyId_key_key`(`companyId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GeneratedSection` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `personaId` VARCHAR(191) NULL,
    `kind` ENUM('HERO', 'ABOUT', 'MENU', 'TESTIMONIAL', 'CTA', 'GALLERY', 'SERVICES', 'FEEDBACK', 'CUSTOM') NOT NULL,
    `layout` ENUM('IMAGE_LEFT', 'IMAGE_RIGHT', 'IMAGE_CENTER', 'SPLIT', 'TEXT_ONLY', 'CTA_GRID', 'MEDIA_COVER') NULL,
    `background` ENUM('SOLID_COLOR', 'GRADIENT', 'IMAGE_COVER', 'IMAGE_COVER_OVERLAY', 'TRANSPARENT') NULL,
    `backgroundConfig` JSON NULL,
    `componentName` VARCHAR(191) NULL,
    `schema` JSON NOT NULL,
    `props` JSON NULL,
    `assets` JSON NULL,
    `variants` JSON NULL,
    `status` ENUM('PENDING', 'GENERATED', 'ACCEPTED', 'REJECTED', 'EDITED') NOT NULL DEFAULT 'PENDING',
    `generatedBy` VARCHAR(191) NULL,
    `generatedAt` DATETIME(3) NULL,
    `acceptedAt` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GeneratedSection_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GeneratedPageDraft` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `sections` JSON NOT NULL,
    `meta` JSON NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdBy` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GeneratedPageDraft_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GenerationJob` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `sectionKind` ENUM('HERO', 'ABOUT', 'MENU', 'TESTIMONIAL', 'CTA', 'GALLERY', 'SERVICES', 'FEEDBACK', 'CUSTOM') NOT NULL,
    `personaId` VARCHAR(191) NULL,
    `inputPrompt` TEXT NOT NULL,
    `status` ENUM('QUEUED', 'IN_PROGRESS', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'QUEUED',
    `logs` JSON NULL,
    `startedAt` DATETIME(3) NULL,
    `finishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GenerationJob_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceSchedule` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `timezone` VARCHAR(191) NULL,
    `recurrence` JSON NULL,
    `slots` JSON NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ServiceSchedule_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Booking` (
    `id` VARCHAR(191) NOT NULL,
    `scheduleId` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `slotStart` DATETIME(3) NOT NULL,
    `slotEnd` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Booking_scheduleId_idx`(`scheduleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Asset` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Asset_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
