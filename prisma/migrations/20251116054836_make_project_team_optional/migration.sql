-- DropForeignKey
ALTER TABLE `Project` DROP FOREIGN KEY `Project_teamId_fkey`;

-- AlterTable
ALTER TABLE `Project` MODIFY `teamId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
