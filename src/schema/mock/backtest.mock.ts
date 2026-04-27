import { toApiBacktestReadModel } from "@/api/model/dto/backtest.dto";
import { backtestReadModelSchema } from "@/schema/app/backtest.schema";

const backtestFixtureInput = {
  generatedAt: new Date("2026-04-27T00:00:00.000Z"),
  source: "mock",
  run: {
    id: "backtest-run-balanced-001",
    strategyId: "balanced",
    strategyName: "Balanced",
    params: {
      windowSize: 120,
      weights: {
        hot: 0.3,
        overdue: 0.2,
        position: 0.25,
        pair: 0.15,
        pattern: 0.1
      }
    },
    lotteryType: "THAI_GOVERNMENT",
    prizeType: "TWO_DIGIT",
    numberLength: 2,
    startDrawDate: new Date("2025-01-01T00:00:00.000Z"),
    endDrawDate: new Date("2026-04-16T00:00:00.000Z"),
    candidateCount: 10,
    hitRate: 0.21,
    longestMissStreak: 8,
    averageHitRank: 4.2,
    coverage: 24,
    computedAt: new Date("2026-04-27T00:00:00.000Z")
  },
  results: [
    {
      id: "backtest-result-2026-04-16",
      runId: "backtest-run-balanced-001",
      drawId: "draw-2026-04-16",
      drawDate: new Date("2026-04-16T00:00:00.000Z"),
      generatedNumbers: ["47", "91", "24"],
      actualNumbers: ["47"],
      isHit: true,
      hitNumbers: ["47"],
      rankOfHit: 1
    },
    {
      id: "backtest-result-2026-04-01",
      runId: "backtest-run-balanced-001",
      drawId: "draw-2026-04-01",
      drawDate: new Date("2026-04-01T00:00:00.000Z"),
      generatedNumbers: ["03", "74", "29"],
      actualNumbers: ["18"],
      isHit: false,
      hitNumbers: []
    }
  ]
} as const;

export const backtestMockReadModel = backtestReadModelSchema.parse(
  toApiBacktestReadModel(backtestFixtureInput)
);
