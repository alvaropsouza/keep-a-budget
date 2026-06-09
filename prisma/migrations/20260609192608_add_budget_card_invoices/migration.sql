-- CreateTable
CREATE TABLE "budget_card_invoices" (
    "id" UUID NOT NULL,
    "budget_id" UUID NOT NULL,
    "card_invoice_id" UUID NOT NULL,
    "bank" TEXT NOT NULL,

    CONSTRAINT "budget_card_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "budget_card_invoices_budget_bank_unique" ON "budget_card_invoices"("budget_id", "bank");

-- AddForeignKey
ALTER TABLE "budget_card_invoices" ADD CONSTRAINT "budget_card_invoices_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_card_invoices" ADD CONSTRAINT "budget_card_invoices_card_invoice_id_fkey" FOREIGN KEY ("card_invoice_id") REFERENCES "card_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
