/*
  Warnings:

  - The values [GUEST] on the enum `Subscription_plan` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `role` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(25))` to `Enum(EnumId(0))`.
  - The values [GUEST] on the enum `Subscription_plan` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Subscription` MODIFY `plan` ENUM('SUPER_USER', 'COMPANY_CUSTOMER', 'ESSENTIAL', 'GROWTH', 'ENTERPRISE') NOT NULL DEFAULT 'ESSENTIAL';

-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'ERP_CUSTOMER', 'COMPANY_CUSTOMER', 'CONTRACTOR', 'SUPPLIER') NOT NULL DEFAULT 'ERP_CUSTOMER',
    MODIFY `plan` ENUM('SUPER_USER', 'COMPANY_CUSTOMER', 'ESSENTIAL', 'GROWTH', 'ENTERPRISE') NOT NULL DEFAULT 'COMPANY_CUSTOMER';
