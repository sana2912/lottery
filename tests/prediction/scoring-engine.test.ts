import { describe, expect, test } from "bun:test";
import { PREDICTION_ENGINE_VERSION, scoreNumber } from "@/api/service/prediction/scoring-engine";
import { getPredictionStrategy } from "@/api/service/prediction/strategy-registry";
import type { ApiNumberStat } from "@/schema/api/analytics";

describe("scoreNumber", () => {
  test("returns deterministic weighted scores and rich reasons", () => {
    const stat: ApiNumberStat = {
      averageGap: 2.5,
      computedAt: "2026-04-29T00:00:00.000Z",
      drawCount: 24,
      frequencyPercent: 12.5,
      hitCount: 3,
      lastSeenDrawDate: "2026-04-16T00:00:00.000Z",
      lotteryType: "THAI_GOVERNMENT",
      maxGap: 6,
      missingDrawCount: 20,
      number: "11",
      numberLength: 2,
      patternFlags: ["odd", "low", "double", "mirror"],
      prizeType: "TWO_DIGIT",
      trendScore: 80,
      windowSize: 120
    };

    const result = scoreNumber({
      inputWindow: 120,
      rank: 1,
      stat,
      strategy: getPredictionStrategy("balanced")
    });

    expect(result).toEqual({
      id: "balanced-TWO_DIGIT-11",
      inputWindow: 120,
      number: "11",
      numberLength: 2,
      positionBreakdown: [],
      rank: 1,
      reasons: [
        "Historical frequency is 12.5% in the selected window.",
        "Missing draw count is 20.",
        "Trend score is 80.",
        "Pattern flags: odd, low, double, mirror.",
        "Shape has 1 unique digit across 2 positions.",
        "Digit sum is 2 (low range).",
        "Largest repeated digit group is 2.",
        "Contains a palindrome / mirror shape.",
        "Last seen at 2026-04-16T00:00:00.000Z."
      ],
      score: 59.69,
      scoreBreakdown: {
        hot: 100,
        overdue: 18.21,
        pair: 41,
        pattern: 13,
        position: 80
      },
      strategyId: "balanced",
      strategyName: "Balanced",
      version: PREDICTION_ENGINE_VERSION
    });
  });

  test("stays deterministic for the same input", () => {
    const stat: ApiNumberStat = {
      computedAt: "2026-04-29T00:00:00.000Z",
      drawCount: 10,
      frequencyPercent: 5,
      hitCount: 1,
      lotteryType: "THAI_GOVERNMENT",
      missingDrawCount: 1,
      number: "09",
      numberLength: 2,
      patternFlags: ["odd", "high", "ascending"],
      prizeType: "TWO_DIGIT",
      trendScore: 33.33,
      windowSize: 120
    };
    const input = {
      inputWindow: 120,
      rank: 2,
      stat,
      strategy: getPredictionStrategy("hotTrend")
    } as const;

    expect(scoreNumber(input)).toEqual(scoreNumber(input));
  });
});
