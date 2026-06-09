-- CreateTable
CREATE TABLE "ir_documents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "receipt" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ir_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ir_documents_user_id_year_idx" ON "ir_documents"("user_id", "year");

-- AddForeignKey
ALTER TABLE "ir_documents" ADD CONSTRAINT "ir_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
