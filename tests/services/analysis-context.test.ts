import { describe, expect, test } from "bun:test";
import {
  ANALYSIS_PRIZE_TYPES,
  createAnalysisContext,
  getAnalysisContextKey,
  getAnalysisPrizeNumberLength,
  getAnalysisWindowLimit
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
    expect(() => createAnalysisContext({ prizeType: "FIRST_PRIZE", windowPreset: "50" })).toThrow(
      "Invalid analysis prizeType"
    );
  });

  test("builds distinct keys for all-time and monthly presets", () => {
    const allTime = createAnalysisContext({
      prizeType: "TWO_DIGIT",
      scope: "ALL_TIME",
      windowPreset: "ALL"
    });
    const may = createAnalysisContext({
      month: 5,
      prizeType: "TWO_DIGIT",
      scope: "MONTH",
      windowPreset: "ALL"
    });

    expect(getAnalysisWindowLimit("ALL")).toBeUndefined();
    expect(getAnalysisWindowLimit("500")).toBe(500);
    expect(getAnalysisContextKey(allTime)).not.toEqual(getAnalysisContextKey(may));
    expect(getAnalysisContextKey(may)).toContain("MONTH|5|ALL");
  });

  test("requires month only for monthly scope", () => {
    expect(() =>
      createAnalysisContext({
        prizeType: "TWO_DIGIT",
        scope: "MONTH",
        windowPreset: "50"
      })
    ).toThrow("MONTH scope requires month");
    expect(
      createAnalysisContext({
        month: 12,
        prizeType: "TWO_DIGIT",
        scope: "ALL_TIME",
        windowPreset: "50"
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
        windowSize: 100
      })
    ).toMatchObject({
      month: 5,
      numberLength: 2,
      prizeType: "TWO_DIGIT",
      scope: "MONTH",
      windowPreset: "100"
    });
    expect(
      getAnalysisContextForFilterQuery({
        lotteryType: "THAI_GOVERNMENT",
        page: 1,
        pageSize: 20,
        prizeType: "OTHER",
        windowSize: 100
      })
    ).toBeNull();
    expect(
      getAnalysisContextForFilterQuery({
        lotteryType: "THAI_GOVERNMENT",
        numberLength: 6,
        page: 1,
        pageSize: 20,
        prizeType: "TWO_DIGIT",
        windowSize: 100
      })
    ).toBeNull();
    expect(
      getAnalysisContextForFilterQuery({
        lotteryType: "THAI_GOVERNMENT",
        page: 1,
        pageSize: 20,
        prizeType: "TWO_DIGIT",
        windowSize: 120
      })
    ).toBeNull();
  });

  test("maps calendar heatmap queries to monthly snapshot contexts by selected prize type", () => {
    expect(
      getAnalysisContextForCalendarQuery(
        {
          month: 4,
          prizeType: "FIRST",
          windowSize: 50
        },
        new Date("2026-05-12T00:00:00.000Z")
      )
    ).toMatchObject({
      month: 4,
      numberLength: 6,
      prizeType: "FIRST",
      scope: "MONTH",
      windowPreset: "50"
    });
    expect(
      getAnalysisContextForCalendarQuery(
        {
          prizeType: "TWO_DIGIT",
          windowSize: 24
        },
        new Date("2026-05-12T00:00:00.000Z")
      )
    ).toBeNull();
  });
});
