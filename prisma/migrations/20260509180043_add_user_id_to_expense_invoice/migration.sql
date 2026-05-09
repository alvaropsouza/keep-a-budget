/*
  Warnings:

  - A unique constraint covering the columns `[user_id,bank,closing_date]` on the table `card_invoices` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "card_invoices_bank_closing_date_unique";

-- AlterTable
ALTER TABLE "card_invoices" ADD COLUMN     "user_id" UUID;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "user_id" UUID;

-- CreateIndex
CREATE INDEX "card_invoices_user_id_idx" ON "card_invoices"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "card_invoices_user_bank_closing_date_unique" ON "card_invoices"("user_id", "bank", "closing_date");

-- CreateIndex
CREATE INDEX "expenses_user_id_idx" ON "expenses"("user_id");

-- AddForeignKey
ALTER TABLE "card_invoices" ADD CONSTRAINT "card_invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
