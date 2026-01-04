-- AlterTable
ALTER TABLE `Company` ADD COLUMN `awards` JSON NULL,
    ADD COLUMN `certifications` JSON NULL,
    ADD COLUMN `employeeCount` INTEGER NULL,
    ADD COLUMN `facebookLikes` INTEGER NULL,
    ADD COLUMN `foundedYear` INTEGER NULL,
    ADD COLUMN `googleRating` DOUBLE NULL,
    ADD COLUMN `instagramFollowers` INTEGER NULL,
    ADD COLUMN `linkedinFollowers` INTEGER NULL,
    ADD COLUMN `trustpilotRating` DOUBLE NULL,
    ADD COLUMN `youtubeSubscribers` INTEGER NULL;
