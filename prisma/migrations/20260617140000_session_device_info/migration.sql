-- Record device / origin of each session for the session list and audit.
ALTER TABLE "user_sessions" ADD COLUMN "user_agent" TEXT;
ALTER TABLE "user_sessions" ADD COLUMN "ip_address" TEXT;
