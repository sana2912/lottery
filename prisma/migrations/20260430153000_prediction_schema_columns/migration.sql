ALTER TABLE "prediction_runs"
ADD COLUMN "lotteryType" "LotteryType",
ADD COLUMN "prizeType" "LotteryPrizeType",
ADD COLUMN "numberLength" INTEGER,
ADD COLUMN "windowSize" INTEGER,
ADD COLUMN "count" INTEGER,
ADD COLUMN "generatedAt" TIMESTAMP(3),
ADD COLUMN "version" TEXT;

ALTER TABLE "prediction_results"
ADD COLUMN "inputWindow" INTEGER,
ADD COLUMN "numberLength" INTEGER,
ADD COLUMN "rank" INTEGER,
ADD COLUMN "scoreBreakdown" JSONB,
ADD COLUMN "strategyId" TEXT,
ADD COLUMN "strategyName" TEXT,
ADD COLUMN "version" TEXT;

CREATE INDEX "prediction_runs_lotteryType_prizeType_idx"
ON "prediction_runs"("lotteryType", "prizeType");

CREATE INDEX "prediction_runs_generatedAt_idx"
ON "prediction_runs"("generatedAt");

CREATE INDEX "prediction_results_runId_rank_idx"
ON "prediction_results"("runId", "rank");
