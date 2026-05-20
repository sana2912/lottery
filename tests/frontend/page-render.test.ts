import { describe, expect, mock, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildPatternReadModel,
  parsePatternSearchParams
} from "@/frontend/pages/patterns/patterns.mappers";

mock.module("next/navigation", () => ({
  usePathname: () => "/patterns",
  useRouter: () => ({
    push: mock(),
    replace: mock()
  }),
  useSearchParams: () => new URLSearchParams()
}));

mock.module("@/frontend/pages/analytics/analytics.data", () => ({
  getAnalyticsPageData: async () => ({
    model: analyticsModel(2, "TWO_DIGIT"),
    state: "ready"
  })
}));

const RENDER_TEST_TIMEOUT_MS = 15_000;

describe("page rendering", () => {
  test(
    "renders analytics view for 2 digit prize contexts",
    async () => {
      const { AnalyticsPage } = await import("@/frontend/pages/analytics");

      const twoDigitMarkup = renderToStaticMarkup(
        await AnalyticsPage({
          pageData: { model: analyticsModel(2, "TWO_DIGIT"), state: "ready" },
          searchParams: { numberLength: "2", prizeType: "TWO_DIGIT", windowSize: "30" }
        })
      );

      expect(twoDigitMarkup).toContain("Hot");
      expect(twoDigitMarkup).toContain("09");
    },
    RENDER_TEST_TIMEOUT_MS
  );

  test(
    "renders analytics view for 3 digit prize contexts",
    async () => {
      const { AnalyticsPage } = await import("@/frontend/pages/analytics");

      const threeDigitMarkup = renderToStaticMarkup(
        await AnalyticsPage({
          pageData: { model: analyticsModel(3, "THREE_FRONT"), state: "ready" },
          searchParams: { numberLength: "3", prizeType: "THREE_FRONT", windowSize: "60" }
        })
      );

      expect(threeDigitMarkup).toContain("Shape");
      expect(threeDigitMarkup).toContain("123");
    },
    RENDER_TEST_TIMEOUT_MS
  );

  test(
    "renders analytics view for 6 digit prize contexts",
    async () => {
      const { AnalyticsPage } = await import("@/frontend/pages/analytics");

      const sixDigitMarkup = renderToStaticMarkup(
        await AnalyticsPage({
          pageData: { model: analyticsModel(6, "FIRST"), state: "ready" },
          searchParams: { numberLength: "6", prizeType: "FIRST", windowSize: "120" }
        })
      );

      expect(sixDigitMarkup).toContain("Explore deeper shape patterns");
      expect(sixDigitMarkup).toContain("123456");
    },
    RENDER_TEST_TIMEOUT_MS
  );

  test(
    "renders calendar schedule and monthly heatmap sections",
    async () => {
      const { CalendarPage } = await import("@/frontend/pages/calendar");

      const markup = renderToStaticMarkup(
        await CalendarPage({
          pageData: {
            filters: {
              month: 4,
              year: 2026,
              prizeType: "FIRST",
              scope: "MONTH"
            },
            model: calendarModel(),
            state: "ready"
          },
          searchParams: { month: "4", year: "2026", prizeType: "FIRST", scope: "MONTH" }
        })
      );

      expect(markup).toContain("16 April 2026");
      expect(markup).toContain("April");
      expect(markup).toContain("Hits 8 / 8");
      expect(markup).toContain("draws in scope");
    },
    RENDER_TEST_TIMEOUT_MS
  );

  test(
    "renders patterns page from analytics data and active filters",
    async () => {
      const { PatternsPage } = await import("@/frontend/pages/patterns");
      const query = parsePatternSearchParams({ prizeType: "TWO_DIGIT", scope: "ALL_TIME" });

      const markup = renderToStaticMarkup(
        await PatternsPage({
          pageData: {
            model: buildPatternReadModel(analyticsModel(2, "TWO_DIGIT"), query),
            query,
            state: "ready"
          },
          searchParams: { prizeType: "TWO_DIGIT", scope: "ALL_TIME" }
        })
      );

      expect(markup).toContain("Prize type");
      expect(markup).toContain("Sample");
      expect(markup).toContain("09");
      expect(markup).toContain("mini DNA");
    },
    RENDER_TEST_TIMEOUT_MS
  );

  test(
    "renders initial client page shells for prediction lab and backtest",
    async () => {
      const { BacktestPage } = await import("@/frontend/pages/backtest");
      const { PredictionLabPage } = await import("@/frontend/pages/prediction-lab");

      const backtestMarkup = renderToStaticMarkup(createElement(BacktestPage));
      const predictionMarkup = renderToStaticMarkup(createElement(PredictionLabPage));

      expect(backtestMarkup).toContain("Calculation window");
      expect(backtestMarkup).toContain("Generated target draws");
      expect(predictionMarkup).toContain("Prize type");
      expect(predictionMarkup).toContain("Derived length");
    },
    RENDER_TEST_TIMEOUT_MS
  );

  test(
    "renders route loading and progress shells",
    async () => {
      const { RouteProgress } = await import("@/frontend/components/navigation/RouteProgress");
      const { default: UserLoading } = await import("@/app/(user)/loading");

      const progressMarkup = renderToStaticMarkup(createElement(RouteProgress));
      const loadingMarkup = renderToStaticMarkup(createElement(UserLoading));

      expect(progressMarkup).toBe("");
      expect(loadingMarkup).toContain("Loading");
      expect(loadingMarkup).toContain("aria-busy");
    },
    RENDER_TEST_TIMEOUT_MS
  );
});

