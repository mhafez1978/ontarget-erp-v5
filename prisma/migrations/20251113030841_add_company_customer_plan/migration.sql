/*
  Warnings:

  - Made the column `plan` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Subscription` MODIFY `plan` ENUM('COMPANY_CUSTOMER', 'ESSENTIAL', 'GROWTH', 'ENTERPRISE') NOT NULL DEFAULT 'ESSENTIAL';

-- AlterTable
ALTER TABLE `User` MODIFY `plan` ENUM('COMPANY_CUSTOMER', 'ESSENTIAL', 'GROWTH', 'ENTERPRISE') NOT NULL DEFAULT 'COMPANY_CUSTOMER';
