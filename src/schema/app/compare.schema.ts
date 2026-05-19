import { z } from "zod";
import { predictionStrategyIdSchema } from "@/schema/app/prediction.schema";
import { lotteryFilterContextSchema, lotteryPrizeTypeSchema } from "@/schema/app/query.schema";

const comparePrizeTypeSchema = lotteryPrizeTypeSchema.exclude(["OTHER"]);

export const scoreBreakdownSchema = z.object({
  hot: z.number(),
  overdue: z.number(),
  position: z.number(),
  pair: z.number(),
  pattern: z.number()
});

export const compareRequestSchema = lotteryFilterContextSchema.extend({
  numbers: z.array(z.string().trim().min(1)).min(1).max(20),
  numberLength: z.coerce
    .number()
    .pipe(z.union([z.literal(2), z.literal(3), z.literal(6)]))
    .default(2),
  prizeType: comparePrizeTypeSchema.optional(),
  strategyId: predictionStrategyIdSchema.optional().default("balanced")
});

export const compareCandidateSchema = z.object({
  number: z.string(),
  numberLength: z.number(),
  score: z.number(),
  rank: z.number(),
  scoreBreakdown: scoreBreakdownSchema,
  reasons: z.array(z.string())
});

export const compareReadModelSchema = z.object({
  generatedAt: z.string(),
  source: z.enum(["mock", "api"]),
  strategyId: predictionStrategyIdSchema.optional(),
  candidates: z.array(compareCandidateSchema),
  strongestSignal: z.string().optional(),
  sampleSize: z.number()
});

export type ScoreBreakdown = z.infer<typeof scoreBreakdownSchema>;
export type CompareRequest = z.infer<typeof compareRequestSchema>;
export type CompareCandidate = z.infer<typeof compareCandidateSchema>;
export type CompareReadModel = z.infer<typeof compareReadModelSchema>;
