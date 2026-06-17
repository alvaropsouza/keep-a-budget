-- Encrypt salary and rg at rest. rg uses an HMAC blind index for uniqueness.
-- NOTE: existing rows hold plaintext after the type change; run the backfill
-- script (scripts/encryptExistingUserData.ts) immediately after this migration.

-- salary: Decimal -> text (will hold AES-256-GCM ciphertext)
ALTER TABLE "users" ALTER COLUMN "salary" TYPE TEXT USING "salary"::TEXT;

-- rg: drop the unique index and widen to text for ciphertext
DROP INDEX IF EXISTS "users_rg_key";
ALTER TABLE "users" ALTER COLUMN "rg" TYPE TEXT;

-- rg blind index (HMAC-SHA256) enforces uniqueness over the encrypted value
ALTER TABLE "users" ADD COLUMN "rg_hash" TEXT;
CREATE UNIQUE INDEX "users_rg_hash_key" ON "users"("rg_hash");
