-- AlterTable
ALTER TABLE `Session` ADD COLUMN `sessionIpv4` VARCHAR(191) NULL,
    ADD COLUMN `sessionIpv6` VARCHAR(191) NULL;
