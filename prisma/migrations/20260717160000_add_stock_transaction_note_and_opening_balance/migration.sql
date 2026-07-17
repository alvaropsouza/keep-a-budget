-- Captura colunas já presentes no banco (adicionadas fora do histórico de migração):
-- stock_transactions.is_opening_balance e stock_transactions.note_file.
-- Aplicada via `migrate resolve --applied` em ambientes que já as possuem.

ALTER TABLE "stock_transactions"
  ADD COLUMN IF NOT EXISTS "is_opening_balance" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "stock_transactions"
  ADD COLUMN IF NOT EXISTS "note_file" TEXT;
