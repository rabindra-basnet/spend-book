-- Add refresh-token session fields for JWT refresh rotation (M6 auth).
-- Note: the columns are stored in Prisma 7 camelCase convention (refreshTokenDigest,
-- expiresAt, revokedAt) to match the rest of the schema (e.g. ipAddress/createdAt).
ALTER TABLE "sessions"
  ADD COLUMN "refreshTokenDigest" TEXT,
  ADD COLUMN "expiresAt" TIMESTAMPTZ,
  ADD COLUMN "revokedAt" TIMESTAMPTZ;

CREATE UNIQUE INDEX "index_sessions_on_refreshTokenDigest"
  ON "sessions" ("refreshTokenDigest") WHERE "refreshTokenDigest" IS NOT NULL;