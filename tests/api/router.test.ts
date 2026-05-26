import { afterEach, describe, expect, test } from "bun:test";
import { createApiRouter } from "@/api/router";
import { analyticsService } from "@/api/service/analytics.service";
import { calendarService } from "@/api/service/calendar.service";
import { compareService } from "@/api/service/compare.service";
import { dashboardService } from "@/api/service/dashboard.service";
import { drawService } from "@/api/service/draw.service";
import { predictionService } from "@/api/service/prediction.service";
import { analyticsReadModelSchema } from "@/schema/app/analytics.schema";
import { calendarReadModelSchema } from "@/schema/app/calendar.schema";
import { compareReadModelSchema } from "@/schema/app/compare.schema";
import { dashboardReadModelSchema } from "@/schema/app/dashboard.schema";
import { drawDetailResponseSchema, drawListResponseSchema } from "@/schema/app/draw.schema";
import { predictionRequestSchema, predictionResponseSchema } from "@/schema/app/prediction.schema";

const mutableDrawService = drawService as {
  getDrawById: typeof drawService.getDrawById;
  getDraws: typeof drawService.getDraws;
};
const mutableAnalyticsService = analyticsService as {
  getAnalyticsReadModel: typeof analyticsService.getAnalyticsReadModel;
  getDigitStats: typeof analyticsService.getDigitStats;
  getNumberStats: typeof analyticsService.getNumberStats;
};
const mutablePredictionService = predictionService as {
  generate: typeof predictionService.generate;
  getLatestPrediction: typeof predictionService.getLatestPrediction;
  getPredictionById: typeof predictionService.getPredictionById;
};
const mutableCompareService = compareService as {
  compareNumbers: typeof compareService.compareNumbers;
};
const mutableCalendarService = calendarService as {
  getCalendarReadModel: typeof calendarService.getCalendarReadModel;
};
const mutableDashboardService = dashboardService as {
  getDashboardReadModel: typeof dashboardService.getDashboardReadModel;
};

const originalServices = {
  analyticsReadModel: analyticsService.getAnalyticsReadModel,
  calendarReadModel: calendarService.getCalendarReadModel,
  compareNumbers: compareService.compareNumbers,
  dashboardReadModel: dashboardService.getDashboardReadModel,
  digitStats: analyticsService.getDigitStats,
  drawById: drawService.getDrawById,
  draws: drawService.getDraws,
  numberStats: analyticsService.getNumberStats,
  predictionGenerate: predictionService.generate,
  predictionById: predictionService.getPredictionById,
  predictionLatest: predictionService.getLatestPrediction
} as const;

afterEach(() => {
  mutableDrawService.getDrawById = originalServices.drawById;
  mutableDrawService.getDraws = originalServices.draws;
  mutableAnalyticsService.getAnalyticsReadModel = originalServices.analyticsReadModel;
  mutableAnalyticsService.getDigitStats = originalServices.digitStats;
  mutableAnalyticsService.getNumberStats = originalServices.numberStats;
  mutablePredictionService.generate = originalServices.predictionGenerate;
  mutablePredictionService.getLatestPrediction = originalServices.predictionLatest;
  mutablePredictionService.getPredictionById = originalServices.predictionById;
  mutableCompareService.compareNumbers = originalServices.compareNumbers;
  mutableCalendarService.getCalendarReadModel = originalServices.calendarReadModel;
  mutableDashboardService.getDashboardReadModel = originalServices.dashboardReadModel;
});

