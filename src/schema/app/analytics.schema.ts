import { z } from "zod";

export const analyticsSummarySchema = z.object({
  drawCount: z.number(),
  generatedAt: z.string(),
  prizeCount: z.number().optional()
});

export const trendDirectionSchema = z.enum(["up", "down", "flat"]);

export const patternFlagSchema = z.enum([
  "odd",
  "even",
  "high",
  "low",
  "double",
  "has_repeat",
  "all_unique",
  "double_pair",
  "triple",
  "quad_or_more",
  "ascending",
  "descending",
  "ascending_run",
  "descending_run",
  "mirror",
  "palindrome",
  "balanced_odd_even",
  "balanced_high_low",
  "low_sum",
  "mid_sum",
  "high_sum"
]);

export const digitStatSchema = z.object({
  lotteryType: z.string(),
  prizeType: z.string(),
  digit: z.string(),
  position: z.number().optional(),
  windowSize: z.number(),
  drawCount: z.number(),
  hitCount: z.number(),
  frequencyPercent: z.number(),
  expectedFrequencyPercent: z.number().optional(),
  lastSeenDrawDate: z.string().optional(),
  lift: z.number().optional(),
  missingDrawCount: z.number(),
  sampleEventCount: z.number().optional(),
  trendDirection: trendDirectionSchema,
  computedAt: z.string()
});

export const numberStatSchema = z.object({
  number: z.string(),
  numberLength: z.number(),
  lotteryType: z.string(),
  prizeType: z.string(),
  windowSize: z.number(),
  drawCount: z.number(),
  hitCount: z.number(),
  frequencyPercent: z.number(),
  frequencyPerDrawPercent: z.number().optional(),
  frequencyPerPrizeRowPercent: z.number().optional(),
  lastSeenDrawDate: z.string().optional(),
  missingDrawCount: z.number(),
  averageGap: z.number().optional(),
  maxGap: z.number().optional(),
  trendScore: z.number(),
  patternFlags: z.array(patternFlagSchema),
  samplePrizeCount: z.number().optional(),
  computedAt: z.string()
});

export const patternSummarySchema = z.object({
  id: z.string(),
  label: z.string(),
  pattern: patternFlagSchema,
  hitCount: z.number(),
  frequencyPercent: z.number(),
  sampleSize: z.number(),
  insight: z.string()
});

export const analyticsReadModelSchema = z.object({
  generatedAt: z.string(),
  source: z.enum(["mock", "api"]),
  summary: analyticsSummarySchema,
  digitStats: z.array(digitStatSchema),
  numberStats: z.array(numberStatSchema),
  patternSummaries: z.array(patternSummarySchema)
});

export type AnalyticsSummary = z.infer<typeof analyticsSummarySchema>;
export type DigitStat = z.infer<typeof digitStatSchema>;
export type NumberStat = z.infer<typeof numberStatSchema>;
export type PatternSummary = z.infer<typeof patternSummarySchema>;
export type AnalyticsReadModel = z.infer<typeof analyticsReadModelSchema>;
