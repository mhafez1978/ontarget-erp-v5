-- AlterTable
ALTER TABLE `GeoTrackingSetting` ADD COLUMN `apiKey` TEXT NULL,
    ADD COLUMN `provider` VARCHAR(191) NOT NULL DEFAULT 'IP_API',
    MODIFY `apiUrl` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `GeoTrackingSetting_enabled_idx` ON `GeoTrackingSetting`(`enabled`);

-- CreateIndex
CREATE INDEX `GeoTrackingSetting_provider_idx` ON `GeoTrackingSetting`(`provider`);
