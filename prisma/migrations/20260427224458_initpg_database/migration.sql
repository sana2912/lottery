-- CreateEnum
CREATE TYPE "LotteryType" AS ENUM ('THAI_GOVERNMENT');

-- CreateEnum
CREATE TYPE "LotteryPrizeType" AS ENUM ('FIRST', 'THREE_FRONT', 'THREE_BACK', 'TWO_DIGIT', 'NEAR_FIRST', 'OTHER');

-- CreateEnum
CREATE TYPE "WatchlistSource" AS ENUM ('MANUAL', 'PREDICTION', 'NOTEBOOK');

-- CreateTable
CREATE TABLE "lottery_draws" (
    "_id" UUID NOT NULL,
    "lotteryType" "LotteryType" NOT NULL DEFAULT 'THAI_GOVERNMENT',
    "drawDate" TIMESTAMP(3) NOT NULL,
    "drawNo" TEXT,
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
CREATE TABLE "user_watchlist_items" (
    "_id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "source" "WatchlistSource" NOT NULL DEFAULT 'MANUAL',
    "tags" TEXT[],
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_watchlist_items_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "prediction_runs" (
    "_id" UUID NOT NULL,
    "strategy" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prediction_results_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "lottery_draws_drawDate_idx" ON "lottery_draws"("drawDate");

-- CreateIndex
CREATE UNIQUE INDEX "lottery_draws_lotteryType_drawDate_key" ON "lottery_draws"("lotteryType", "drawDate");

-- CreateIndex
CREATE INDEX "lottery_prizes_drawId_idx" ON "lottery_prizes"("drawId");

-- CreateIndex
CREATE INDEX "lottery_prizes_type_number_idx" ON "lottery_prizes"("type", "number");

-- CreateIndex
CREATE INDEX "user_watchlist_items_number_idx" ON "user_watchlist_items"("number");

-- CreateIndex
CREATE INDEX "prediction_runs_strategy_idx" ON "prediction_runs"("strategy");

-- CreateIndex
CREATE INDEX "prediction_results_runId_idx" ON "prediction_results"("runId");

-- CreateIndex
CREATE INDEX "prediction_results_number_idx" ON "prediction_results"("number");

-- AddForeignKey
ALTER TABLE "lottery_prizes" ADD CONSTRAINT "lottery_prizes_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "lottery_draws"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_results" ADD CONSTRAINT "prediction_results_runId_fkey" FOREIGN KEY ("runId") REFERENCES "prediction_runs"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;
