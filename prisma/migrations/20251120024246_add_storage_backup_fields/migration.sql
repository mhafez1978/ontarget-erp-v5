-- AlterTable
ALTER TABLE `Company` ADD COLUMN `storageBackupEnabled` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `StorageProvider` ADD COLUMN `enableGlobalBackup` BOOLEAN NOT NULL DEFAULT false;
