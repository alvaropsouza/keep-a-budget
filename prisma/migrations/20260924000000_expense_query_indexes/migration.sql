CREATE INDEX IF NOT EXISTS "expenses_user_id_date_idx" ON "expenses" ("user_id", "date");
CREATE INDEX IF NOT EXISTS "expenses_card_invoice_id_idx" ON "expenses" ("card_invoice_id");
