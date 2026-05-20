import { describe, expect, test } from "bun:test";
import {
  getExpectedAnalysisContextCount,
  listAllTimeAnalysisContexts,
  listAnalysisContexts,
  listMonthYearAnalysisContexts
} from "@/api/service/analysis-snapshot/context-plan";

describe("listAnalysisContexts", () => {
  test("enumerates all-time contexts (11 prizes)", () => {
    expect(listAllTimeAnalysisContexts()).toHaveLength(11);
  });

  test("month+year matrix scales with years in DB", () => {
    const years = [2024, 2025, 2026];

    expect(getExpectedAnalysisContextCount(years)).toBe(11 + 11 * 12 * 3);
    expect(listMonthYearAnalysisContexts(years)).toHaveLength(11 * 12 * 3);
    expect(listAnalysisContexts({ years })).toHaveLength(getExpectedAnalysisContextCount(years));
  });

  test("filters by prize, scope, month, and year", () => {
    const contexts = listAnalysisContexts({
      prizeType: "PRIZE3",
      scope: "MONTH",
      month: 5,
      years: [2026]
    });

    expect(contexts).toHaveLength(1);
    expect(contexts[0]?.month).toBe(5);
    expect(contexts[0]?.year).toBe(2026);
    expect(contexts[0]?.windowPreset).toBe("ALL");
  });
});
