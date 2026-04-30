import { afterEach, describe, expect, test } from "bun:test";
import { analyticsService } from "@/api/service/analytics.service";
import { getLatestPrediction, predictionService } from "@/api/service/prediction.service";
import { predictionResponseSchema } from "@/schema/app/prediction.schema";

const mutableAnalyticsService = analyticsService as {
  getNumberStats: typeof analyticsService.getNumberStats;
};
const originalGetNumberStats = analyticsService.getNumberStats;

afterEach(() => {
  mutableAnalyticsService.getNumberStats = originalGetNumberStats;
  delete (globalThis as { prisma?: unknown }).prisma;
});

describe("prediction.service", () => {
  test("ranks candidates by score, limits by count, and returns a schema-valid response", async () => {
    (globalThis as { prisma?: unknown }).prisma = {
      predictionRun: {
        create: async () => ({ id: "run-1" })
      }
    };
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

  test("returns an empty result set when analytics has no candidates", async () => {
    (globalThis as { prisma?: unknown }).prisma = {
      predictionRun: {
        create: async () => ({ id: "run-1" })
      }
    };
    mutableAnalyticsService.getNumberStats = async () => [];

    const response = await predictionService.generate({
      count: 5,
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      prizeType: "TWO_DIGIT",
      strategyId: "balanced",
      windowSize: 120
    });

    expect(predictionResponseSchema.parse(response)).toEqual(response);
    expect(response.results).toEqual([]);
  });

  test("returns only available candidates when analytics returns fewer than requested", async () => {
    (globalThis as { prisma?: unknown }).prisma = {
      predictionRun: {
        create: async () => ({ id: "run-1" })
      }
    };
    mutableAnalyticsService.getNumberStats = async () => [
      stat("09", 1, ["odd", "high", "ascending"], 12.5, 20, 80),
      stat("11", 1, ["odd", "low", "double", "mirror"], 12.5, 20, 80)
    ];

    const response = await predictionService.generate({
      count: 5,
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      prizeType: "TWO_DIGIT",
      strategyId: "balanced",
      windowSize: 120
    });

    expect(predictionResponseSchema.parse(response)).toEqual(response);
    expect(response.results).toHaveLength(2);
    expect(response.results.map((item) => item.rank)).toEqual([1, 2]);
  });

  test("persists generated runs and reloads the latest persisted prediction response", async () => {
    let savedRun:
      | undefined
      | {
          params?: unknown;
        };

    (globalThis as { prisma?: unknown }).prisma = {
      predictionRun: {
        create: async ({ data }: { data: { params?: unknown } }) => {
          savedRun = data;
          return { id: "run-1" };
        },
        findFirst: async () =>
          savedRun
            ? {
                id: "run-1",
                items: [],
                params: savedRun.params,
                strategy: "balanced",
                updatedAt: new Date("2026-04-29T00:00:00.000Z")
              }
            : null
      }
    };

    mutableAnalyticsService.getNumberStats = async () => [
      stat("09", 1, ["odd", "high", "ascending"], 12.5, 20, 80)
    ];

    const generated = await predictionService.generate({
      count: 1,
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      prizeType: "TWO_DIGIT",
      strategyId: "balanced",
      windowSize: 120
    });
    const latest = await getLatestPrediction();

    expect(predictionResponseSchema.parse(generated)).toEqual(generated);
    expect(latest && predictionResponseSchema.parse(latest)).toEqual(latest);
    expect(latest?.results[0]?.number).toBe("09");
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
