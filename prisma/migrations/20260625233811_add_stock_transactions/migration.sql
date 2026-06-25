-- CreateEnum
CREATE TYPE "stock_transaction_type" AS ENUM ('COMPRA', 'VENDA');

-- CreateEnum
CREATE TYPE "stock_operation_type" AS ENUM ('NORMAL', 'DAY_TRADE');

-- CreateTable
CREATE TABLE "stock_transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "ticker" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "cnpj" TEXT,
    "broker" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "stock_transaction_type" NOT NULL,
    "operation_type" "stock_operation_type" NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "unit_price" DECIMAL(12,4) NOT NULL,
    "fees" DECIMAL(12,2) NOT NULL,
    "year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_transactions_user_id_year_idx" ON "stock_transactions"("user_id", "year");

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
