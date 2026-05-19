import { z } from "zod";
import {
  predictionPositionBreakdownSchema,
  predictionScoreBreakdownSchema,
  predictionStrategyIdSchema
} from "@/schema/app/prediction.schema";
import { lotteryFilterContextSchema, lotteryPrizeTypeSchema } from "@/schema/app/query.schema";

const backtestPrizeTypeSchema = lotteryPrizeTypeSchema.exclude(["OTHER"]);

export const backtestRequestSchema = lotteryFilterContextSchema.extend({
  strategyId: predictionStrategyIdSchema.optional().default("balanced"),
  candidateCount: z.coerce.number().int().min(1).max(20).default(5),
  targetDrawCount: z.coerce.number().int().min(1).max(500).default(30),
  numberLength: z.coerce
    .number()
    .pipe(z.union([z.literal(2), z.literal(3), z.literal(6)]))
    .default(2),
  prizeType: backtestPrizeTypeSchema.optional(),
  params: z.record(z.string(), z.unknown()).optional().default({})
});

export const backtestRunSchema = z.object({
  id: z.string(),
  strategyId: z.string(),
  strategyName: z.string(),
  params: z.record(z.string(), z.unknown()),
  lotteryType: z.string(),
  prizeType: z.string(),
  numberLength: z.number(),
  startDrawDate: z.string(),
  endDrawDate: z.string(),
  candidateCount: z.number(),
  hitRate: z.number(),
  longestMissStreak: z.number(),
  averageHitRank: z.number().optional(),
  expectedRandomHitRate: z.number().optional(),
  coverage: z.number(),
  liftVsRandom: z.number().optional(),
  computedAt: z.string(),
  version: z.string()
});

export const backtestResultSchema = z.object({
  id: z.string(),
  runId: z.string(),
  drawId: z.string(),
  drawDate: z.string(),
  generatedNumbers: z.array(z.string()),
  actualNumbers: z.array(z.string()),
  isHit: z.boolean(),
  hitNumbers: z.array(z.string()),
  rankOfHit: z.number().optional(),
  explanation: z
    .object({
      calculationWindow: z.number(),
      candidateCount: z.number(),
      generatedCandidates: z.array(
        z.object({
          isHit: z.boolean(),
          number: z.string(),
          numberLength: z.number(),
          positionBreakdown: z.array(predictionPositionBreakdownSchema),
          rank: z.number(),
          reasons: z.array(z.string()),
          score: z.number(),
          scoreBreakdown: predictionScoreBreakdownSchema
        })
      ),
      strategyId: z.string(),
      strategyName: z.string(),
      version: z.string()
    })
    .optional()
});

export const backtestReadModelSchema = z.object({
  generatedAt: z.string(),
  source: z.enum(["mock", "api"]),
  run: backtestRunSchema,
  results: z.array(backtestResultSchema)
});

export const backtestHistoryItemSchema = z.object({
  id: z.string(),
  strategyId: z.string(),
  strategyName: z.string(),
  lotteryType: z.string(),
  prizeType: z.string(),
  numberLength: z.number(),
  candidateCount: z.number(),
  hitRate: z.number(),
  longestMissStreak: z.number(),
  coverage: z.number(),
  computedAt: z.string(),
  version: z.string()
});

export const backtestHistoryResponseSchema = z.object({
  generatedAt: z.string(),
  source: z.literal("api"),
  items: z.array(backtestHistoryItemSchema)
});

export type BacktestRequest = z.infer<typeof backtestRequestSchema>;
export type BacktestHistoryItem = z.infer<typeof backtestHistoryItemSchema>;
export type BacktestHistoryResponse = z.infer<typeof backtestHistoryResponseSchema>;
export type BacktestRun = z.infer<typeof backtestRunSchema>;
export type BacktestResult = z.infer<typeof backtestResultSchema>;
export type BacktestReadModel = z.infer<typeof backtestReadModelSchema>;
