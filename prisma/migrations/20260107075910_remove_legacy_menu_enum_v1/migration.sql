/*
  Warnings:

  - The values [MENU] on the enum `GenerationJob_sectionKind` will be removed. If these variants are still used in the database, this will fail.
  - The values [MENU] on the enum `GenerationJob_sectionKind` will be removed. If these variants are still used in the database, this will fail.

*/
-- Safety: convert any existing legacy values before altering enum
UPDATE `GeneratedSection` SET `kind` = 'FOOD_MENU' WHERE `kind` = 'MENU';
UPDATE `GenerationJob` SET `sectionKind` = 'FOOD_MENU' WHERE `sectionKind` = 'MENU';

-- AlterTable
ALTER TABLE `GeneratedSection` MODIFY `kind` ENUM('HERO', 'ABOUT', 'FOOD_MENU', 'LOGGED_IN_TOP_NAVBAR', 'LOGGED_OUT_TOP_NAVBAR', 'LOGGED_IN_SIDE_NAVBAR', 'LOGGED_OUT_SIDE_NAVBAR', 'LOGGED_IN_MOBILE_NAVBAR', 'LOGGED_OUT_MOBILE_NAVBAR', 'TESTIMONIAL', 'CTA', 'GALLERY', 'SERVICES', 'FEEDBACK', 'CUSTOM') NOT NULL;

-- AlterTable
ALTER TABLE `GenerationJob` MODIFY `sectionKind` ENUM('HERO', 'ABOUT', 'FOOD_MENU', 'LOGGED_IN_TOP_NAVBAR', 'LOGGED_OUT_TOP_NAVBAR', 'LOGGED_IN_SIDE_NAVBAR', 'LOGGED_OUT_SIDE_NAVBAR', 'LOGGED_IN_MOBILE_NAVBAR', 'LOGGED_OUT_MOBILE_NAVBAR', 'TESTIMONIAL', 'CTA', 'GALLERY', 'SERVICES', 'FEEDBACK', 'CUSTOM') NOT NULL;
