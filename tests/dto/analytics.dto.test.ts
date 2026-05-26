import { describe, expect, test } from "bun:test";
import {
  toApiAnalyticsReadModel,
  toApiAnalyticsSummary,
  toApiDigitStat,
  toApiNumberStat,
  toApiPatternSummary
} from "@/api/model/dto/analytics.dto";
import { analyticsReadModelSchema } from "@/schema/app/analytics.schema";

describe("analytics.dto", () => {
  test("normalizes dates, copies arrays, and strips unknown fields", () => {
    const computedAt = new Date("2026-04-29T00:00:00.000Z");
    const lastSeenDrawDate = new Date("2026-04-16T00:00:00.000Z");
    const patternFlags = ["odd", "mirror"] as const;
    const digitStat = toApiDigitStat({
      computedAt,
      digit: "7",
      drawCount: 24,
      frequencyPercent: 33.33,
      hitCount: 8,
      internalOnly: "hidden",
      lastSeenDrawDate,
      lotteryType: "THAI_GOVERNMENT",
      missingDrawCount: 4,
      position: 2,
      prizeType: "TWO_DIGIT",
      trendDirection: "up"
    } as never);
    const numberStat = toApiNumberStat({
      averageGap: 2.5,
      computedAt,
      drawCount: 24,
      frequencyPercent: 12.5,
      hitCount: 3,
      internalOnly: "hidden",
      lastSeenDrawDate,
      lotteryType: "THAI_GOVERNMENT",
      maxGap: 6,
      missingDrawCount: 5,
      number: "09",
      numberLength: 2,
      patternFlags,
      prizeType: "TWO_DIGIT",
      trendScore: 66
    } as never);

    expect(toApiAnalyticsSummary({ drawCount: 24, generatedAt: computedAt })).toEqual({
      drawCount: 24,
      generatedAt: "2026-04-29T00:00:00.000Z"
    });

    expect(digitStat.computedAt).toBe("2026-04-29T00:00:00.000Z");
    expect(digitStat.lastSeenDrawDate).toBe("2026-04-16T00:00:00.000Z");
    expect(digitStat).not.toHaveProperty("internalOnly");

    expect(numberStat.computedAt).toBe("2026-04-29T00:00:00.000Z");
    expect(numberStat.lastSeenDrawDate).toBe("2026-04-16T00:00:00.000Z");
    expect(numberStat.patternFlags).toEqual(["odd", "mirror"]);
    expect(numberStat.patternFlags).not.toBe(patternFlags);
    expect(numberStat).not.toHaveProperty("internalOnly");

    const patternSummary = toApiPatternSummary({
      extra: "hidden",
      frequencyPercent: 50,
      hitCount: 12,
      id: "pattern-1",
      insight: "Mirror endings appeared often.",
      label: "Mirror",
      pattern: "mirror",
      sampleSize: 24
    } as never);

    expect(patternSummary).toEqual({
      frequencyPercent: 50,
      hitCount: 12,
      id: "pattern-1",
      insight: "Mirror endings appeared often.",
      label: "Mirror",
      pattern: "mirror",
      sampleSize: 24
    });
    expect(patternSummary).not.toHaveProperty("extra");

    const model = toApiAnalyticsReadModel({
      digitStats: [digitStat],
      generatedAt: computedAt,
      numberStats: [numberStat],
      patternSummaries: [patternSummary],
      source: "api",
      summary: {
        drawCount: 24,
        generatedAt: computedAt
      }
    });

    expect(analyticsReadModelSchema.parse(model)).toEqual(model);
  });
});
