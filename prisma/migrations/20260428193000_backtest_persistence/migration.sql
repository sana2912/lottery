-- CreateTable
CREATE TABLE "backtest_runs" (
    "_id" UUID NOT NULL,
    "strategyId" TEXT NOT NULL,
    "strategyName" TEXT NOT NULL,
    "params" JSONB,
    "lotteryType" "LotteryType" NOT NULL,
    "prizeType" "LotteryPrizeType" NOT NULL,
    "numberLength" INTEGER NOT NULL,
    "startDrawDate" TIMESTAMP(3) NOT NULL,
    "endDrawDate" TIMESTAMP(3) NOT NULL,
    "candidateCount" INTEGER NOT NULL,
    "hitRate" DOUBLE PRECISION NOT NULL,
    "longestMissStreak" INTEGER NOT NULL,
    "averageHitRank" DOUBLE PRECISION,
    "coverage" INTEGER NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL,
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backtest_runs_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "backtest_results" (
    "_id" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "drawId" UUID NOT NULL,
    "drawDate" TIMESTAMP(3) NOT NULL,
    "generatedNumbers" TEXT[],
    "actualNumbers" TEXT[],
    "isHit" BOOLEAN NOT NULL,
    "hitNumbers" TEXT[],
    "rankOfHit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backtest_results_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "backtest_runs_strategyId_idx" ON "backtest_runs"("strategyId");

-- CreateIndex
CREATE INDEX "backtest_runs_lotteryType_prizeType_idx" ON "backtest_runs"("lotteryType", "prizeType");

-- CreateIndex
CREATE INDEX "backtest_runs_computedAt_idx" ON "backtest_runs"("computedAt");

-- CreateIndex
CREATE INDEX "backtest_results_runId_idx" ON "backtest_results"("runId");

-- CreateIndex
CREATE INDEX "backtest_results_drawId_idx" ON "backtest_results"("drawId");

-- AddForeignKey
ALTER TABLE "backtest_results" ADD CONSTRAINT "backtest_results_runId_fkey" FOREIGN KEY ("runId") REFERENCES "backtest_runs"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
