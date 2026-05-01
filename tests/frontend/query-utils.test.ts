import { describe, expect, test } from "bun:test";
import {
  buildAnalyticsHref,
  parseAnalyticsSearchParams
} from "@/frontend/pages/analytics/analytics.query";
import {
  defaultCompareFormState,
  parseCompareNumbers,
  toComparePayload
} from "@/frontend/pages/compare/compare.mappers";
import { buildCompareHref, parseCompareSearchParams } from "@/frontend/pages/compare/compare.query";
import {
  buildResultsHref,
  getResultsFilterPills,
  parseResultsSearchParams
} from "@/frontend/pages/results/results.query";
import {
  defaultWatchlistFormState,
  parseWatchlistTags,
  toCreateWatchlistPayload
} from "@/frontend/pages/watchlist/watchlist.mappers";

describe("frontend query/mappers", () => {
  test("parseCompareNumbers splits by comma/newline and trims", () => {
    expect(parseCompareNumbers("47, 91\n24,,\n 03 ")).toEqual(["47", "91", "24", "03"]);
  });

  test("toComparePayload converts optional fields and parses numbers", () => {
    const payload = toComparePayload({
      ...defaultCompareFormState,
      endDate: "",
      numbers: "01, 02\n03"
    });

    expect(payload.endDate).toBeUndefined();
    expect(payload.numbers).toEqual(["01", "02", "03"]);
  });

  test("parseCompareSearchParams falls back on invalid input", () => {
    expect(parseCompareSearchParams({}, defaultCompareFormState)).toEqual(defaultCompareFormState);
  });

  test("parseCompareSearchParams parses valid input and normalizes numbers string", () => {
    const parsed = parseCompareSearchParams(
      {
        lotteryType: "THAI_GOVERNMENT",
        numberLength: "2",
        numbers: "01\n02",
        prizeType: "TWO_DIGIT",
        startDate: "2025-01-01",
        endDate: "2026-04-16",
        strategyId: "balanced",
        windowSize: "120"
      },
      defaultCompareFormState
    );

    expect(parsed.numbers).toBe("01, 02");
    expect(parsed.windowSize).toBe("120");
  });

  test("buildCompareHref emits only non-empty params", () => {
    expect(
      buildCompareHref({
        ...defaultCompareFormState,
        endDate: ""
      })
    ).not.toContain("endDate=");
  });

  test("parseAnalyticsSearchParams accepts URLSearchParams", () => {
    const parsed = parseAnalyticsSearchParams(
      new URLSearchParams({
        lotteryType: "THAI_GOVERNMENT",
        prizeType: "TWO_DIGIT",
        numberLength: "2",
        page: "1",
        pageSize: "20",
        windowSize: "120"
      })
    );

    expect(parsed.lotteryType).toBe("THAI_GOVERNMENT");
    expect(parsed.page).toBe(1);
  });

  test("buildAnalyticsHref keeps clean URLs when no query overrides are set", () => {
    const parsed = parseAnalyticsSearchParams(undefined);
    expect(buildAnalyticsHref(parsed)).toContain("/analytics?");
  });

  test("parseResultsSearchParams accepts URLSearchParams", () => {
    const parsed = parseResultsSearchParams(
      new URLSearchParams({
        lotteryType: "THAI_GOVERNMENT",
        prizeType: "TWO_DIGIT",
        page: "1",
        pageSize: "20"
      })
    );

    expect(parsed.prizeType).toBe("TWO_DIGIT");
  });

  test("buildResultsHref emits only non-empty params", () => {
    const parsed = parseResultsSearchParams(undefined);
    expect(buildResultsHref(parsed)).toContain("/results?");
  });

  test("getResultsFilterPills returns a compact list", () => {
    const query = parseResultsSearchParams({
      q: "foo",
      year: "2026",
      month: "4",
      prizeType: "TWO_DIGIT"
    });

    expect(getResultsFilterPills(query)).toEqual([
      "Query: foo",
      "Prize: TWO_DIGIT",
      "Year: 2026",
      "Month: 4"
    ]);
  });

  test("parseWatchlistTags trims and drops empty values", () => {
    expect(parseWatchlistTags("hot, ,  cold")).toEqual(["hot", "cold"]);
  });

  test("toCreateWatchlistPayload keeps note optional", () => {
    expect(
      toCreateWatchlistPayload({
        ...defaultWatchlistFormState,
        number: "12",
        note: "",
        tags: "a, b"
      })
    ).toEqual({
      note: undefined,
      number: "12",
      source: "MANUAL",
      tags: ["a", "b"]
    });
  });
});
