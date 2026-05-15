/*
  Warnings:

  - You are about to drop the `digit_stat_snapshots` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `number_stat_snapshots` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "digit_stat_snapshots";

-- DropTable
DROP TABLE "number_stat_snapshots";

-- CreateTable
CREATE TABLE "analysis_snapshot_runs" (
    "_id" UUID NOT NULL,
    "contextKey" TEXT NOT NULL,
    "lotteryType" "LotteryType" NOT NULL,
    "prizeType" "LotteryPrizeType" NOT NULL,
    "numberLength" INTEGER NOT NULL,
    "scope" TEXT NOT NULL,
    "month" INTEGER,
    "windowPreset" TEXT NOT NULL,
    "windowSize" INTEGER,
    "sampleDrawCount" INTEGER NOT NULL,
    "samplePrizeCount" INTEGER NOT NULL,
    "invalidPrizeCount" INTEGER NOT NULL DEFAULT 0,
    "startDrawDate" TIMESTAMP(3),
    "endDrawDate" TIMESTAMP(3),
    "analyticsReadModel" JSONB NOT NULL,
    "patternReadModel" JSONB,
    "calendarReadModel" JSONB,
    "engineVersion" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_snapshot_runs_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "analysis_digit_stats" (
    "_id" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "lotteryType" "LotteryType" NOT NULL,
    "prizeType" "LotteryPrizeType" NOT NULL,
    "windowPreset" TEXT NOT NULL,
    "digit" TEXT NOT NULL,
    "position" INTEGER,
    "drawCount" INTEGER NOT NULL,
    "hitCount" INTEGER NOT NULL,
    "frequencyPercent" DOUBLE PRECISION NOT NULL,
    "lastSeenDrawDate" TIMESTAMP(3),
    "missingDrawCount" INTEGER NOT NULL,
    "trendDirection" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_digit_stats_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "analysis_number_stats" (
    "_id" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "lotteryType" "LotteryType" NOT NULL,
    "prizeType" "LotteryPrizeType" NOT NULL,
    "windowPreset" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "numberLength" INTEGER NOT NULL,
    "drawCount" INTEGER NOT NULL,
    "hitCount" INTEGER NOT NULL,
    "frequencyPercent" DOUBLE PRECISION NOT NULL,
    "lastSeenDrawDate" TIMESTAMP(3),
    "missingDrawCount" INTEGER NOT NULL,
    "averageGap" DOUBLE PRECISION,
    "maxGap" DOUBLE PRECISION,
    "trendScore" DOUBLE PRECISION NOT NULL,
    "patternFlags" JSONB,
    "computedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_number_stats_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "analysis_pattern_summaries" (
    "_id" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "lotteryType" "LotteryType" NOT NULL,
    "prizeType" "LotteryPrizeType" NOT NULL,
    "windowPreset" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "hitCount" INTEGER NOT NULL,
    "frequencyPercent" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "examples" TEXT[],
    "computedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_pattern_summaries_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "analysis_calendar_heatmaps" (
    "_id" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "lotteryType" "LotteryType" NOT NULL,
    "prizeType" "LotteryPrizeType" NOT NULL,
    "scope" TEXT NOT NULL,
    "month" INTEGER,
    "windowPreset" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "digit" TEXT NOT NULL,
    "appearanceCount" INTEGER NOT NULL,
    "missingRounds" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "tone" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_calendar_heatmaps_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "analysis_snapshot_runs_contextKey_key" ON "analysis_snapshot_runs"("contextKey");

-- CreateIndex
CREATE INDEX "analysis_runs_context_idx" ON "analysis_snapshot_runs"("lotteryType", "prizeType", "scope", "month", "windowPreset");

-- CreateIndex
CREATE INDEX "analysis_runs_engine_idx" ON "analysis_snapshot_runs"("engineVersion", "computedAt");

-- CreateIndex
CREATE INDEX "analysis_digit_stats_runId_idx" ON "analysis_digit_stats"("runId");

-- CreateIndex
CREATE INDEX "analysis_digit_position_idx" ON "analysis_digit_stats"("lotteryType", "prizeType", "windowPreset", "position", "digit");

-- CreateIndex
CREATE INDEX "analysis_number_stats_runId_idx" ON "analysis_number_stats"("runId");

-- CreateIndex
CREATE INDEX "analysis_number_value_idx" ON "analysis_number_stats"("lotteryType", "prizeType", "windowPreset", "number");

-- CreateIndex
CREATE INDEX "analysis_number_length_idx" ON "analysis_number_stats"("lotteryType", "prizeType", "windowPreset", "numberLength");

-- CreateIndex
CREATE INDEX "analysis_pattern_summaries_runId_idx" ON "analysis_pattern_summaries"("runId");

-- CreateIndex
CREATE INDEX "analysis_pattern_value_idx" ON "analysis_pattern_summaries"("lotteryType", "prizeType", "windowPreset", "pattern");

-- CreateIndex
CREATE INDEX "analysis_calendar_heatmaps_runId_idx" ON "analysis_calendar_heatmaps"("runId");

-- CreateIndex
CREATE INDEX "analysis_heatmap_cell_idx" ON "analysis_calendar_heatmaps"("lotteryType", "prizeType", "scope", "month", "windowPreset", "position", "digit");

-- AddForeignKey
ALTER TABLE "analysis_digit_stats" ADD CONSTRAINT "analysis_digit_stats_runId_fkey" FOREIGN KEY ("runId") REFERENCES "analysis_snapshot_runs"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_number_stats" ADD CONSTRAINT "analysis_number_stats_runId_fkey" FOREIGN KEY ("runId") REFERENCES "analysis_snapshot_runs"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_pattern_summaries" ADD CONSTRAINT "analysis_pattern_summaries_runId_fkey" FOREIGN KEY ("runId") REFERENCES "analysis_snapshot_runs"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_calendar_heatmaps" ADD CONSTRAINT "analysis_calendar_heatmaps_runId_fkey" FOREIGN KEY ("runId") REFERENCES "analysis_snapshot_runs"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
