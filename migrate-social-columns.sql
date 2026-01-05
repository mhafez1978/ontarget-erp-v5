-- Add social media URL columns to Company table
ALTER TABLE `Company` ADD COLUMN `facebookUrl` VARCHAR(191) NULL;
ALTER TABLE `Company` ADD COLUMN `twitterUrl` VARCHAR(191) NULL;
ALTER TABLE `Company` ADD COLUMN `instagramUrl` VARCHAR(191) NULL;
ALTER TABLE `Company` ADD COLUMN `linkedinUrl` VARCHAR(191) NULL;
ALTER TABLE `Company` ADD COLUMN `youtubeUrl` VARCHAR(191) NULL;
