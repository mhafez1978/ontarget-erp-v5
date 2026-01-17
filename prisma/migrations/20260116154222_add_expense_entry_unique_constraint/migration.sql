/*
  Warnings:

  - A unique constraint covering the columns `[ledgerId,staffId,expenseDate,description]` on the table `ExpenseEntry` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ExpenseEntry_ledgerId_staffId_expenseDate_description_key" ON "ExpenseEntry"("ledgerId", "staffId", "expenseDate", "description");
