import { describe, expect, test } from "bun:test";
import { resolveComputeYearPlan } from "../../scripts/lib/compute-analysis-plan";

describe("resolveComputeYearPlan", () => {
  test("full run (no scope) discovers years instead of skipping MONTH matrix", () => {
    expect(resolveComputeYearPlan({})).toEqual({ mode: "discover" });
  });

  test("ALL_TIME-only run does not require years", () => {
    expect(resolveComputeYearPlan({ scope: "ALL_TIME" })).toEqual({ mode: "none" });
  });

  test("MONTH run without year uses discovery", () => {
    expect(resolveComputeYearPlan({ scope: "MONTH" })).toEqual({ mode: "discover" });
  });

  test("respects explicit --years and --year", () => {
    expect(resolveComputeYearPlan({ years: [2024, 2025] })).toEqual({
      mode: "explicit",
      years: [2024, 2025]
    });
    expect(resolveComputeYearPlan({ year: 2026 })).toEqual({
      mode: "explicit",
      years: [2026]
    });
  });
});
