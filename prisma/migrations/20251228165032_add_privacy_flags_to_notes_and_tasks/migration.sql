-- AlterTable
ALTER TABLE `ProjectNote` ADD COLUMN `isPrivate` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Task` ADD COLUMN `isPrivate` BOOLEAN NOT NULL DEFAULT false;
