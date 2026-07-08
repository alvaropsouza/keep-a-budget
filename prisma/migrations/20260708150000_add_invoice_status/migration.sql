CREATE TYPE "invoice_status" AS ENUM ('OPEN', 'FUTURE', 'CLOSED');

ALTER TABLE "card_invoices" ADD COLUMN "status" "invoice_status" NOT NULL DEFAULT 'OPEN';

UPDATE "card_invoices" SET "status" = 'CLOSED' WHERE "is_closed" = true;

UPDATE "card_invoices" ci
SET "status" = 'FUTURE'
WHERE ci."is_closed" = false
  AND EXISTS (
    SELECT 1
    FROM "card_invoices" o
    WHERE o."user_id" = ci."user_id"
      AND o."bank" = ci."bank"
      AND o."is_closed" = false
      AND o."closing_date" < ci."closing_date"
  );

ALTER TABLE "card_invoices" DROP COLUMN "is_closed";
