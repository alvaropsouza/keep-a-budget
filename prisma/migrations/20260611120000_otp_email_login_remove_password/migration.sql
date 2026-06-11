-- DropTable (passwordless login: reset tokens no longer needed)
DROP TABLE "password_reset_tokens";

-- AlterTable (remove password from users; existing rows keep all other data)
ALTER TABLE "users" DROP COLUMN "password_hash";

-- CreateTable
CREATE TABLE "email_otps" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_otps_code_hash_key" ON "email_otps"("code_hash");

-- CreateIndex
CREATE INDEX "email_otps_user_id_idx" ON "email_otps"("user_id");

-- CreateIndex
CREATE INDEX "email_otps_expires_at_idx" ON "email_otps"("expires_at");

-- AddForeignKey
ALTER TABLE "email_otps" ADD CONSTRAINT "email_otps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
