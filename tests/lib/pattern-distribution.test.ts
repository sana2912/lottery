import { describe, expect, test } from "bun:test";
import {
  buildPatternDistributionCountsFromApiStats,
  buildPatternDistributionItems
} from "@/lib/app/pattern-distribution";
import type { ApiNumberStat } from "@/schema/api/analytics";

describe("pattern-distribution", () => {
  test("builds distribution cards from api stats", () => {
    const stats: ApiNumberStat[] = [
      {
        averageGap: 0,
        computedAt: "2024-01-01T00:00:00.000Z",
        drawCount: 2,
        frequencyPercent: 100,
        hitCount: 2,
        lastSeenDrawDate: "2024-01-01",
        lotteryType: "THAI_GOVERNMENT",
        maxGap: 0,
        missingDrawCount: 0,
        number: "112233",
        numberLength: 6,
        patternFlags: ["has_repeat", "balanced_odd_even"],
        prizeType: "FIRST",
        trendScore: 0
      }
    ];
    const items = buildPatternDistributionItems(
      buildPatternDistributionCountsFromApiStats(stats, 2)
    );

    expect(items).toHaveLength(6);
    expect(items[0]?.id).toBe("repeat");
    expect(items[0]?.value).toContain("2 of 2");
  });
});
