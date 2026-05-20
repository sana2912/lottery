import { z } from "zod";
import { patternFlagSchema } from "@/schema/app/analytics.schema";
import {
  analysisScopeSchema,
  analysisWindowPresetSchema,
  lotteryTypeSchema,
  numberLengthSchema
} from "@/schema/app/query.schema";

export const analysisPatternOverviewSchema = z.object({
  examples: z.array(z.string()),
  hitCount: z.number(),
  id: z.string(),
  label: z.string(),
  pattern: patternFlagSchema.optional(),
  percent: z.number(),
  sampleSize: z.number()
});

export const analysisPatternExampleSchema = z.object({
  dna: z.string(),
  flags: z.array(patternFlagSchema),
  number: z.string(),
  prizeType: z.string()
});

export const analysisPatternDistributionItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string()
});

export const analysisPatternReadModelSchema = z.object({
  distribution: z.array(analysisPatternDistributionItemSchema),
  examples: z.array(analysisPatternExampleSchema),
  overview: z.array(analysisPatternOverviewSchema),
  sampleSize: z.number()
});

export const patternsReadModelSchema = z.object({
  context: z.object({
    lotteryType: lotteryTypeSchema,
    month: z.number().int().min(1).max(12).optional(),
    numberLength: numberLengthSchema,
    prizeType: z.string(),
    scope: analysisScopeSchema,
    year: z.number().int().min(1900).max(3000).optional(),
    windowPreset: analysisWindowPresetSchema,
    windowSize: z.number()
  }),
  generatedAt: z.string(),
  pattern: analysisPatternReadModelSchema,
  source: z.enum(["missing", "on-demand", "snapshot"]),
  summary: z.object({
    drawCount: z.number(),
    generatedAt: z.string()
  })
});

export type AnalysisPatternReadModel = z.infer<typeof analysisPatternReadModelSchema>;
export type PatternsApiReadModel = z.infer<typeof patternsReadModelSchema>;
