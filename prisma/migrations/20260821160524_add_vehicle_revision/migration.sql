-- CreateTable
CREATE TABLE "vehicle_revisions" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "km" INTEGER,
    "description" TEXT,
    "files" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicle_revisions_vehicle_id_idx" ON "vehicle_revisions"("vehicle_id");

-- AddForeignKey
ALTER TABLE "vehicle_revisions" ADD CONSTRAINT "vehicle_revisions_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
