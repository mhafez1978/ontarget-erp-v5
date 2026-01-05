-- CreateIndex
CREATE INDEX `StorefrontPost_authorId_fkey` ON `StorefrontPost`(`authorId` ASC);

-- CreateIndex
CREATE INDEX `IpBlacklist_blockedById_fkey` ON `IpBlacklist`(`blockedById` ASC);

-- CreateIndex
CREATE INDEX `EmailTemplate_createdById_fkey` ON `EmailTemplate`(`createdById` ASC);

