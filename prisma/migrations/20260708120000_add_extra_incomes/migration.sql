-- CreateTable
CREATE TABLE "extra_incomes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extra_incomes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "extra_incomes_user_id_date_idx" ON "extra_incomes"("user_id", "date");

-- AddForeignKey
ALTER TABLE "extra_incomes" ADD CONSTRAINT "extra_incomes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
