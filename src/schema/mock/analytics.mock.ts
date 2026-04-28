import { toApiAnalyticsReadModel } from "@/api/model/dto/analytics.dto";
import { analyticsReadModelSchema } from "@/schema/app/analytics.schema";

const analyticsFixtureInput = {
  generatedAt: new Date("2026-04-27T00:00:00.000Z"),
  source: "mock",
  summary: {
    drawCount: 24,
    generatedAt: new Date("2026-04-27T00:00:00.000Z")
  },
  digitStats: [
    {
      lotteryType: "THAI_GOVERNMENT",
      prizeType: "TWO_DIGIT",
      digit: "7",
      position: 2,
      windowSize: 120,
      drawCount: 24,
      hitCount: 8,
      frequencyPercent: 33.33,
      lastSeenDrawDate: new Date("2026-04-16T00:00:00.000Z"),
      missingDrawCount: 0,
      trendDirection: "up",
      computedAt: new Date("2026-04-27T00:00:00.000Z")
    },
    {
      lotteryType: "THAI_GOVERNMENT",
      prizeType: "TWO_DIGIT",
      digit: "3",
      position: 1,
      windowSize: 120,
      drawCount: 24,
      hitCount: 2,
      frequencyPercent: 8.33,
      missingDrawCount: 9,
      trendDirection: "down",
      computedAt: new Date("2026-04-27T00:00:00.000Z")
    }
  ],
  numberStats: [
    {
      number: "47",
      numberLength: 2,
      lotteryType: "THAI_GOVERNMENT",
      prizeType: "TWO_DIGIT",
      windowSize: 120,
      drawCount: 24,
      hitCount: 5,
      frequencyPercent: 20.83,
      lastSeenDrawDate: new Date("2026-04-16T00:00:00.000Z"),
      missingDrawCount: 0,
      averageGap: 4.8,
      maxGap: 11,
      trendScore: 82,
      patternFlags: ["odd", "high"],
      computedAt: new Date("2026-04-27T00:00:00.000Z")
    },
    {
      number: "03",
      numberLength: 2,
      lotteryType: "THAI_GOVERNMENT",
      prizeType: "TWO_DIGIT",
      windowSize: 120,
      drawCount: 24,
      hitCount: 1,
      frequencyPercent: 4.17,
      missingDrawCount: 14,
      averageGap: 14,
      maxGap: 14,
      trendScore: 34,
      patternFlags: ["odd", "low"],
      computedAt: new Date("2026-04-27T00:00:00.000Z")
    }
  ],
  patternSummaries: [
    {
      id: "pattern-even-odd",
      label: "คู่/คี่",
      pattern: "odd",
      hitCount: 14,
      frequencyPercent: 58.33,
      sampleSize: 24,
      insight: "เลขท้ายคี่พบมากกว่าเลขท้ายคู่เล็กน้อยใน sample mock"
    }
  ]
} as const;

export const analyticsMockReadModel = analyticsReadModelSchema.parse(
  toApiAnalyticsReadModel(analyticsFixtureInput)
);
