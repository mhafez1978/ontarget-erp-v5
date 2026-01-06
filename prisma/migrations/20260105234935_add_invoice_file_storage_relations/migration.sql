/*
  Warnings:

  - A unique constraint covering the columns `[fileRecordId]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `FileRecord` DROP FOREIGN KEY `FileRecord_uploadedById_fkey`;

-- AlterTable
ALTER TABLE `FileRecord` MODIFY `uploadedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Invoice` ADD COLUMN `fileRecordId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Invoice_fileRecordId_key` ON `Invoice`(`fileRecordId`);

-- CreateIndex
CREATE INDEX `Invoice_fileRecordId_idx` ON `Invoice`(`fileRecordId`);

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_fileRecordId_fkey` FOREIGN KEY (`fileRecordId`) REFERENCES `FileRecord`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileRecord` ADD CONSTRAINT `FileRecord_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
