import { describe, expect, test } from "bun:test";
import { createAnalysisContext } from "@/api/service/analysis-snapshot/analysis-context";
import {
  applyWindowCap,
  auditContext,
  buildComputeScopeAuditReport,
  type ScopeAuditDraw,
  selectEligibleDraws
} from "../../scripts/lib/compute-scope-audit";

const baseDraws: ScopeAuditDraw[] = [
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
  test("window cap 50 keeps newest draws in scope", () => {
    const context = createAnalysisContext({
      prizeType: "FIRST",
      scope: "ALL_TIME",
      windowPreset: "50"
    });
    const eligible = selectEligibleDraws(baseDraws, context);
    const capped = applyWindowCap(eligible, 50);

    expect(capped).toHaveLength(3);
    expect(capped.at(-1)?.drawNo).toBe("d3");
  });

  test("MONTH scope excludes other months", () => {
    const context = createAnalysisContext({
      month: 2,
      prizeType: "FIRST",
      scope: "MONTH",
      windowPreset: "ALL"
    });
    const eligible = selectEligibleDraws(baseDraws, context);

    expect(eligible).toHaveLength(1);
    expect(eligible[0]?.drawNo).toBe("d2");
  });

  test("flags snapshot draw count mismatch", () => {
    const context = createAnalysisContext({
      prizeType: "FIRST",
      scope: "ALL_TIME",
      windowPreset: "ALL"
    });
    const row = auditContext(context, baseDraws, {
      computedAt: new Date(),
      contextKey: "k",
      endDrawDate: null,
      engineVersion: "analysis-engine-v4",
      invalidPrizeCount: 0,
      month: null,
      prizeType: "FIRST",
      sampleDrawCount: 1,
      samplePrizeCount: 1,
      scope: "ALL_TIME",
      startDrawDate: null,
      windowPreset: "ALL",
      windowSize: null
    });

    expect(row.status).toBe("draw_count_mismatch");
    expect(row.liveSampleDrawCount).toBe(3);
  });

  test("under-filled window when eligible draws below cap", () => {
    const report = buildComputeScopeAuditReport({
      draws: baseDraws,
      snapshots: []
    });
    const row = report.contextRows.find(
      (item) =>
        item.prizeType === "FIRST" && item.scope === "ALL_TIME" && item.windowPreset === "500"
    );

    expect(row?.underfilledWindow).toBe(true);
    expect(row?.liveSampleDrawCount).toBe(3);
  });
});
