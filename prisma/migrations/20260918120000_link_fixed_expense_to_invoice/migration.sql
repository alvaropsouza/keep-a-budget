ALTER TABLE "fixed_expenses" ADD COLUMN IF NOT EXISTS "category" TEXT;

ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "fixed_expense_id" UUID;

ALTER TABLE "expenses"
    ADD CONSTRAINT "expenses_fixed_expense_id_fkey"
    FOREIGN KEY ("fixed_expense_id") REFERENCES "fixed_expenses"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "expenses_fixed_expense_card_invoice_unique"
    ON "expenses" ("fixed_expense_id", "card_invoice_id");
