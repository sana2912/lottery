-- Add source audit fields used by real draw imports.

CREATE TYPE "SourceStatus" AS ENUM ('IMPORTED', 'PARTIAL', 'VERIFIED');

ALTER TABLE "lottery_draws"
ADD COLUMN "sourceUrl" TEXT,
ADD COLUMN "sourceStatus" "SourceStatus" NOT NULL DEFAULT 'IMPORTED',
ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "metadata" JSONB;

CREATE INDEX "lottery_draws_sourceStatus_idx" ON "lottery_draws"("sourceStatus");
CREATE INDEX "lottery_draws_publishedAt_idx" ON "lottery_draws"("publishedAt");
