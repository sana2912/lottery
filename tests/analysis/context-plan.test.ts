import { describe, expect, test } from "bun:test";
import {
  getExpectedAnalysisContextCount,
  listAllTimeAnalysisContexts,
  listAnalysisContexts,
  listMonthAcrossYearsAnalysisContexts
} from "@/api/service/analysis-snapshot/context-plan";

describe("listAnalysisContexts", () => {
  test("enumerates all-time contexts (11 prizes)", () => {
    expect(listAllTimeAnalysisContexts()).toHaveLength(11);
  });

  test("month-across-years matrix is 11 prizes × 12 months", () => {
    expect(getExpectedAnalysisContextCount()).toBe(143);
    expect(listMonthAcrossYearsAnalysisContexts()).toHaveLength(132);
    expect(listAnalysisContexts()).toHaveLength(getExpectedAnalysisContextCount());
  });

  test("filters by prize, scope, and month", () => {
    const contexts = listAnalysisContexts({
      prizeType: "PRIZE3",
      scope: "MONTH",
      month: 5
    });

    expect(contexts).toHaveLength(1);
    expect(contexts[0]?.month).toBe(5);
    expect(contexts[0]?.year).toBeUndefined();
    expect(contexts[0]?.scope).toBe("MONTH");
  });
});
