-- One session row per (user, device). device_id is a hash of the User-Agent;
-- NULLs are distinct in Postgres so legacy rows without a device key do not
-- collide under the unique constraint.
ALTER TABLE "user_sessions" ADD COLUMN "device_id" TEXT;

CREATE UNIQUE INDEX "user_sessions_user_id_device_id_unique"
  ON "user_sessions" ("user_id", "device_id");
