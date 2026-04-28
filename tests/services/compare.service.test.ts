import { afterEach, describe, expect, test } from "bun:test";
import { analyticsService } from "@/api/service/analytics.service";
import { compareService } from "@/api/service/compare.service";
import { compareReadModelSchema } from "@/schema/app/compare.schema";

const mutableAnalyticsService = analyticsService as {
  getNumberStats: typeof analyticsService.getNumberStats;
};
const originalGetNumberStats = analyticsService.getNumberStats;

afterEach(() => {
  mutableAnalyticsService.getNumberStats = originalGetNumberStats;
});

describe("compare.service", () => {
  test("scores unique candidate numbers, fills missing stats safely, and returns schema-valid output", async () => {
    mutableAnalyticsService.getNumberStats = async () => [
      stat("09", 12.5, 20, 80, ["odd", "high", "ascending"]),
      stat("11", 12.5, 20, 80, ["odd", "low", "double", "mirror"])
    ];

    const response = await compareService.compareNumbers({
      endDate: undefined,
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      numbers: ["09", "11", "11", "22", "  "],
      page: 1,
      pageSize: 20,
      prizeType: "TWO_DIGIT",
      q: undefined,
      startDate: undefined,
      strategyId: "balanced",
      windowSize: 120
    });

    expect(compareReadModelSchema.parse(response)).toEqual(response);
    expect(response.candidates.map((candidate) => candidate.number)).toEqual(["11", "09", "22"]);
    expect(response.candidates.at(-1)).toMatchObject({
      number: "22",
      numberLength: 2,
      reasons: expect.any(Array)
    });
    expect(response.sampleSize).toBe(24);
    expect(response.strongestSignal).toBeTruthy();
  });
});

function stat(
  number: string,
  frequencyPercent: number,
  missingDrawCount: number,
  trendScore: number,
  patternFlags: ("odd" | "even" | "high" | "low" | "double" | "ascending" | "mirror")[]
) {
  return {
    computedAt: "2026-04-29T00:00:00.000Z",
    drawCount: 24,
    frequencyPercent,
    hitCount: 3,
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
