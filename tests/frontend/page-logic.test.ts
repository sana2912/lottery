import { describe, expect, test } from "bun:test";
import {
  getTopDigits,
  getTopNumbers,
  toDigitHeatmapCells,
  toNumberFrequencyPoints
} from "@/frontend/pages/analytics/analytics.mappers";
import {
  defaultBacktestFormState,
  mergeBacktestHistory,
  toBacktestChartPoints,
  toBacktestPayload
} from "@/frontend/pages/backtest/backtest.mappers";
import {
  getDaysUntilNextDraw,
  parseCalendarPageFilters,
  toCalendarApiQuery
} from "@/frontend/pages/calendar/calendar.mappers";
import {
  getPredictionNumberLength,
  getTopPredictionScore,
  toPredictionPayload,
  toPredictionWatchlistPayload
} from "@/frontend/pages/prediction-lab/prediction-lab.mappers";
import { resultsContent } from "@/frontend/pages/results/results.content";
import { toResultsModel, toResultsShellModel } from "@/frontend/pages/results/results.mappers";
import { toResultsApiQuery } from "@/frontend/pages/results/results.query";
import {
  defaultWatchlistFormState,
  parseWatchlistTags,
  toCreateWatchlistPayload,
  toUpdateWatchlistPayload
} from "@/frontend/pages/watchlist/watchlist.mappers";
import type { AnalyticsReadModel } from "@/schema/app/analytics.schema";
import type { DrawListResponse } from "@/schema/app/draw.schema";
import type { ResultsReadModel } from "@/schema/app/results.schema";

