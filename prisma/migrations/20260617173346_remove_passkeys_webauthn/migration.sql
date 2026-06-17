/*
  Warnings:

  - You are about to drop the `passkeys` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `webauthn_challenges` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "passkeys" DROP CONSTRAINT "passkeys_user_id_fkey";

-- DropForeignKey
ALTER TABLE "webauthn_challenges" DROP CONSTRAINT "webauthn_challenges_user_id_fkey";

-- DropTable
DROP TABLE "passkeys";

-- DropTable
DROP TABLE "webauthn_challenges";

-- DropEnum
DROP TYPE "WebAuthnChallengePurpose";
