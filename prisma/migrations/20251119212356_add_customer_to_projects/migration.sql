-- AlterTable
ALTER TABLE `Project` ADD COLUMN `customerId` VARCHAR(191) NULL,
    ADD COLUMN `subscriberCompanyId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Project_subscriberCompanyId_idx` ON `Project`(`subscriberCompanyId`);

-- CreateIndex
CREATE INDEX `Project_customerId_idx` ON `Project`(`customerId`);

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_subscriberCompanyId_fkey` FOREIGN KEY (`subscriberCompanyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
