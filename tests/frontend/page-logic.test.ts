import { describe, expect, test } from "bun:test";
import {
  buildAnalyticsViewModel,
  getTopDigits,
  getTopNumbers,
  toDigitHeatmapCells,
  toNumberFrequencyPoints
} from "@/frontend/pages/analytics/analytics.mappers";
import {
  defaultBacktestFormState,
  getBacktestCalculationLines,
  getBacktestExplanationSummary,
  getBacktestHumanReasonLines,
  hasBacktestRowExplanation,
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
  buildPatternReadModel,
  buildPatternReadModelFromSnapshot,
  parsePatternSearchParams,
  toPatternsAnalyticsQuery
} from "@/frontend/pages/patterns/patterns.mappers";
import {
  getPredictionNumberLength,
  getTopPredictionScore,
  toPredictionPayload
} from "@/frontend/pages/prediction-lab/prediction-lab.mappers";
import { resultsContent } from "@/frontend/pages/results/results.content";
import { toResultsModel, toResultsShellModel } from "@/frontend/pages/results/results.mappers";
import { toResultsApiQuery } from "@/frontend/pages/results/results.query";
import { hasNumberShapeFlag } from "@/lib/app/number-shape";
import type { AnalyticsReadModel } from "@/schema/app/analytics.schema";
import type { BacktestReadModel } from "@/schema/app/backtest.schema";
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
    const sampleNumberStat = analytics.numberStats[0];

    if (!sampleNumberStat) {
      throw new Error("Expected analytics fixture to include one number stat.");
    }

    expect(
      buildAnalyticsViewModel(
        {
          ...analytics,
          digitStats: analytics.digitStats.map((stat) => ({
            ...stat,
            prizeType: "SIX_DIGIT_ALL"
          })),
          numberStats: [
            {
              ...sampleNumberStat,
              number: "123456",
              numberLength: 6,
              prizeType: "SIX_DIGIT_ALL"
            }
          ]
        },
        {
          lotteryType: "THAI_GOVERNMENT",
          numberLength: 6,
          page: 1,
          pageSize: 20,
          prizeType: "SIX_DIGIT_ALL",
          scope: "ALL_TIME",
          windowPreset: "ALL"
        }
      ).context.numberLength
    ).toBe(6);
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
      params: { targetDrawCount: "30", windowSize: "90" },
      prizeType: "TWO_DIGIT",
      strategyId: "balanced",
      targetDrawCount: "30",
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

    const explanationBacktest: BacktestReadModel = {
      generatedAt: "2026-04-29T00:00:00.000Z",
      results: [
        {
          actualNumbers: ["11"],
          drawDate: "2026-04-16T00:00:00.000Z",
          drawId: "draw-1",
          explanation: {
            calculationWindow: 30,
            candidateCount: 2,
            generatedCandidates: [
              {
                isHit: true,
                number: "11",
                numberLength: 2,
                positionBreakdown: [],
                rank: 1,
                reasons: ["Digit stayed hot in both positions."],
                score: 88,
                scoreBreakdown: {
                  hot: 32,
                  overdue: 18,
                  pair: 14,
                  pattern: 12,
                  position: 12
                }
              }
            ],
            strategyId: "balanced",
            strategyName: "Balanced",
            version: "prediction-engine-v1"
          },
          generatedNumbers: ["11", "22"],
          hitNumbers: ["11"],
          id: "result-1",
          isHit: true,
          rankOfHit: 1,
          runId: "run-1"
        }
      ],
      run: {
        candidateCount: 5,
        computedAt: "2026-04-30T00:00:00.000Z",
        coverage: 1,
        endDrawDate: "2026-04-16T00:00:00.000Z",
        hitRate: 100,
        id: "run-1",
        longestMissStreak: 0,
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
    };

    expect(hasBacktestRowExplanation(explanationBacktest.results[0])).toBe(true);
    expect(
      getBacktestExplanationSummary(explanationBacktest, explanationBacktest.results[0])
    ).toMatchObject({
      calculationWindow: 30,
      hitNumber: "11",
      strongestSignal: "digit ที่ออกบ่อยในตำแหน่งนี้",
      strategyLabel: "Balanced"
    });
    expect(getBacktestCalculationLines(explanationBacktest.results[0])[0]).toContain("30");
    expect(getBacktestHumanReasonLines(explanationBacktest.results[0])[0]).toContain("11");
  });

  test("prediction lab helpers keep text-only payloads stable", () => {
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
    expect(
      toPredictionPayload(
        {
          count: "5",
          prizeType: "TWO_DIGIT",
          strategyId: "balanced",
          windowSize: "120"
        },
        ["all_unique", "ascending"]
      )
    ).toEqual({
      count: "5",
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      patternIds: ["all_unique", "ascending"],
      prizeType: "TWO_DIGIT",
      strategyId: "balanced",
      windowSize: "120"
    });
    expect(getPredictionNumberLength("TWO_DIGIT")).toBe(2);

    expect(getTopPredictionScore(null)).toBe("-");
    expect(
      getTopPredictionScore({
        generatedAt: "2026-04-29T00:00:00.000Z",
        input: {
          count: 5,
          lotteryType: "THAI_GOVERNMENT",
          numberLength: 2,
          patternIds: [],
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

  test("patterns helpers derive prize-specific shape views", () => {
    const analytics: AnalyticsReadModel = {
      digitStats: [],
      generatedAt: "2026-04-29T00:00:00.000Z",
      numberStats: [
        patternStat("588367", "FIRST", 6, 3),
        patternStat("884808", "FIRST", 6, 2),
        patternStat("551011", "FIRST", 6, 1),
        patternStat("121", "THREE_FRONT", 3, 4),
        patternStat("123", "THREE_FRONT", 3, 2),
        patternStat("135", "THREE_FRONT", 3, 1),
        patternStat("99", "TWO_DIGIT", 2, 5),
        patternStat("42", "TWO_DIGIT", 2, 3)
      ],
      patternSummaries: [],
      source: "api",
      summary: {
        drawCount: 10,
        generatedAt: "2026-04-29T00:00:00.000Z"
      }
    };
    const firstQuery = parsePatternSearchParams({
      pattern: "has_repeat",
      prizeType: "FIRST",
      scope: "ALL_TIME"
    });
    const defaultQuery = parsePatternSearchParams();
    const firstModel = buildPatternReadModel(analytics, firstQuery);

    expect(toPatternsAnalyticsQuery(firstQuery)).toMatchObject({
      numberLength: 6,
      prizeType: "FIRST",
      scope: "ALL_TIME",
      windowPreset: "ALL"
    });
    expect(firstModel.prizeLabel).toBe("FIRST");
    expect(firstModel.numberLengthLabel).toBe("6 digits");
    expect(firstModel.playground.map((pattern) => pattern.id)).toContain("double_pair");
    expect(firstModel.playground.map((pattern) => pattern.id)).not.toContain("ascending_run");
    expect(firstModel.playground.map((pattern) => pattern.id)).not.toContain("descending_run");
    expect(firstModel.playground.map((pattern) => pattern.id)).not.toContain("ascending");
    expect(firstModel.examples.every((example) => example.number.length === 6)).toBe(true);
    expect(firstModel.overviewCards.find((card) => card.id === "has_repeat")?.value).toBe(6);
    expect(
      parsePatternSearchParams({
        pattern: "ascending_run",
        prizeType: "FIRST",
        scope: "ALL_TIME"
      }).pattern
    ).toBeUndefined();
    expect(defaultQuery).toMatchObject({
      prizeType: "TWO_DIGIT",
      scope: "ALL_TIME"
    });

    const threeModel = buildPatternReadModel(analytics, {
      prizeType: "THREE_FRONT",
      scope: "ALL_TIME"
    });

    expect(threeModel.playground.map((pattern) => pattern.id)).toContain("palindrome");
    expect(threeModel.playground.map((pattern) => pattern.id)).toContain("ascending");
    expect(threeModel.playground.map((pattern) => pattern.id)).toContain("descending");
    expect(threeModel.playground.map((pattern) => pattern.id)).not.toContain("ascending_run");
    expect(threeModel.overviewCards.find((card) => card.id === "ascending")?.value).toBe(3);

    const threeUniqueModel = buildPatternReadModel(analytics, {
      prizeType: "THREE_FRONT",
      scope: "ALL_TIME",
      pattern: "all_unique"
    });

    expect(threeUniqueModel.examples.length).toBeGreaterThan(0);
    expect(threeUniqueModel.examples.every((example) => example.synthetic)).toBe(true);
    expect(
      threeUniqueModel.examples.every((example) => hasNumberShapeFlag(example.number, "all_unique"))
    ).toBe(true);

    const twoModel = buildPatternReadModel(analytics, {
      prizeType: "TWO_DIGIT",
      scope: "ALL_TIME"
    });

    expect(twoModel.playground.map((pattern) => pattern.id)).toEqual(
      expect.arrayContaining(["odd_last_digit", "double", "mirror", "ascending", "descending"])
    );
    expect(twoModel.sampleLabel).toContain("draws");

    const snapshotModel = buildPatternReadModelFromSnapshot(
      {
        context: {
          lotteryType: "THAI_GOVERNMENT",
          numberLength: 6,
          prizeType: "SIX_DIGIT_ALL",
          scope: "ALL_TIME",
          windowPreset: "ALL",
          windowSize: 10
        },
        generatedAt: "2026-04-29T00:00:00.000Z",
        pattern: {
          distribution: [
            { id: "repeat", label: "Repeat shape", value: "Repeat digits: 6 of 6 records" }
          ],
          examples: [
            {
              dna: "O/H E/H E/L O/L E/H O/H",
              flags: ["has_repeat", "mid_sum"],
              number: "588367",
              prizeType: "SIX_DIGIT_ALL"
            }
          ],
          overview: [
            {
              examples: ["588367"],
              hitCount: 6,
              id: "has_repeat",
              label: "has_repeat",
              pattern: "has_repeat",
              percent: 100,
              sampleSize: 6
            }
          ],
          sampleSize: 6
        },
        source: "snapshot",
        summary: {
          drawCount: 10,
          generatedAt: "2026-04-29T00:00:00.000Z"
        }
      },
      parsePatternSearchParams({
        pattern: "has_repeat",
        prizeType: "SIX_DIGIT_ALL",
        scope: "ALL_TIME"
      })
    );

    expect(snapshotModel.drawCount).toBe(10);
    expect(snapshotModel.overviewCards.find((card) => card.id === "has_repeat")?.value).toBe(6);
    expect(snapshotModel.examples[0]?.flags).toContain("Has repeat");
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

  test("calendar helpers normalize simple text data", () => {
    expect(
      parseCalendarPageFilters({
        month: "5",
        prizeType: "FIRST",
        scope: "MONTH",
        year: "2026"
      })
    ).toEqual({
      month: 5,
      prizeType: "FIRST",
      scope: "MONTH"
    });
    expect(
      toCalendarApiQuery({
        month: 5,
        prizeType: "FIRST",
        scope: "MONTH"
      })
    ).toEqual({
      month: 5,
      prizeType: "FIRST",
      scope: "MONTH",
      windowPreset: "ALL"
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
  });
});

function patternStat(
  number: string,
  prizeType: string,
  numberLength: number,
  hitCount: number
): AnalyticsReadModel["numberStats"][number] {
  return {
    averageGap: undefined,
    computedAt: "2026-04-29T00:00:00.000Z",
    drawCount: 10,
    frequencyPercent: hitCount * 10,
    hitCount,
    lastSeenDrawDate: undefined,
    lotteryType: "THAI_GOVERNMENT",
    maxGap: undefined,
    missingDrawCount: 0,
    number,
    numberLength,
    patternFlags: [],
    prizeType,
    trendScore: hitCount,
    windowSize: 120
  };
}
