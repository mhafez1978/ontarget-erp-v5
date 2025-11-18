-- CreateTable
CREATE TABLE `Ledger` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `totalRevenue` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `totalExpenses` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `totalPayroll` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `currentBalance` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `plaidAccessToken` TEXT NULL,
    `plaidItemId` VARCHAR(191) NULL,
    `plaidAccountId` VARCHAR(191) NULL,
    `bankName` VARCHAR(191) NULL,
    `accountLast4` VARCHAR(191) NULL,
    `accountType` VARCHAR(191) NULL,
    `stripeAccountId` VARCHAR(191) NULL,
    `stripeConnectedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Ledger_companyId_key`(`companyId`),
    UNIQUE INDEX `Ledger_stripeAccountId_key`(`stripeAccountId`),
    INDEX `Ledger_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `ledgerId` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'FULFILLED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `totalAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `taxAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `taxRegion` VARCHAR(191) NULL,
    `taxRate` DECIMAL(5, 2) NULL,
    `items` JSON NOT NULL,
    `notes` TEXT NULL,
    `orderedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fulfilledAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_orderNumber_key`(`orderNumber`),
    INDEX `Order_ledgerId_idx`(`ledgerId`),
    INDEX `Order_status_idx`(`status`),
    INDEX `Order_orderedAt_idx`(`orderedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invoice` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `ledgerId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NULL,
    `customerEmail` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'DRAFT',
    `totalAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `paidAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `taxAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `paymentMethod` VARCHAR(191) NULL,
    `paidAt` DATETIME(3) NULL,
    `dueDate` DATETIME(3) NULL,
    `stripePaymentIntentId` VARCHAR(191) NULL,
    `stripeChargeId` VARCHAR(191) NULL,
    `pdfUrl` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Invoice_invoiceNumber_key`(`invoiceNumber`),
    INDEX `Invoice_ledgerId_idx`(`ledgerId`),
    INDEX `Invoice_orderId_idx`(`orderId`),
    INDEX `Invoice_status_idx`(`status`),
    INDEX `Invoice_dueDate_idx`(`dueDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PayrollEntry` (
    `id` VARCHAR(191) NOT NULL,
    `ledgerId` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `payDate` DATETIME(3) NOT NULL,
    `grossAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `taxWithheld` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `deductions` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `netAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `taxRegion` VARCHAR(191) NULL,
    `taxBreakdown` JSON NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `paidAt` DATETIME(3) NULL,
    `stripeTransferId` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PayrollEntry_ledgerId_idx`(`ledgerId`),
    INDEX `PayrollEntry_staffId_idx`(`staffId`),
    INDEX `PayrollEntry_periodStart_periodEnd_idx`(`periodStart`, `periodEnd`),
    INDEX `PayrollEntry_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExpenseEntry` (
    `id` VARCHAR(191) NOT NULL,
    `ledgerId` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NULL,
    `category` ENUM('TRAVEL', 'MEALS', 'OFFICE_SUPPLIES', 'EQUIPMENT', 'SOFTWARE', 'UTILITIES', 'RENT', 'INSURANCE', 'MARKETING', 'PROFESSIONAL_SERVICES', 'TAXES', 'PAYROLL', 'OTHER') NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `description` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `receiptUrl` VARCHAR(191) NULL,
    `receiptUrls` JSON NULL,
    `expenseDate` DATETIME(3) NOT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approvedAt` DATETIME(3) NULL,
    `rejectedAt` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'REIMBURSED') NOT NULL DEFAULT 'PENDING',
    `approvedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ExpenseEntry_ledgerId_idx`(`ledgerId`),
    INDEX `ExpenseEntry_staffId_idx`(`staffId`),
    INDEX `ExpenseEntry_category_idx`(`category`),
    INDEX `ExpenseEntry_status_idx`(`status`),
    INDEX `ExpenseEntry_expenseDate_idx`(`expenseDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccountingEntry` (
    `id` VARCHAR(191) NOT NULL,
    `ledgerId` VARCHAR(191) NOT NULL,
    `entryDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `description` VARCHAR(191) NOT NULL,
    `referenceNumber` VARCHAR(191) NULL,
    `accountType` ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE') NOT NULL,
    `accountName` VARCHAR(191) NOT NULL,
    `debitAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `creditAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `category` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AccountingEntry_ledgerId_idx`(`ledgerId`),
    INDEX `AccountingEntry_entryDate_idx`(`entryDate`),
    INDEX `AccountingEntry_accountType_idx`(`accountType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Ledger` ADD CONSTRAINT `Ledger_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_ledgerId_fkey` FOREIGN KEY (`ledgerId`) REFERENCES `Ledger`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_ledgerId_fkey` FOREIGN KEY (`ledgerId`) REFERENCES `Ledger`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayrollEntry` ADD CONSTRAINT `PayrollEntry_ledgerId_fkey` FOREIGN KEY (`ledgerId`) REFERENCES `Ledger`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayrollEntry` ADD CONSTRAINT `PayrollEntry_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `CompanyStaff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpenseEntry` ADD CONSTRAINT `ExpenseEntry_ledgerId_fkey` FOREIGN KEY (`ledgerId`) REFERENCES `Ledger`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpenseEntry` ADD CONSTRAINT `ExpenseEntry_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `CompanyStaff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccountingEntry` ADD CONSTRAINT `AccountingEntry_ledgerId_fkey` FOREIGN KEY (`ledgerId`) REFERENCES `Ledger`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