function analyticsModel(numberLength: 2 | 3 | 6, prizeType: string) {
  const numbers = {
    2: ["09", "11", "22"],
    3: ["123", "121", "777"],
    6: ["123456", "112233", "777123"]
  }[numberLength];

  return {
    digitStats: Array.from({ length: numberLength }, (_, positionIndex) =>
      digitStatsForPosition(positionIndex + 1, prizeType)
    ).flat(),
    generatedAt: "2026-04-29T00:00:00.000Z",
    numberStats: numbers.map((number, index) =>
      numberStat(number, numberLength, prizeType, index + 1)
    ),
    patternSummaries: [
      {
        frequencyPercent: 66.67,
        hitCount: 2,
        id: "pattern-has-repeat",
        insight: "พบเลขที่มีเลขซ้ำ 2 จาก 3 เลข",
        label: "has_repeat",
        pattern: "has_repeat" as const,
        sampleSize: 3
      }
    ],
    source: "api" as const,
    summary: {
      drawCount: 30,
      generatedAt: "2026-04-29T00:00:00.000Z"
    }
  };
}

function digitStatsForPosition(position: number, prizeType: string) {
  return ["0", "1", "2"].map((digit, index) => ({
    computedAt: "2026-04-29T00:00:00.000Z",
    digit,
    drawCount: 30,
    frequencyPercent: 30 - index * 5,
    hitCount: 9 - index,
    lastSeenDrawDate: "2026-04-16T00:00:00.000Z",
    lotteryType: "THAI_GOVERNMENT",
    missingDrawCount: index,
    position,
    prizeType,
    trendDirection: index === 0 ? ("up" as const) : ("flat" as const),
    windowSize: 30
  }));
}

function numberStat(number: string, numberLength: 2 | 3 | 6, prizeType: string, rank: number) {
  return {
    computedAt: "2026-04-29T00:00:00.000Z",
    drawCount: 30,
    frequencyPercent: 12 - rank,
    hitCount: 4 - rank,
    lastSeenDrawDate: "2026-04-16T00:00:00.000Z",
    lotteryType: "THAI_GOVERNMENT",
    maxGap: 12,
    missingDrawCount: rank,
    number,
    numberLength,
    patternFlags: ["has_repeat" as const, "mid_sum" as const],
    prizeType,
    trendScore: 50 - rank,
    windowSize: 30
  };
}

function calendarModel() {
  return {
    draws: [
      {
        drawDate: "16 April 2026",
        drawDateIso: "2026-04-16T00:00:00.000Z",
        drawNo: "08/2026",
        id: "draw-1",
        isNextDraw: false,
        status: "past" as const
      }
    ],
    generatedAt: "2026-04-29T00:00:00.000Z",
    monthlyInsights: [
      {
        coldNumbers: ["02"],
        heatmapRows: [
          {
            cells: [
              {
                appearanceCount: 8,
                digit: "0",
                eventCount: 8,
                eventRatePercent: 100,
                expectedRatePercent: 10,
                lift: 10,
                missingRounds: 0,
                sampleEventCount: 8,
                score: 90,
                tone: "hot" as const
              },
              {
                appearanceCount: 1,
                digit: "9",
                eventCount: 1,
                eventRatePercent: 12.5,
                expectedRatePercent: 10,
                lift: 1.25,
                missingRounds: 7,
                sampleEventCount: 8,
                score: 20,
                tone: "cold" as const
              }
            ],
            coldDigits: ["9"],
            hotDigits: ["0"],
            position: 1
          }
        ],
        hotNumbers: ["09"],
        id: "monthly-insight-4",
        label: "April",
        month: 4,
        year: 2026,
        patternNotes: ["odd-ending numbers appeared slightly more often."],
        positionInsights: [
          {
            coldNumbers: [{ appearanceCount: 1, digit: "9", missingRounds: 7 }],
            hotNumbers: [{ appearanceCount: 8, digit: "0", missingRounds: 0 }],
            position: 1
          }
        ],
        prizeType: "FIRST" as const,
        sampleSize: 8,
        scope: "MONTH" as const,
        summary: "April has 8 historical draws in sample.",
        windowPreset: "ALL" as const,
        windowSize: 8
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
