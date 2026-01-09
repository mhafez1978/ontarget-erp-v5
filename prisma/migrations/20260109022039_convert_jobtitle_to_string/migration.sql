/*
  Warnings:

  - You are about to alter the column `jobTitle` on the `CompanyStaff` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(45))` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `CompanyStaff` MODIFY `jobTitle` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `CompanyStaff_jobTitle_idx` ON `CompanyStaff`(`jobTitle`);
