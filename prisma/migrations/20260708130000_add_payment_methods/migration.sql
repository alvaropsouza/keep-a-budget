-- CreateTable
CREATE TABLE "payment_methods" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "color" TEXT,
    "closing_day" INTEGER,
    "due_day" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_methods_user_id_is_active_idx" ON "payment_methods"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_user_name_unique" ON "payment_methods"("user_id", "name");

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed: existing banks become credit-card payment methods
INSERT INTO "payment_methods" ("id", "user_id", "name", "type", "created_at", "updated_at")
SELECT gen_random_uuid(), src."user_id", src."bank", 'CREDIT_CARD', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT "user_id", "bank" FROM "card_invoices" WHERE "user_id" IS NOT NULL
    UNION
    SELECT DISTINCT "user_id", "bank" FROM "expenses" WHERE "user_id" IS NOT NULL
) src
ON CONFLICT ("user_id", "name") DO NOTHING;