describe("frontend logic helpers", () => {
  test("analytics mappers keep the top items and build stable chart ids", () => {
    const analytics: AnalyticsReadModel = {
      digitStats: Array.from({ length: 12 }, (_, index) => ({
        computedAt: "2026-04-29T00:00:00.000Z",
        digit: String(index),
        drawCount: 20,
        frequencyPercent: index + 0.5,
        hitCount: index + 1,
        lastSeenDrawDate: undefined,
        lotteryType: "THAI_GOVERNMENT",
        missingDrawCount: 0,
        patternFlags: [],
        position: index,
        prizeType: "TWO_DIGIT",
        trendDirection: "flat",
        windowSize: 120
      })),
      generatedAt: "2026-04-29T00:00:00.000Z",
      numberStats: Array.from({ length: 9 }, (_, index) => ({
        averageGap: undefined,
        computedAt: "2026-04-29T00:00:00.000Z",
        drawCount: 20,
        frequencyPercent: index + 0.25,
        hitCount: index + 1,
        lastSeenDrawDate: undefined,
        lotteryType: "THAI_GOVERNMENT",
        maxGap: undefined,
        missingDrawCount: 0,
        number: `0${index}`,
        numberLength: 2,
        patternFlags: [],
        prizeType: "TWO_DIGIT",
        trendScore: 10 - index,
        windowSize: 120
      })),
      patternSummaries: [],
      source: "api",
      summary: {
        drawCount: 0,
        generatedAt: "2026-04-29T00:00:00.000Z"
      }
    };

    expect(getTopDigits(analytics)).toHaveLength(10);
    expect(getTopNumbers(analytics)).toHaveLength(8);
    expect(toDigitHeatmapCells(analytics)[0]).toEqual({
      id: "TWO_DIGIT-0-0",
      label: "0",
      value: 1
    });
    expect(toNumberFrequencyPoints(analytics)[0]).toEqual({
      id: "TWO_DIGIT-00",
      label: "00",
      value: 0.25
    });
  });

  test("backtest mappers shape payloads and history consistently", () => {
    expect(
      toBacktestPayload({
        ...defaultBacktestFormState,
        windowSize: "90"
      })
    ).toEqual({
      candidateCount: "5",
      lotteryType: "THAI_GOVERNMENT",
      numberLength: "2",
      params: { windowSize: "90" },
      prizeType: "TWO_DIGIT",
      strategyId: "balanced",
      windowSize: "90"
    });

    expect(
      toBacktestChartPoints({
        generatedAt: "2026-04-29T00:00:00.000Z",
        results: [
          {
            actualNumbers: ["11"],
            drawDate: "2026-04-16T00:00:00.000Z",
            drawId: "draw-1",
            generatedNumbers: ["11"],
            hitNumbers: ["11"],
            id: "result-1",
            isHit: true,
            rankOfHit: 1,
            runId: "run-1"
          },
          {
            actualNumbers: ["22"],
            drawDate: "2026-04-17T00:00:00.000Z",
            drawId: "draw-2",
            generatedNumbers: ["33"],
            hitNumbers: [],
            id: "result-2",
            isHit: false,
            rankOfHit: 10,
            runId: "run-1"
          }
        ],
        run: {
          candidateCount: 5,
          computedAt: "2026-04-29T00:00:00.000Z",
          coverage: 22,
          endDrawDate: "2026-04-16T00:00:00.000Z",
          hitRate: 50,
          id: "run-1",
          longestMissStreak: 3,
          lotteryType: "THAI_GOVERNMENT",
          numberLength: 2,
          params: {},
          prizeType: "TWO_DIGIT",
          startDrawDate: "2026-01-01T00:00:00.000Z",
          strategyId: "balanced",
          strategyName: "Balanced",
          version: "prediction-engine-v1"
        },
        source: "api"
      }).map((point) => point.value)
    ).toEqual([100, 15]);

    const merged = mergeBacktestHistory(
      {
        generatedAt: "2026-04-29T00:00:00.000Z",
        items: Array.from({ length: 9 }, (_, index) => ({
          candidateCount: 5,
          computedAt: `2026-04-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
          coverage: index,
          hitRate: index,
          id: index === 0 ? "run-1" : `run-${index + 1}`,
          longestMissStreak: index,
          lotteryType: "THAI_GOVERNMENT",
          numberLength: 2,
          prizeType: "TWO_DIGIT",
          strategyId: "balanced",
          strategyName: "Balanced",
          version: "prediction-engine-v1"
        })),
        source: "api"
      },
      {
        generatedAt: "2026-04-29T00:00:00.000Z",
        results: [],
        run: {
          candidateCount: 7,
          computedAt: "2026-04-30T00:00:00.000Z",
          coverage: 88,
          endDrawDate: "2026-04-16T00:00:00.000Z",
          hitRate: 66.7,
          id: "run-1",
          longestMissStreak: 1,
          lotteryType: "THAI_GOVERNMENT",
          numberLength: 2,
          params: {},
          prizeType: "TWO_DIGIT",
          startDrawDate: "2026-01-01T00:00:00.000Z",
          strategyId: "hotTrend",
          strategyName: "Hot trend",
          version: "prediction-engine-v2"
        },
        source: "api"
      }
    );

    expect(merged.items).toHaveLength(8);
    expect(merged.items[0]).toMatchObject({
      candidateCount: 7,
      id: "run-1",
      strategyId: "hotTrend",
      version: "prediction-engine-v2"
    });
  });

  test("prediction lab and watchlist helpers keep text-only payloads stable", () => {
    expect(
      toPredictionPayload({
        count: "12",
        prizeType: "FIRST",
        strategyId: "coldRebound",
        windowSize: "180"
      })
    ).toEqual({
      count: "12",
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 6,
      prizeType: "FIRST",
      strategyId: "coldRebound",
      windowSize: "180"
    });
    expect(getPredictionNumberLength("TWO_DIGIT")).toBe(2);

    expect(
      toPredictionWatchlistPayload({
        id: "result-1",
        inputWindow: 120,
        number: "11",
        numberLength: 2,
        positionBreakdown: [],
        rank: 1,
        reasons: ["hot"],
        score: 91.5,
        scoreBreakdown: {
          hot: 30,
          overdue: 20,
          pair: 10,
          pattern: 20,
          position: 11.5
        },
        strategyId: "balanced",
        strategyName: "Balanced",
        version: "prediction-engine-v1"
      })
    ).toEqual({
      note: "Saved from Prediction Lab using Balanced. Score: 91.5.",
      number: "11",
      source: "PREDICTION",
      tags: ["prediction", "balanced"]
    });

    expect(getTopPredictionScore(null)).toBe("-");
    expect(
      getTopPredictionScore({
        generatedAt: "2026-04-29T00:00:00.000Z",
        input: {
          count: 5,
          lotteryType: "THAI_GOVERNMENT",
          numberLength: 2,
          prizeType: "TWO_DIGIT",
          strategyId: "balanced",
          windowSize: 120
        },
        results: [
          {
            id: "result-1",
            inputWindow: 120,
            number: "11",
            numberLength: 2,
            positionBreakdown: [],
            rank: 1,
            reasons: [],
            score: 94,
            scoreBreakdown: {
              hot: 30,
              overdue: 20,
              pair: 10,
              pattern: 20,
              position: 14
            },
            strategyId: "balanced",
            strategyName: "Balanced",
            version: "prediction-engine-v1"
          }
        ],
        source: "api"
      })
    ).toBe("94");
  });

  test("results helpers map API models and query shapes", () => {
    const shell: ResultsReadModel = {
      contractRows: [],
      draws: [],
      filters: {
        defaultLotteryType: "THAI_GOVERNMENT",
        defaultPrizeType: "TWO_DIGIT",
        lotteryTypes: ["THAI_GOVERNMENT"],
        prizeTypes: ["TWO_DIGIT"]
      },
      generatedAt: "2026-04-29T00:00:00.000Z",
      highlights: [],
      hero: {
        eyebrow: "eyebrow",
        title: "title",
        description: "description",
        coverageLabel: "coverage",
        coverageValue: "0"
      },
      mockNote: "shell note",
      source: "api",
      stats: [
        {
          hint: "latest",
          label: "Latest draw",
          value: "2026-04-29"
        },
        {
          hint: "draws",
          label: "Draw records",
          value: "1"
        },
        {
          hint: "prizes",
          label: "Prize records",
          value: "2"
        }
      ]
    };

    const response: DrawListResponse = {
      draws: [
        {
          coverage: "88%",
          drawDate: "2026-04-29",
          drawDateIso: "2026-04-29T00:00:00.000Z",
          drawNo: "1234",
          id: "draw-1",
          lotteryType: "THAI_GOVERNMENT",
          prizes: [
            {
              id: "prize-1",
              label: "First",
              number: "11",
              position: 1,
              type: "FIRST"
            },
            {
              id: "prize-2",
              label: "Second",
              number: "22",
              position: 2,
              type: "PRIZE2"
            }
          ],
          sourceStatus: "VERIFIED",
          status: "complete",
          statusLabel: "Complete"
        }
      ],
      filters: {
        endDate: undefined,
        lotteryType: "THAI_GOVERNMENT",
        month: undefined,
        prizeType: "TWO_DIGIT",
        q: undefined,
        startDate: undefined,
        year: undefined
      },
      generatedAt: "2026-04-29T00:00:00.000Z",
      pagination: {
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1
      },
      source: "api"
    };

    const model = toResultsModel(response, shell, resultsContent);

    expect(model.draws[0]).toEqual({
      coverage: "88%",
      drawDate: "2026-04-29",
      drawDateIso: "2026-04-29T00:00:00.000Z",
      drawNo: "1234",
      id: "draw-1",
      lotteryType: "THAI_GOVERNMENT",
      prizes: [
        {
          label: "First",
          prizeType: "FIRST",
          value: "11"
        },
        {
          label: "Second",
          prizeType: "PRIZE2",
          value: "22"
        }
      ],
      status: "complete",
      statusLabel: "Complete"
    });
    expect(model.mockNote).toBe(resultsContent.fallbackNotes.ready);
    expect(model.stats.map((stat) => stat.value)).toEqual(["2026-04-29", "1", "2"]);

    const shellModel = toResultsShellModel(shell, "fallback note");

    expect(shellModel.draws).toEqual([]);
    expect(shellModel.mockNote).toBe("fallback note");
    expect(shellModel.source).toBe("mock");
    expect(shellModel.stats.map((stat) => stat.value)).toEqual(["-", "0", "0"]);
    expect(Date.parse(shellModel.generatedAt)).not.toBeNaN();

    expect(
      toResultsApiQuery({
        endDate: "2026-04-16",
        lotteryType: "THAI_GOVERNMENT",
        month: 4,
        page: 2,
        pageSize: 50,
        prizeType: "TWO_DIGIT",
        q: "11",
        startDate: "2026-01-01",
        year: 2026
      })
    ).toEqual({
      endDate: "2026-04-16",
      lotteryType: "THAI_GOVERNMENT",
      month: 4,
      page: 2,
      pageSize: 50,
      prizeType: "TWO_DIGIT",
      q: "11",
      startDate: "2026-01-01",
      year: 2026
    });
  });

  test("calendar and watchlist helpers normalize simple text data", () => {
    expect(
      parseCalendarPageFilters({
        month: "5",
        prizeType: "FIRST",
        windowSize: "48"
      })
    ).toEqual({
      month: 5,
      prizeType: "FIRST",
      windowSize: 48
    });
    expect(
      toCalendarApiQuery({
        month: 5,
        prizeType: "FIRST",
        windowSize: 48
      })
    ).toEqual({
      month: 5,
      prizeType: "FIRST",
      windowSize: 48
    });
    expect(
      getDaysUntilNextDraw(
        {
          draws: [],
          generatedAt: "2026-04-29T00:00:00.000Z",
          monthlyInsights: [],
          nextDraw: {
            drawDate: "2026-05-01",
            drawDateIso: "2026-05-01T00:00:00.000Z",
            id: "next",
            isNextDraw: true,
            status: "upcoming"
          },
          source: "api"
        },
        new Date("2026-04-29T00:00:00.000Z")
      )
    ).toBe(2);

    expect(
      getDaysUntilNextDraw(
        {
          draws: [],
          generatedAt: "2026-04-29T00:00:00.000Z",
          monthlyInsights: [],
          nextDraw: {
            drawDate: "2026-04-28",
            drawDateIso: "2026-04-28T00:00:00.000Z",
            id: "next",
            isNextDraw: true,
            status: "past"
          },
          source: "api"
        },
        new Date("2026-04-29T00:00:00.000Z")
      )
    ).toBe(0);

    expect(parseWatchlistTags(" hot, , cold ,  ")).toEqual(["hot", "cold"]);
    expect(
      toCreateWatchlistPayload({
        ...defaultWatchlistFormState,
        note: "",
        number: "12",
        tags: "a, b"
      })
    ).toEqual({
      note: undefined,
      number: "12",
      source: "MANUAL",
      tags: ["a", "b"]
    });
    expect(
      toUpdateWatchlistPayload({
        note: "",
        source: "PREDICTION",
        tags: "x, y"
      })
    ).toEqual({
      note: undefined,
      source: "PREDICTION",
      tags: ["x", "y"]
    });
  });
});
