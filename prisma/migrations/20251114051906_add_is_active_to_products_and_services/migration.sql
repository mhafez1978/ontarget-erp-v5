-- AlterTable
ALTER TABLE `Product` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `Service` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX `Product_isActive_idx` ON `Product`(`isActive`);

-- CreateIndex
CREATE INDEX `Service_isActive_idx` ON `Service`(`isActive`);
