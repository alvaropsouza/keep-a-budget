ALTER TABLE "fixed_expenses" ADD COLUMN IF NOT EXISTS "recurrence_months" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "fixed_expenses" ADD COLUMN IF NOT EXISTS "start_date" DATE;
ALTER TABLE "fixed_expenses" ADD COLUMN IF NOT EXISTS "end_date" DATE;
ALTER TABLE "fixed_expenses" ADD COLUMN IF NOT EXISTS "payment_method_name" TEXT;
ALTER TABLE "fixed_expenses" ADD COLUMN IF NOT EXISTS "auto_launch" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "fixed_expenses_auto_launch_idx" ON "fixed_expenses" ("auto_launch") WHERE "auto_launch" = true;
