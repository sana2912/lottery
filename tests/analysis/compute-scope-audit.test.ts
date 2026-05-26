import { describe, expect, test } from "bun:test";
import {
  createAnalysisContext,
  getAnalysisContextKey
} from "@/api/service/analysis-snapshot/analysis-context";
import {
  type EligibleSampleDraw,
  selectEligibleDraws
} from "@/api/service/analysis-snapshot/eligible-sample";
import { auditContext, buildComputeScopeAuditReport } from "../../scripts/lib/compute-scope-audit";

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

describe("compute scope audit", () => {
  test("ALL_TIME scope uses every eligible draw (no cap)", () => {
    const context = createAnalysisContext({
      prizeType: "FIRST",
      scope: "ALL_TIME"
    });
    const eligible = selectEligibleDraws(baseDraws, context);

    expect(eligible).toHaveLength(3);
    expect(eligible.at(-1)?.drawNo).toBe("d3");
  });

  test("MONTH scope across years includes same month in every year", () => {
    const context = createAnalysisContext({
      month: 2,
      prizeType: "FIRST",
      scope: "MONTH"
    });
    const eligible = selectEligibleDraws(baseDraws, context);

    expect(eligible).toHaveLength(1);
    expect(eligible[0]?.drawNo).toBe("d2");
  });

  test("MONTH with explicit year excludes other years", () => {
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

  test("flags snapshot draw count mismatch", () => {
    const context = createAnalysisContext({
      prizeType: "FIRST",
      scope: "ALL_TIME"
    });
    const row = auditContext(context, baseDraws, {
      computedAt: new Date(),
      contextKey: "k",
      endDrawDate: null,
      engineVersion: "analysis-engine-v8",
      invalidPrizeCount: 0,
      month: null,
      prizeType: "FIRST",
      sampleDrawCount: 1,
      samplePrizeCount: 1,
      scope: "ALL_TIME",
      startDrawDate: null
    });

    expect(row.status).toBe("draw_count_mismatch");
    expect(row.liveSampleDrawCount).toBe(3);
  });

  test("reports zero eligible contexts in sparse month cells", () => {
    const report = buildComputeScopeAuditReport({
      draws: baseDraws,
      snapshots: []
    });
    const row = report.contextRows.find(
      (item) =>
        item.prizeType === "FIRST" &&
        item.scope === "MONTH" &&
        item.month === 12 &&
        item.status === "zero_eligible"
    );

    expect(row).toBeDefined();
  });

  test("flags db_resolver_mismatch when spot-check counts differ from replay", () => {
    const context = createAnalysisContext({
      prizeType: "FIRST",
      scope: "ALL_TIME"
    });
    const row = auditContext(
      context,
      baseDraws,
      undefined,
      new Map([[getAnalysisContextKey(context), { drawCount: 1, prizeCount: 1 }]])
    );

    expect(row.status).toBe("db_resolver_mismatch");
  });
});
