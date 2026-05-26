import { describe, expect, test } from "bun:test";
import { getExpectedAnalysisContextCount } from "@/api/service/analysis-snapshot/context-plan";
import { buildExpectedSnapshotContextKeys } from "../../scripts/audit-analysis-normalization";

describe("analysis normalization audit script", () => {
  test("expects only v8 ALL snapshot contexts", () => {
    const contextKeys = buildExpectedSnapshotContextKeys();

    expect(contextKeys).toHaveLength(getExpectedAnalysisContextCount());
    expect(new Set(contextKeys).size).toBe(contextKeys.length);
    expect(contextKeys.every((key) => !key.endsWith("|ALL"))).toBe(true);
    expect(contextKeys.some((key) => key.endsWith("|50"))).toBe(false);
    expect(contextKeys.some((key) => key.includes("MONTH|1|ALL_YEARS"))).toBe(true);
    expect(contextKeys.some((key) => key.includes("MONTH|1|2026"))).toBe(false);
  });
});
