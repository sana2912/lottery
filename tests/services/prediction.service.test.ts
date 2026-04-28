import { afterEach, describe, expect, test } from "bun:test";
import { analyticsService } from "@/api/service/analytics.service";
import { predictionService } from "@/api/service/prediction.service";
import { predictionResponseSchema } from "@/schema/app/prediction.schema";

const mutableAnalyticsService = analyticsService as {
  getNumberStats: typeof analyticsService.getNumberStats;
};
const originalGetNumberStats = analyticsService.getNumberStats;

afterEach(() => {
  mutableAnalyticsService.getNumberStats = originalGetNumberStats;
});

describe("prediction.service", () => {
  test("ranks candidates by score, limits by count, and returns a schema-valid response", async () => {
    mutableAnalyticsService.getNumberStats = async () => [
      stat("09", 1, ["odd", "high", "ascending"], 12.5, 20, 80),
      stat("11", 1, ["odd", "low", "double", "mirror"], 12.5, 20, 80),
      stat("22", 1, ["even", "low", "double", "mirror"], 4, 2, 40)
    ];

    const response = await predictionService.generate({
      count: 2,
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      prizeType: "TWO_DIGIT",
      strategyId: "balanced",
      windowSize: 120
    });

    expect(predictionResponseSchema.parse(response)).toEqual(response);
    expect(response.results).toHaveLength(2);
    expect(response.results.map((item) => item.number)).toEqual(["11", "09"]);
    expect(response.results.map((item) => item.rank)).toEqual([1, 2]);
  });
});

function stat(
  number: string,
  hitCount: number,
  patternFlags: ("odd" | "even" | "high" | "low" | "double" | "ascending" | "mirror")[],
  frequencyPercent: number,
  missingDrawCount: number,
  trendScore: number
) {
  return {
    computedAt: "2026-04-29T00:00:00.000Z",
    drawCount: 24,
    frequencyPercent,
    hitCount,
    lotteryType: "THAI_GOVERNMENT",
    missingDrawCount,
    number,
    numberLength: 2,
    patternFlags,
    prizeType: "TWO_DIGIT",
    trendScore,
    windowSize: 120
  };
}
