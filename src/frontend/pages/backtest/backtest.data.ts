import {
  type BacktestHistoryResponse,
  type BacktestReadModel,
  backtestHistoryResponseSchema,
  backtestReadModelSchema
} from "@/schema/app/backtest.schema";

export const backtestFallback = backtestReadModelSchema.parse({
  generatedAt: "2026-04-28T00:00:00.000Z",
  results: [
    {
      actualNumbers: ["47"],
      drawDate: "2026-04-16T00:00:00.000Z",
      drawId: "draw-2026-04-16",
      generatedNumbers: ["47", "91", "24"],
      hitNumbers: ["47"],
      id: "backtest-result-2026-04-16",
      isHit: true,
      rankOfHit: 1,
      runId: "backtest-run-balanced-001"
    },
    {
      actualNumbers: ["18"],
      drawDate: "2026-04-01T00:00:00.000Z",
      drawId: "draw-2026-04-01",
      generatedNumbers: ["03", "74", "29"],
      hitNumbers: [],
      id: "backtest-result-2026-04-01",
      isHit: false,
      runId: "backtest-run-balanced-001"
    }
  ],
  run: {
    averageHitRank: 1,
    candidateCount: 5,
    computedAt: "2026-04-28T00:00:00.000Z",
    coverage: 24,
    endDrawDate: "2026-04-16T00:00:00.000Z",
    hitRate: 50,
    id: "backtest-run-balanced-001",
    longestMissStreak: 1,
    lotteryType: "THAI_GOVERNMENT",
    numberLength: 2,
    params: {
      windowSize: 120
    },
    prizeType: "TWO_DIGIT",
    startDrawDate: "2025-01-01T00:00:00.000Z",
    strategyId: "balanced",
    strategyName: "Balanced",
    version: "prediction-engine-v1"
  },
  source: "mock"
});

export const emptyHistory = backtestHistoryResponseSchema.parse({
  generatedAt: "2026-04-28T00:00:00.000Z",
  items: [],
  source: "api"
});

export type BacktestPageHistory = BacktestHistoryResponse;
export type BacktestPageModel = BacktestReadModel;
