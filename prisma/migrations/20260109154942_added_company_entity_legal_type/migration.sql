-- CreateTable
CREATE TABLE `CompanyTaxInfo` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `legalEntity` ENUM('SOLE_PROPRIETOR', 'SINGLE_MEMBER_LLC', 'LLC', 'S_CORP', 'C_CORP', 'GENERAL_PARTNERSHIP', 'LIMITED_PARTNERSHIP', 'LLP', 'NON_PROFIT', 'LTD', 'PLC', 'GMBH', 'AG', 'UG', 'KG', 'OHG', 'SARL', 'SA', 'SAS', 'SASU', 'EURL', 'SNC', 'SL', 'SA_SPAIN', 'LDA', 'SA_PORTUGAL', 'SRL', 'SPA', 'SRLS', 'BV', 'NV', 'VOF', 'AB', 'AS', 'APS', 'AS_DENMARK', 'OY', 'SPZOO', 'SA_POLAND', 'SRO', 'AS_CZECH', 'PTY_LTD', 'PVT_LTD', 'PUBLIC_LTD', 'SDN_BHD', 'BHD', 'PTE_LTD', 'KK', 'GK', 'SA_LATIN', 'SRL_LATIN', 'LTDA', 'SA_BRAZIL', 'EIRELI', 'MEI', 'LLC_MENA', 'FZE', 'FZCO', 'WLL', 'COOPERATIVE', 'TRUST', 'FOUNDATION', 'ASSOCIATION', 'JOINT_VENTURE', 'BRANCH', 'OTHER') NOT NULL,
    `taxIdType` ENUM('SSN', 'EIN', 'ITIN', 'VAT', 'GST', 'ABN', 'ACN', 'TFN', 'NINO', 'UTR', 'CRN', 'TVA', 'NIF', 'CIF', 'SIREN', 'SIRET', 'CNPJ', 'CPF', 'RFC', 'RUT', 'CUIT', 'PAN', 'GSTIN', 'TIN', 'TRN', 'OTHER') NOT NULL,
    `taxId` VARCHAR(191) NOT NULL,
    `taxCountry` VARCHAR(191) NULL,
    `vatNumber` VARCHAR(191) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `verifiedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CompanyTaxInfo_companyId_key`(`companyId`),
    INDEX `CompanyTaxInfo_companyId_idx`(`companyId`),
    INDEX `CompanyTaxInfo_taxCountry_idx`(`taxCountry`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CompanyTaxInfo` ADD CONSTRAINT `CompanyTaxInfo_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
