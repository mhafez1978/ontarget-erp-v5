/*
  Warnings:

  - The primary key for the `Subscription` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Subscription` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[customerEmail,companyId]` on the table `Testimonial` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_pkey",
DROP COLUMN "id";

-- CreateIndex
CREATE UNIQUE INDEX "Testimonial_customerEmail_companyId_key" ON "Testimonial"("customerEmail", "companyId");

-- AddForeignKey
ALTER TABLE "HederaTransaction" ADD CONSTRAINT "HederaTransaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
