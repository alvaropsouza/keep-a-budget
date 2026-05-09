/*
  Warnings:

  - Made the column `user_id` on table `card_invoices` required. This step will fail if there are existing NULL values in that column.
  - Made the column `user_id` on table `expenses` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "card_invoices" DROP CONSTRAINT "card_invoices_user_id_fkey";

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_user_id_fkey";

-- AlterTable
-- Remove orphan rows (NULL user_id) before making the column required.
-- Expenses associated with orphan invoices are deleted first via cascade or explicitly.
DELETE FROM "expenses" WHERE "user_id" IS NULL;
DELETE FROM "expenses" WHERE "card_invoice_id" IN (SELECT "id" FROM "card_invoices" WHERE "user_id" IS NULL);
DELETE FROM "card_invoices" WHERE "user_id" IS NULL;

ALTER TABLE "card_invoices" ALTER COLUMN "user_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "expenses" ALTER COLUMN "user_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "card_invoices" ADD CONSTRAINT "card_invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
