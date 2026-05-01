CREATE TABLE "digit_stat_snapshots" (
    "_id" UUID NOT NULL,
    "lotteryType" "LotteryType" NOT NULL,
    "prizeType" "LotteryPrizeType" NOT NULL,
    "windowSize" INTEGER NOT NULL,
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

    CONSTRAINT "digit_stat_snapshots_pkey" PRIMARY KEY ("_id")
);

CREATE TABLE "number_stat_snapshots" (
    "_id" UUID NOT NULL,
    "lotteryType" "LotteryType" NOT NULL,
    "prizeType" "LotteryPrizeType" NOT NULL,
    "windowSize" INTEGER NOT NULL,
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

    CONSTRAINT "number_stat_snapshots_pkey" PRIMARY KEY ("_id")
);

CREATE INDEX "digit_stat_snapshots_lotteryType_prizeType_windowSize_computedAt_idx"
ON "digit_stat_snapshots"("lotteryType", "prizeType", "windowSize", "computedAt");

CREATE INDEX "digit_stat_snapshots_lotteryType_prizeType_windowSize_digit_position_idx"
ON "digit_stat_snapshots"("lotteryType", "prizeType", "windowSize", "digit", "position");

CREATE INDEX "number_stat_snapshots_lotteryType_prizeType_windowSize_computedAt_idx"
ON "number_stat_snapshots"("lotteryType", "prizeType", "windowSize", "computedAt");

CREATE INDEX "number_stat_snapshots_window_number_idx"
ON "number_stat_snapshots"("lotteryType", "prizeType", "windowSize", "number");

CREATE INDEX "number_stat_snapshots_window_number_length_idx"
ON "number_stat_snapshots"("lotteryType", "prizeType", "windowSize", "numberLength");
