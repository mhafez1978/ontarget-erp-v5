-- AlterTable
ALTER TABLE `Product` ADD COLUMN `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isPublished` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `Service` ADD COLUMN `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isPublished` BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX `Product_isPublished_idx` ON `Product`(`isPublished`);

-- CreateIndex
CREATE INDEX `Product_isFeatured_idx` ON `Product`(`isFeatured`);

-- CreateIndex
CREATE INDEX `Service_isPublished_idx` ON `Service`(`isPublished`);

-- CreateIndex
CREATE INDEX `Service_isFeatured_idx` ON `Service`(`isFeatured`);
