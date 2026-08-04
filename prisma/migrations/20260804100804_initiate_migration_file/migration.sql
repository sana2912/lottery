-- CreateEnum
CREATE TYPE "LotteryType" AS ENUM ('THAI_GOVERNMENT');

-- CreateEnum
CREATE TYPE "LotteryPrizeType" AS ENUM ('FIRST', 'THREE_DIGIT', 'THREE_FRONT', 'THREE_BACK', 'TWO_DIGIT', 'NEAR_FIRST', 'PRIZE2', 'PRIZE3', 'PRIZE4', 'PRIZE5', 'OTHER');

-- CreateEnum
CREATE TYPE "SourceStatus" AS ENUM ('IMPORTED', 'PARTIAL', 'VERIFIED');

-- CreateTable
CREATE TABLE "lottery_draws" (
    "_id" UUID NOT NULL,
    "lotteryType" "LotteryType" NOT NULL DEFAULT 'THAI_GOVERNMENT',
    "drawDate" TIMESTAMP(3) NOT NULL,
    "drawNo" TEXT,
    "sourceUrl" TEXT,
    "sourceStatus" "SourceStatus" NOT NULL DEFAULT 'IMPORTED',
    "publishedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lottery_draws_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "lottery_prizes" (
    "_id" UUID NOT NULL,
    "drawId" UUID NOT NULL,
    "type" "LotteryPrizeType" NOT NULL,
    "position" INTEGER,
    "number" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lottery_prizes_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "prediction_runs" (
    "_id" UUID NOT NULL,
    "strategy" TEXT NOT NULL,
    "lotteryType" "LotteryType",
    "prizeType" "LotteryPrizeType",
    "numberLength" INTEGER,
    "windowSize" INTEGER,
    "count" INTEGER,
    "generatedAt" TIMESTAMP(3),
    "version" TEXT,
    "params" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prediction_runs_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "prediction_results" (
    "_id" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reasons" TEXT[],
    "inputWindow" INTEGER,
    "numberLength" INTEGER,
    "rank" INTEGER,
    "scoreBreakdown" JSONB,
    "strategyId" TEXT,
    "strategyName" TEXT,
    "version" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prediction_results_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "analysis_snapshot_runs" (
    "_id" UUID NOT NULL,
    "contextKey" TEXT NOT NULL,
    "lotteryType" "LotteryType" NOT NULL,
    "prizeType" TEXT NOT NULL,
    "numberLength" INTEGER NOT NULL,
    "scope" TEXT NOT NULL,
    "month" INTEGER,
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
    "prizeType" TEXT NOT NULL,
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
    "prizeType" TEXT NOT NULL,
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
    "prizeType" TEXT NOT NULL,
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
    "prizeType" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "month" INTEGER,
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
CREATE INDEX "lottery_draws_drawDate_idx" ON "lottery_draws"("drawDate");

-- CreateIndex
CREATE INDEX "lottery_draws_sourceStatus_idx" ON "lottery_draws"("sourceStatus");

-- CreateIndex
CREATE INDEX "lottery_draws_publishedAt_idx" ON "lottery_draws"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "lottery_draws_lotteryType_drawDate_key" ON "lottery_draws"("lotteryType", "drawDate");

-- CreateIndex
CREATE INDEX "lottery_prizes_drawId_idx" ON "lottery_prizes"("drawId");

-- CreateIndex
CREATE INDEX "lottery_prizes_type_number_idx" ON "lottery_prizes"("type", "number");

-- CreateIndex
CREATE INDEX "prediction_runs_strategy_idx" ON "prediction_runs"("strategy");

-- CreateIndex
CREATE INDEX "prediction_runs_lotteryType_prizeType_idx" ON "prediction_runs"("lotteryType", "prizeType");

-- CreateIndex
CREATE INDEX "prediction_runs_generatedAt_idx" ON "prediction_runs"("generatedAt");

-- CreateIndex
CREATE INDEX "prediction_runs_latest_idx" ON "prediction_runs"("generatedAt" DESC, "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "prediction_results_runId_idx" ON "prediction_results"("runId");

-- CreateIndex
CREATE INDEX "prediction_results_runId_rank_idx" ON "prediction_results"("runId", "rank");

-- CreateIndex
CREATE INDEX "prediction_results_run_rank_created_idx" ON "prediction_results"("runId", "rank" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "prediction_results_number_idx" ON "prediction_results"("number");

-- CreateIndex
CREATE UNIQUE INDEX "analysis_snapshot_runs_contextKey_key" ON "analysis_snapshot_runs"("contextKey");

-- CreateIndex
CREATE INDEX "analysis_runs_context_idx" ON "analysis_snapshot_runs"("lotteryType", "prizeType", "scope", "month");

-- CreateIndex
CREATE INDEX "analysis_runs_engine_idx" ON "analysis_snapshot_runs"("engineVersion", "computedAt");

-- CreateIndex
CREATE INDEX "analysis_digit_stats_runId_idx" ON "analysis_digit_stats"("runId");

-- CreateIndex
CREATE INDEX "analysis_digit_run_rank_idx" ON "analysis_digit_stats"("runId", "hitCount" DESC);

-- CreateIndex
CREATE INDEX "analysis_digit_position_idx" ON "analysis_digit_stats"("lotteryType", "prizeType", "position", "digit");

-- CreateIndex
CREATE INDEX "analysis_number_stats_runId_idx" ON "analysis_number_stats"("runId");

-- CreateIndex
CREATE INDEX "analysis_number_run_number_idx" ON "analysis_number_stats"("runId", "number");

-- CreateIndex
CREATE INDEX "analysis_number_run_rank_idx" ON "analysis_number_stats"("runId", "trendScore" DESC, "hitCount" DESC);

-- CreateIndex
CREATE INDEX "analysis_number_run_missing_idx" ON "analysis_number_stats"("runId", "missingDrawCount" DESC);

-- CreateIndex
CREATE INDEX "analysis_number_value_idx" ON "analysis_number_stats"("lotteryType", "prizeType", "number");

-- CreateIndex
CREATE INDEX "analysis_number_length_idx" ON "analysis_number_stats"("lotteryType", "prizeType", "numberLength");

-- CreateIndex
CREATE INDEX "analysis_pattern_summaries_runId_idx" ON "analysis_pattern_summaries"("runId");

-- CreateIndex
CREATE INDEX "analysis_pattern_value_idx" ON "analysis_pattern_summaries"("lotteryType", "prizeType", "pattern");

-- CreateIndex
CREATE INDEX "analysis_calendar_heatmaps_runId_idx" ON "analysis_calendar_heatmaps"("runId");

-- CreateIndex
CREATE INDEX "analysis_heatmap_cell_idx" ON "analysis_calendar_heatmaps"("lotteryType", "prizeType", "scope", "month", "position", "digit");

-- AddForeignKey
ALTER TABLE "lottery_prizes" ADD CONSTRAINT "lottery_prizes_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "lottery_draws"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_results" ADD CONSTRAINT "prediction_results_runId_fkey" FOREIGN KEY ("runId") REFERENCES "prediction_runs"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_digit_stats" ADD CONSTRAINT "analysis_digit_stats_runId_fkey" FOREIGN KEY ("runId") REFERENCES "analysis_snapshot_runs"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_number_stats" ADD CONSTRAINT "analysis_number_stats_runId_fkey" FOREIGN KEY ("runId") REFERENCES "analysis_snapshot_runs"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_pattern_summaries" ADD CONSTRAINT "analysis_pattern_summaries_runId_fkey" FOREIGN KEY ("runId") REFERENCES "analysis_snapshot_runs"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_calendar_heatmaps" ADD CONSTRAINT "analysis_calendar_heatmaps_runId_fkey" FOREIGN KEY ("runId") REFERENCES "analysis_snapshot_runs"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
