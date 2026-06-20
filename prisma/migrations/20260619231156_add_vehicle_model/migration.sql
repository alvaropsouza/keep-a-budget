-- CreateEnum
CREATE TYPE "fuel_type" AS ENUM ('gasolina', 'etanol', 'flex', 'diesel', 'eletrico', 'hibrido');

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "plate" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year_manufacture" INTEGER NOT NULL,
    "renavam" TEXT,
    "chassis" TEXT,
    "year_model" INTEGER,
    "color" TEXT,
    "fuel" "fuel_type",
    "ipva_expiry" DATE,
    "ipva_value" DECIMAL(12,2),
    "insurance_expiry" DATE,
    "licensing_expiry" DATE,
    "current_km" INTEGER,
    "last_service_date" DATE,
    "next_oil_change_km" INTEGER,
    "notes" TEXT,
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicles_user_id_idx" ON "vehicles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_user_id_plate_unique" ON "vehicles"("user_id", "plate");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
