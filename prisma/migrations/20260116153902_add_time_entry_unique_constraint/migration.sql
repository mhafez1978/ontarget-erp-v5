/*
  Warnings:

  - A unique constraint covering the columns `[staffId,clockIn]` on the table `TimeEntry` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TimeEntry_staffId_clockIn_key" ON "TimeEntry"("staffId", "clockIn");