describe("api router", () => {
  test("GET /api/draws validates query, coerces values, and returns list response", async () => {
    let receivedQuery: unknown;

    mutableDrawService.getDraws = async (query) => {
      receivedQuery = query;

      return drawListResponseSchema.parse(drawListResponse());
    };

    const response = await request(
      "/api/draws?page=2&pageSize=5&year=2026&month=4&q=09&prizeType=TWO_DIGIT"
    );

    expect(receivedQuery).toEqual({
      endDate: undefined,
      lotteryType: "THAI_GOVERNMENT",
      month: 4,
      page: 2,
      pageSize: 5,
      prizeType: "TWO_DIGIT",
      q: "09",
      startDate: undefined,
      year: 2026
    });
    expect(response.status).toBe(200);
    expect(drawListResponseSchema.parse(await response.json())).toBeTruthy();
  });

  test("GET /api/draws/:id returns detail or 404", async () => {
    mutableDrawService.getDrawById = async (id) =>
      id === "missing" ? null : drawDetailResponseSchema.parse(drawDetailResponse());

    const ok = await request("/api/draws/draw-1");
    const missing = await request("/api/draws/missing");

    expect(drawDetailResponseSchema.parse(await ok.json())).toBeTruthy();
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({
      error: "Not found",
      message: "Draw not found"
    });
  });

  test("GET /api/analytics routes parsed filter context to service methods", async () => {
    const readModel = analyticsReadModelSchema.parse(analyticsResponse());
    let readModelQuery: unknown;
    let digitQuery: unknown;
    let numberQuery: unknown;

    mutableAnalyticsService.getAnalyticsReadModel = async (query) => {
      readModelQuery = query;
      return readModel;
    };
    mutableAnalyticsService.getDigitStats = async (query) => {
      digitQuery = query;
      return readModel.digitStats;
    };
    mutableAnalyticsService.getNumberStats = async (query) => {
      numberQuery = query;
      return readModel.numberStats;
    };

    const [full, digits, numbers] = await Promise.all([
      request("/api/analytics?windowSize=50&numberLength=2&startDate=2026-04-01"),
      request("/api/analytics/digits?windowSize=50&numberLength=2"),
      request("/api/analytics/numbers?windowSize=50&numberLength=2")
    ]);

    expect(readModelQuery).toEqual({
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      page: 1,
      pageSize: 20,
      startDate: "2026-04-01"
    });
    expect(digitQuery).toEqual({
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      page: 1,
      pageSize: 20
    });
    expect(numberQuery).toEqual(digitQuery);
    expect(analyticsReadModelSchema.parse(await full.json())).toBeTruthy();
    expect(await digits.json()).toEqual(readModel.digitStats);
    expect(await numbers.json()).toEqual(readModel.numberStats);
  });

  test("prediction routes handle scaffold GET and validated POST body", async () => {
    let receivedBody: unknown;

    mutablePredictionService.getLatestPrediction = async () =>
      predictionResponseSchema.parse(
        predictionResponse({
          count: 3,
          lotteryType: "THAI_GOVERNMENT",
          numberLength: 2,
          patternIds: [],
          prizeType: "TWO_DIGIT",
          strategyId: "balanced",
          windowSize: 120
        })
      );
    mutablePredictionService.getPredictionById = async (id) =>
      id === "missing"
        ? null
        : predictionResponseSchema.parse(
            predictionResponse({
              count: 3,
              lotteryType: "THAI_GOVERNMENT",
              numberLength: 2,
              patternIds: [],
              prizeType: "TWO_DIGIT",
              strategyId: "balanced",
              windowSize: 120
            })
          );
    mutablePredictionService.generate = async (input) => {
      receivedBody = input;
      return predictionResponseSchema.parse(
        predictionResponse(predictionRequestSchema.parse(input))
      );
    };

    const [getResponse, detailResponse, missingResponse, postResponse] = await Promise.all([
      request("/api/predictions"),
      request("/api/predictions/run-1"),
      request("/api/predictions/missing"),
      request("/api/predictions", {
        body: JSON.stringify({
          count: "3",
          numberLength: "2",
          prizeType: "TWO_DIGIT",
          strategyId: "balanced",
          windowSize: "120"
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      })
    ]);

    expect(predictionResponseSchema.parse(await getResponse.json())).toBeTruthy();
    expect(predictionResponseSchema.parse(await detailResponse.json())).toBeTruthy();
    expect(missingResponse.status).toBe(404);
    expect(await missingResponse.json()).toEqual({
      error: "Not found",
      message: "Prediction run not found"
    });
    expect(receivedBody).toEqual({
      count: 3,
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      patternIds: [],
      prizeType: "TWO_DIGIT",
      strategyId: "balanced",
      windowSize: 120
    });
    expect(predictionResponseSchema.parse(await postResponse.json())).toBeTruthy();
  });

  test("compare route validates body and returns schema-valid response", async () => {
    let receivedBody: unknown;

    mutableCompareService.compareNumbers = async (input) => {
      receivedBody = input;
      return compareReadModelSchema.parse(compareReadModel());
    };

    const response = await request("/api/compare", {
      body: JSON.stringify({
        numbers: ["09", "11"],
        numberLength: "2",
        prizeType: "TWO_DIGIT",
        strategyId: "balanced",
        windowSize: "120"
      }),
      headers: { "content-type": "application/json" },
      method: "POST"
    });

    expect(receivedBody).toEqual({
      endDate: undefined,
      lotteryType: "THAI_GOVERNMENT",
      month: undefined,
      numberLength: 2,
      numbers: ["09", "11"],
      page: 1,
      pageSize: 20,
      prizeType: "TWO_DIGIT",
      q: undefined,
      startDate: undefined,
      strategyId: "balanced",
      windowSize: 120,
      year: undefined
    });
    expect(compareReadModelSchema.parse(await response.json())).toBeTruthy();
  });

  test("calendar route returns a schema-valid response", async () => {
    let receivedQuery: unknown;
    mutableCalendarService.getCalendarReadModel = async (query) => {
      receivedQuery = query;

      return calendarReadModelSchema.parse(calendarReadModel());
    };

    const response = await request("/api/calendar?month=4&year=2026&prizeType=FIRST&scope=MONTH");

    expect(receivedQuery).toEqual({
      month: 4,
      prizeType: "FIRST",
      scope: "MONTH",
      year: 2026
    });
    expect(calendarReadModelSchema.parse(await response.json())).toBeTruthy();
  });

  test("dashboard route returns a schema-valid response", async () => {
    mutableDashboardService.getDashboardReadModel = async () =>
      dashboardReadModelSchema.parse(dashboardReadModel());

    const response = await request("/api/dashboard");

    expect(dashboardReadModelSchema.parse(await response.json())).toBeTruthy();
  });
});

function request(path: string, init?: RequestInit) {
  return createApiRouter().fetch(new Request(`http://localhost${path}`, init));
}

function drawListResponse() {
  return {
    draws: [
      {
        coverage: "2 prize records",
        drawDate: "16 April 2026",
        drawDateIso: "2026-04-16T00:00:00.000Z",
        drawNo: "08/2026",
        id: "draw-1",
        lotteryType: "THAI_GOVERNMENT",
        publishedAt: "2026-04-16T09:00:00.000Z",
        prizes: [
          { id: "p1", label: "First prize", number: "123456", type: "FIRST" },
          { id: "p2", label: "Two-digit", number: "09", type: "TWO_DIGIT" }
        ],
        status: "complete" as const,
        statusLabel: "Complete",
        sourceStatus: "VERIFIED" as const,
        sourceUrl: "https://example.com/draws/2026-04-16"
      }
    ],
    filters: {
      endDate: undefined,
      lotteryType: "THAI_GOVERNMENT",
      month: 4,
      prizeType: "TWO_DIGIT",
      q: "09",
      startDate: undefined,
      year: 2026
    },
    generatedAt: "2026-04-29T00:00:00.000Z",
    pagination: {
      page: 2,
      pageSize: 5,
      total: 1,
      totalPages: 1
    },
    source: "api" as const
  };
}

function drawDetailResponse() {
  return {
    draw: drawListResponse().draws[0],
    generatedAt: "2026-04-29T00:00:00.000Z",
    source: "api" as const
  };
}

function analyticsResponse() {
  return {
    digitStats: [
      {
        computedAt: "2026-04-29T00:00:00.000Z",
        digit: "0",
        drawCount: 2,
        frequencyPercent: 50,
        hitCount: 1,
        lotteryType: "THAI_GOVERNMENT",
        missingDrawCount: 0,
        position: 1,
        prizeType: "TWO_DIGIT",
        trendDirection: "up" as const
      }
    ],
    generatedAt: "2026-04-29T00:00:00.000Z",
    numberStats: [
      {
        computedAt: "2026-04-29T00:00:00.000Z",
        drawCount: 2,
        frequencyPercent: 50,
        hitCount: 1,
        lotteryType: "THAI_GOVERNMENT",
        missingDrawCount: 0,
        number: "09",
        numberLength: 2,
        patternFlags: ["odd", "high", "ascending"] as const,
        prizeType: "TWO_DIGIT",
        samplePrizeCount: 1,
        trendScore: 65
      }
    ],
    patternSummaries: [
      {
        frequencyPercent: 100,
        hitCount: 1,
        id: "pattern-odd",
        insight: "odd appeared in 1 tracked number groups from 2 draws.",
        label: "odd",
        pattern: "odd" as const,
        sampleSize: 1
      }
    ],
    source: "api" as const,
    summary: {
      drawCount: 2,
      generatedAt: "2026-04-29T00:00:00.000Z"
    }
  };
}

function predictionResponse(input: {
  count: number;
  lotteryType: "THAI_GOVERNMENT";
  numberLength: 2 | 3 | 6;
  patternIds: string[];
  prizeType:
    | "FIRST"
    | "THREE_DIGIT"
    | "THREE_FRONT"
    | "THREE_BACK"
    | "TWO_DIGIT"
    | "NEAR_FIRST"
    | "PRIZE2"
    | "PRIZE3"
    | "PRIZE4"
    | "PRIZE5";
  strategyId: "balanced" | "coldRebound" | "hotTrend";
  windowSize: number;
}) {
  return {
    generatedAt: "2026-04-29T00:00:00.000Z",
    input,
    results: [
      {
        id: "balanced-TWO_DIGIT-09",
        inputWindow: 120,
        number: "09",
        numberLength: 2,
        positionBreakdown: [
          {
            digit: "0",
            hot: 40,
            overdue: 20,
            position: 50,
            positionIndex: 1,
            reasons: ["Historical frequency is 50% in position 1."],
            score: 0,
            tone: "warm"
          }
        ],
        rank: 1,
        reasons: ["Historical frequency is 12.5% in the selected window."],
        score: 50,
        scoreBreakdown: {
          hot: 40,
          overdue: 50,
          pair: 0,
          pattern: 18,
          position: 60
        },
        strategyId: "balanced" as const,
        strategyName: "Balanced",
        version: "prediction-engine-v1"
      }
    ],
    source: "api" as const
  };
}

function compareReadModel() {
  return {
    candidates: [
      {
        number: "09",
        numberLength: 2,
        rank: 1,
        reasons: ["Historical frequency is 12.5% in the selected window."],
        score: 50,
        scoreBreakdown: {
          hot: 40,
          overdue: 50,
          pair: 0,
          pattern: 18,
          position: 60
        }
      }
    ],
    generatedAt: "2026-04-29T00:00:00.000Z",
    sampleSize: 24,
    source: "api" as const,
    strategyId: "balanced" as const,
    strongestSignal: "position"
  };
}

function calendarReadModel() {
  return {
    draws: [
      {
        drawDate: "1 May 2026",
        drawDateIso: "2026-05-01T00:00:00.000Z",
        drawNo: "09/2026",
        id: "upcoming-2026-05-01",
        isNextDraw: true,
        status: "upcoming" as const
      }
    ],
    generatedAt: "2026-04-29T00:00:00.000Z",
    monthlyInsights: [
      {
        coldNumbers: ["01", "02"],
        heatmapRows: [
          {
            cells: [
              {
                appearanceCount: 8,
                digit: "0",
                missingRounds: 0,
                score: 90,
                tone: "hot" as const
              }
            ],
            coldDigits: ["9"],
            hotDigits: ["0"],
            position: 1
          }
        ],
        hotNumbers: ["09", "12"],
        id: "monthly-insight-4",
        label: "April",
        month: 4,
        patternNotes: ["odd-ending numbers appeared slightly more often in the sampled month."],
        prizeType: "FIRST",
        positionInsights: [
          {
            coldNumbers: [
              { appearanceCount: 1, digit: "03", missingRounds: 6 },
              { appearanceCount: 2, digit: "04", missingRounds: 4 }
            ],
            hotNumbers: [
              { appearanceCount: 8, digit: "07", missingRounds: 0 },
              { appearanceCount: 7, digit: "08", missingRounds: 1 }
            ],
            position: 1
          }
        ],
        sampleSize: 8,
        summary: "April has 8 historical draws in sample."
      }
    ],
    nextDraw: {
      drawDate: "1 May 2026",
      drawDateIso: "2026-05-01T00:00:00.000Z",
      drawNo: "09/2026",
      id: "upcoming-2026-05-01",
      isNextDraw: true,
      status: "upcoming" as const
    },
    source: "api" as const
  };
}

function dashboardReadModel() {
  return {
    contractRows: [
      {
        field: "latestDraw",
        purpose: "Shows the latest draw.",
        source: "LotteryDraw + LotteryPrize"
      }
    ],
    generatedAt: "2026-04-29T00:00:00.000Z",
    hero: {
      description: "Dashboard summary",
      eyebrow: "Dashboard contract",
      primaryActionHref: "/results",
      primaryActionLabel: "Review historical results",
      title: "Dashboard"
    },
    latestDraw: {
      drawDate: "16 April 2026",
      drawDateIso: "2026-04-16T00:00:00.000Z",
      drawNo: "08/2026",
      id: "draw-1",
      lotteryType: "THAI_GOVERNMENT",
      primaryPrize: {
        label: "First prize",
        value: "123456"
      },
      secondaryPrizes: [
        {
          label: "Two-digit",
          value: "09"
        }
      ],
      statusLabel: "Complete"
    },
    metrics: [
      {
        hint: "Distinct draw records included in the current two-digit analysis sample.",
        label: "Draws in sample",
        tone: "default" as const,
        trend: "Full eligible sample",
        value: "24"
      }
    ],
    predictionSummary: {
      candidates: [],
      disclaimer: "Prediction summary unavailable.",
      generatedAt: "2026-04-29T00:00:00.000Z",
      title: "Prediction summary unavailable"
    },
    signals: [
      {
        id: "signal-hot-09",
        label: "Hot signal",
        number: "09",
        reason: "Repeated more often than the current two-digit sample average.",
        score: 50,
        tone: "hot" as const
      }
    ],
    source: "api" as const
  };
}
