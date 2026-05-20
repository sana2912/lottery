import { describe, expect, test } from "bun:test";
import {
  ANALYSIS_WINDOW_SEMANTICS,
  getExpectedAnalysisContextCount,
  listAnalysisContexts
} from "@/api/service/analysis-snapshot/context-plan";

describe("listAnalysisContexts", () => {
  test("enumerates full compute matrix (572 contexts)", () => {
    expect(getExpectedAnalysisContextCount()).toBe(572);
    expect(listAnalysisContexts()).toHaveLength(572);
  });

  test("filters by prize and window", () => {
    const contexts = listAnalysisContexts({
      prizeType: "PRIZE3",
      scope: "MONTH",
      month: 5,
      windowPreset: "100"
    });

    expect(contexts).toHaveLength(1);
    expect(contexts[0]?.month).toBe(5);
    expect(contexts[0]?.windowPreset).toBe("100");
  });

  test("documents window preset draw caps", () => {
    expect(ANALYSIS_WINDOW_SEMANTICS["50"].drawCap).toBe(50);
    expect(ANALYSIS_WINDOW_SEMANTICS.ALL.drawCap).toBeNull();
  });
});
