import { describe, expect, test } from "bun:test";
import {
  ANALYSIS_PRIZE_TYPES,
  ANALYSIS_WINDOW_PRESET,
  createAnalysisContext,
  getAnalysisContextKey,
  getAnalysisPrizeNumberLength
} from "@/api/service/analysis-snapshot/analysis-context";
import {
  getAnalysisContextForCalendarQuery,
  getAnalysisContextForFilterQuery
} from "@/api/service/analysis-snapshot/snapshot-reader";

describe("analysis context", () => {
  test("keeps prize type parsing strict and maps number lengths explicitly", () => {
    expect(ANALYSIS_PRIZE_TYPES).not.toContain("OTHER");
    expect(getAnalysisPrizeNumberLength("TWO_DIGIT")).toBe(2);
    expect(getAnalysisPrizeNumberLength("THREE_FRONT")).toBe(3);
    expect(getAnalysisPrizeNumberLength("THREE_BACK")).toBe(3);
    expect(getAnalysisPrizeNumberLength("FIRST")).toBe(6);
    expect(getAnalysisPrizeNumberLength("PRIZE5")).toBe(6);
    expect(getAnalysisPrizeNumberLength("SIX_DIGIT_ALL")).toBe(6);
    expect(() => createAnalysisContext({ prizeType: "FIRST_PRIZE" })).toThrow(
      "Invalid analysis prizeType"
    );
    expect(() => createAnalysisContext({ prizeType: "TWO_DIGIT", windowPreset: "50" })).toThrow(
      'Invalid analysis windowPreset "50"'
    );
  });

  test("builds distinct keys for all-time and month-across-years", () => {
    const allTime = createAnalysisContext({
      prizeType: "TWO_DIGIT",
      scope: "ALL_TIME"
    });
    const mayAllYears = createAnalysisContext({
      month: 5,
      prizeType: "TWO_DIGIT",
      scope: "MONTH"
    });
    const may2026 = createAnalysisContext({
      month: 5,
      prizeType: "TWO_DIGIT",
      scope: "MONTH",
      year: 2026
    });

    expect(getAnalysisContextKey(allTime)).not.toEqual(getAnalysisContextKey(mayAllYears));
    expect(getAnalysisContextKey(mayAllYears)).toContain("MONTH|5|ALL_YEARS|ALL");
    expect(getAnalysisContextKey(may2026)).toContain("MONTH|5|2026|ALL");
  });

  test("requires month for monthly scope; year is optional", () => {
    expect(() =>
      createAnalysisContext({
        prizeType: "TWO_DIGIT",
        scope: "MONTH"
      })
    ).toThrow("MONTH scope requires month");
    expect(
      createAnalysisContext({
        month: 12,
        prizeType: "TWO_DIGIT",
        scope: "MONTH"
      }).year
    ).toBeUndefined();
    expect(
      createAnalysisContext({
        month: 12,
        prizeType: "TWO_DIGIT",
        scope: "ALL_TIME"
      }).month
    ).toBeUndefined();
  });

  test("maps eligible runtime queries to analysis snapshot contexts only when safe", () => {
    expect(
      getAnalysisContextForFilterQuery({
        lotteryType: "THAI_GOVERNMENT",
        month: 5,
        page: 1,
        pageSize: 20,
        prizeType: "TWO_DIGIT",
        scope: "MONTH",
        year: 2026
      })
    ).toMatchObject({
      month: 5,
      numberLength: 2,
      prizeType: "TWO_DIGIT",
      scope: "MONTH",
      windowPreset: ANALYSIS_WINDOW_PRESET,
      year: undefined
    });
    expect(
      getAnalysisContextForFilterQuery({
        lotteryType: "THAI_GOVERNMENT",
        page: 1,
        pageSize: 20,
        prizeType: "OTHER" as never,
        windowPreset: "ALL"
      })
    ).toBeNull();
    expect(
      getAnalysisContextForFilterQuery({
        lotteryType: "THAI_GOVERNMENT",
        numberLength: 6,
        page: 1,
        pageSize: 20,
        prizeType: "TWO_DIGIT",
        windowPreset: "ALL"
      })
    ).toBeNull();
    expect(
      getAnalysisContextForFilterQuery({
        lotteryType: "THAI_GOVERNMENT",
        page: 1,
        pageSize: 20,
        prizeType: "TWO_DIGIT",
        startDate: "2026-01-01"
      })
    ).toBeNull();
    expect(
      getAnalysisContextForFilterQuery({
        lotteryType: "THAI_GOVERNMENT",
        page: 1,
        pageSize: 20,
        prizeType: "TWO_DIGIT",
        windowPreset: "50"
      } as unknown as Parameters<typeof getAnalysisContextForFilterQuery>[0])
    ).toBeNull();
  });

  test("maps calendar heatmap queries to monthly snapshot contexts by selected prize type", () => {
    expect(
      getAnalysisContextForCalendarQuery(
        {
          month: 4,
          prizeType: "PRIZE5",
          year: 2026
        },
        new Date("2026-05-12T00:00:00.000Z")
      )
    ).toMatchObject({
      month: 4,
      numberLength: 6,
      prizeType: "PRIZE5",
      scope: "MONTH",
      windowPreset: ANALYSIS_WINDOW_PRESET,
      year: undefined
    });
    expect(
      getAnalysisContextForCalendarQuery(
        {
          prizeType: "TWO_DIGIT",
          windowPreset: "50"
        } as unknown as Parameters<typeof getAnalysisContextForCalendarQuery>[0],
        new Date("2026-05-12T00:00:00.000Z")
      )
    ).toBeNull();
  });
});
