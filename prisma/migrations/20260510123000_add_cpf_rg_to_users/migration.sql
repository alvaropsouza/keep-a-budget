-- AlterTable
ALTER TABLE "users"
ADD COLUMN "cpf" VARCHAR(11),
ADD COLUMN "rg" VARCHAR(20);

-- CreateIndex
CREATE UNIQUE INDEX "users_cpf_key" ON "users"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "users_rg_key" ON "users"("rg");
