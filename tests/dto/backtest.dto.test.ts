import { describe, expect, test } from "bun:test";
import {
  toApiBacktestHistoryItem,
  toApiBacktestHistoryResponse,
  toApiBacktestReadModel,
  toApiBacktestResult,
  toApiBacktestRun
} from "@/api/model/dto/backtest.dto";
import {
  backtestHistoryResponseSchema,
  backtestReadModelSchema
} from "@/schema/app/backtest.schema";

describe("backtest.dto", () => {
  test("normalizes dates, copies arrays, and strips unknown fields", () => {
    const resultInput = {
      actualNumbers: ["09"],
      drawDate: new Date("2026-04-16T00:00:00.000Z"),
      drawId: "draw-1",
      explanation: {
        calculationWindow: 30,
        candidateCount: 2,
        generatedCandidates: [
          {
            isHit: true,
            number: "09",
            numberLength: 2,
            positionBreakdown: [
              {
                digit: "0",
                hot: 20,
                overdue: 10,
                position: 5,
                positionIndex: 1,
                reasons: ["hot"],
                score: 35,
                tone: "hot" as const
              }
            ],
            rank: 1,
            reasons: ["strong hit"],
            score: 88,
            scoreBreakdown: {
              hot: 30,
              overdue: 20,
              pair: 10,
              pattern: 18,
              position: 10
            }
          }
        ],
        strategyId: "balanced",
        strategyName: "Balanced",
        version: "prediction-engine-v1"
      },
      generatedNumbers: ["09", "12"],
      hidden: "skip",
      hitNumbers: ["09"],
      id: "result-1",
      isHit: true,
      rankOfHit: 1,
      runId: "run-1"
    };
    const result = toApiBacktestResult({ ...resultInput, hidden: "skip" } as never);

    expect(result.drawDate).toBe("2026-04-16T00:00:00.000Z");
    expect(result.generatedNumbers).toEqual(["09", "12"]);
    expect(result.actualNumbers).toEqual(["09"]);
    expect(result.hitNumbers).toEqual(["09"]);
    expect(result.generatedNumbers).not.toBe(resultInput.generatedNumbers);
    expect(result.actualNumbers).not.toBe(resultInput.actualNumbers);
    expect(result.hitNumbers).not.toBe(resultInput.hitNumbers);
    expect(result.explanation).toEqual(resultInput.explanation);
    expect(result.explanation?.generatedCandidates).not.toBe(
      resultInput.explanation.generatedCandidates
    );
    expect(result).not.toHaveProperty("hidden");

    const run = toApiBacktestRun({
      averageHitRank: 1.5,
      candidateCount: 5,
      computedAt: new Date("2026-04-29T00:00:00.000Z"),
      coverage: 24,
      endDrawDate: new Date("2026-04-16T00:00:00.000Z"),
      hidden: "skip",
      hitRate: 12.5,
      id: "run-1",
      longestMissStreak: 7,
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      params: { mode: "balanced" },
      prizeType: "TWO_DIGIT",
      startDrawDate: new Date("2025-10-01T00:00:00.000Z"),
      strategyId: "balanced",
      strategyName: "Balanced",
      version: "v1"
    } as never);

    expect(run.computedAt).toBe("2026-04-29T00:00:00.000Z");
    expect(run.startDrawDate).toBe("2025-10-01T00:00:00.000Z");
    expect(run.endDrawDate).toBe("2026-04-16T00:00:00.000Z");
    expect(run).not.toHaveProperty("hidden");

    const historyItem = toApiBacktestHistoryItem({
      candidateCount: 5,
      computedAt: new Date("2026-04-29T00:00:00.000Z"),
      coverage: 24,
      hidden: "skip",
      hitRate: 12.5,
      id: "run-1",
      longestMissStreak: 7,
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      prizeType: "TWO_DIGIT",
      strategyId: "balanced",
      strategyName: "Balanced",
      version: "v1"
    } as never);

    expect(historyItem.computedAt).toBe("2026-04-29T00:00:00.000Z");
    expect(historyItem).not.toHaveProperty("hidden");

    const readModel = toApiBacktestReadModel({
      generatedAt: new Date("2026-04-29T00:00:00.000Z"),
      results: [result],
      run,
      source: "api"
    });
    const history = toApiBacktestHistoryResponse({
      generatedAt: new Date("2026-04-29T00:00:00.000Z"),
      items: [historyItem],
      source: "api"
    });

    expect(backtestReadModelSchema.parse(readModel)).toEqual(readModel);
    expect(backtestHistoryResponseSchema.parse(history)).toEqual(history);
  });
});
