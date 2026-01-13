/*
  Warnings:

  - You are about to drop the column `hederaKey` on the `HederaSetting` table. All the data in the column will be lost.
  - You are about to drop the column `useTestnet` on the `HederaSetting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `HederaSetting` DROP COLUMN `hederaKey`,
    DROP COLUMN `useTestnet`,
    ADD COLUMN `evmAddress` VARCHAR(191) NULL,
    ADD COLUMN `hederaDerKey` TEXT NULL,
    ADD COLUMN `hederaDerPub` TEXT NULL,
    ADD COLUMN `hederaHexKey` TEXT NULL,
    ADD COLUMN `keyType` VARCHAR(191) NULL,
    ADD COLUMN `network` ENUM('MAINNET', 'PREVIEWNET', 'TESTNET') NOT NULL DEFAULT 'TESTNET';
