-- AlterTable
ALTER TABLE `User` ADD COLUMN `authMethod` VARCHAR(191) NOT NULL DEFAULT 'credentials';
