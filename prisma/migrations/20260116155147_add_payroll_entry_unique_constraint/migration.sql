/*
  Warnings:

  - A unique constraint covering the columns `[ledgerId,staffId,periodStart,periodEnd]` on the table `PayrollEntry` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PayrollEntry_ledgerId_staffId_periodStart_periodEnd_key" ON "PayrollEntry"("ledgerId", "staffId", "periodStart", "periodEnd");
