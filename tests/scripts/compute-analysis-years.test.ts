import { describe, expect, test } from "bun:test";
import {
  resolveComputeYearPlan,
  resolveComputeYears
} from "../../scripts/lib/compute-analysis-plan";

describe("resolveComputeYearPlan", () => {
  test("v8 matrix does not use year discovery", () => {
    expect(resolveComputeYearPlan({})).toEqual({ mode: "none" });
    expect(resolveComputeYearPlan({ scope: "ALL_TIME" })).toEqual({ mode: "none" });
    expect(resolveComputeYearPlan({ scope: "MONTH" })).toEqual({ mode: "none" });
    expect(resolveComputeYearPlan({ year: 2026, years: [2024, 2025] })).toEqual({ mode: "none" });
  });

  test("resolveComputeYears always returns undefined", async () => {
    expect(await resolveComputeYears({ scope: "MONTH" })).toBeUndefined();
  });
});
