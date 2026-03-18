-- AlterTable
ALTER TABLE `users` ADD COLUMN `empId` VARCHAR(191) NULL;

-- Backfill: set empId from id for existing rows so we can add unique constraint
UPDATE `users` SET `empId` = CONCAT('EMP-', `id`) WHERE `empId` IS NULL;

-- Make empId required and unique
ALTER TABLE `users` MODIFY COLUMN `empId` VARCHAR(191) NOT NULL,
ADD UNIQUE INDEX `users_empId_key`(`empId`);
