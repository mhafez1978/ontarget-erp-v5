-- AlterTable
ALTER TABLE `Project` ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `Project_companyId_status_sortOrder_idx` ON `Project`(`companyId`, `status`, `sortOrder`);
