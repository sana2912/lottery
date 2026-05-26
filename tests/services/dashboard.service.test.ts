import { afterEach, describe, expect, test } from "bun:test";
import { analyticsService } from "@/api/service/analytics.service";
import { dashboardService } from "@/api/service/dashboard.service";
import { predictionService } from "@/api/service/prediction.service";
import { dashboardReadModelSchema } from "@/schema/app/dashboard.schema";

const mutableAnalyticsService = analyticsService as {
  getAnalyticsReadModel: typeof analyticsService.getAnalyticsReadModel;
};
const mutablePredictionService = predictionService as {
  getLatestPredictionSummary: typeof predictionService.getLatestPredictionSummary;
};
const originalGetAnalyticsReadModel = analyticsService.getAnalyticsReadModel;
const originalGetLatestPredictionSummary = predictionService.getLatestPredictionSummary;

afterEach(() => {
  mutableAnalyticsService.getAnalyticsReadModel = originalGetAnalyticsReadModel;
  mutablePredictionService.getLatestPredictionSummary = originalGetLatestPredictionSummary;
  delete (globalThis as { prisma?: unknown }).prisma;
});

describe("dashboard.service", () => {
  test("builds latest draw, metric, signal, and prediction dashboard sections", async () => {
    let drawArgsSeen: unknown;
    let analyticsArgsSeen: unknown;

    (globalThis as { prisma?: unknown }).prisma = {
      lotteryDraw: {
        findFirst: async (args: unknown) => {
          drawArgsSeen = args;
          return {
            drawDate: new Date("2026-04-16T00:00:00.000Z"),
            drawNo: "08/2026",
            id: "draw-1",
            lotteryType: "THAI_GOVERNMENT",
            prizes: [
              { id: "first", number: "123456", position: 1, type: "FIRST" },
              { id: "front-1", number: "123", position: 1, type: "THREE_FRONT" },
              { id: "front-2", number: "456", position: 2, type: "THREE_FRONT" },
              { id: "two", number: "09", position: 1, type: "TWO_DIGIT" }
            ],
            sourceStatus: "VERIFIED"
          };
        }
      }
    };
    mutableAnalyticsService.getAnalyticsReadModel = async (args) => {
      analyticsArgsSeen = args;
      return analyticsModel([
        numberStat("09", 4, 13.33, 2, 40),
        numberStat("11", 1, 3.33, 27, 20),
        numberStat("99", 2, 6.67, 45, 35)
      ]);
    };
    mutablePredictionService.getLatestPredictionSummary = async () => ({
      candidates: [{ number: "09", reasons: ["Position support is strong."], score: 81 }],
      disclaimer: "Prediction disclaimer",
      generatedAt: "2026-04-29T00:00:00.000Z",
      title: "Latest prediction"
    });

    const model = await dashboardService.getDashboardReadModel();

    expect(drawArgsSeen).toMatchObject({
      include: { prizes: true },
      orderBy: { drawDate: "desc" },
      where: { drawDate: { lte: expect.any(Date) } }
    });
    expect(analyticsArgsSeen).toMatchObject({
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      page: 1,
      pageSize: 20,
      prizeType: "TWO_DIGIT",
      scope: "ALL_TIME"
    });
    expect(dashboardReadModelSchema.parse(model)).toEqual(model);
    expect(model.latestDraw.primaryPrize).toEqual({
      label: "First prize #1",
      value: "123456"
    });
    expect(model.latestDraw.secondaryPrizes).toEqual([
      { label: "Three-digit front", value: "123, 456" },
      { label: "Two-digit", value: "09" }
    ]);
    expect(model.metrics.map((metric) => [metric.label, metric.value])).toEqual([
      ["Draws in sample", "30"],
      ["Hot number", "09"],
      ["Cold number", "11"],
      ["Overdue number", "99"]
    ]);
    expect(model.signals.map((signal) => [signal.tone, signal.number])).toEqual([
      ["hot", "09"],
      ["overdue", "99"],
      ["cold", "11"]
    ]);
    expect(model.predictionSummary.candidates[0]?.number).toBe("09");
  });

  test("returns safe placeholders when latest draw, analytics, and predictions are empty", async () => {
    (globalThis as { prisma?: unknown }).prisma = {
      lotteryDraw: {
        findFirst: async () => null
      }
    };
    mutableAnalyticsService.getAnalyticsReadModel = async () => analyticsModel([]);
    mutablePredictionService.getLatestPredictionSummary = async () => null;

    const model = await dashboardService.getDashboardReadModel();

    expect(dashboardReadModelSchema.parse(model)).toEqual(model);
    expect(model.latestDraw).toMatchObject({
      drawDate: "-",
      drawNo: "-",
      primaryPrize: {
        label: "First prize",
        value: "-"
      },
      statusLabel: "Unavailable"
    });
    expect(model.metrics.map((metric) => metric.value)).toEqual(["30", "-", "-", "-"]);
    expect(model.signals).toEqual([]);
    expect(model.predictionSummary.title).toBe("Prediction summary unavailable");
  });
});

function analyticsModel(numberStats: ReturnType<typeof numberStat>[]) {
  return {
    digitStats: [],
    generatedAt: "2026-04-29T00:00:00.000Z",
    numberStats,
    patternSummaries: [],
    source: "api" as const,
    summary: {
      drawCount: 30,
      generatedAt: "2026-04-29T00:00:00.000Z"
    }
  };
}

function numberStat(
  number: string,
  hitCount: number,
  frequencyPercent: number,
  missingDrawCount: number,
  trendScore: number
) {
  return {
    computedAt: "2026-04-29T00:00:00.000Z",
    drawCount: 30,
    frequencyPercent,
    hitCount,
    lotteryType: "THAI_GOVERNMENT",
    missingDrawCount,
    number,
    numberLength: 2,
    patternFlags: [],
    prizeType: "TWO_DIGIT",
    trendScore
  };
}
