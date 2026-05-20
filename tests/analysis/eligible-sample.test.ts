import { describe, expect, test } from "bun:test";
import { createAnalysisContext } from "@/api/service/analysis-snapshot/analysis-context";
import {
  type EligibleSampleDraw,
  replayEligibleSampleFromDraws,
  selectEligibleDraws
} from "@/api/service/analysis-snapshot/eligible-sample";

const baseDraws: EligibleSampleDraw[] = [
  {
    drawDate: new Date("2024-01-16T00:00:00Z"),
    drawNo: "d1",
    prizes: [{ number: "123456", position: null, type: "FIRST" }]
  },
  {
    drawDate: new Date("2024-02-16T00:00:00Z"),
    drawNo: "d2",
    prizes: [{ number: "654321", position: null, type: "FIRST" }]
  },
  {
    drawDate: new Date("2024-03-16T00:00:00Z"),
    drawNo: "d3",
    prizes: [{ number: "111111", position: null, type: "FIRST" }]
  }
];

describe("eligible sample replay", () => {
  test("ALL_TIME scope uses every eligible draw (no cap)", () => {
    const context = createAnalysisContext({
      prizeType: "FIRST",
      scope: "ALL_TIME"
    });

    expect(selectEligibleDraws(baseDraws, context)).toHaveLength(3);
    expect(replayEligibleSampleFromDraws(baseDraws, context).drawCount).toBe(3);
  });

  test("MONTH+year scope excludes other months and years", () => {
    const context = createAnalysisContext({
      month: 2,
      prizeType: "FIRST",
      scope: "MONTH",
      year: 2024
    });
    const eligible = selectEligibleDraws(baseDraws, context);

    expect(eligible).toHaveLength(1);
    expect(eligible[0]?.drawNo).toBe("d2");
  });
});
