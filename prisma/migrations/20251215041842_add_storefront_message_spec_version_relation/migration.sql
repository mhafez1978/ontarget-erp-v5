-- CreateIndex
CREATE INDEX `StorefrontMessage_specVersionId_idx` ON `StorefrontMessage`(`specVersionId`);

-- AddForeignKey
ALTER TABLE `StorefrontMessage` ADD CONSTRAINT `StorefrontMessage_specVersionId_fkey` FOREIGN KEY (`specVersionId`) REFERENCES `StorefrontSpecVersion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
