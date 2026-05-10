import { z } from "zod";
import {
  lotteryPrizeTypeSchema,
  lotteryTypeSchema,
  numberLengthSchema
} from "@/schema/app/query.schema";

export const predictionStrategyIdSchema = z.enum(["balanced", "coldRebound", "hotTrend"]);

export const predictionScoreBreakdownSchema = z.object({
  hot: z.number(),
  overdue: z.number(),
  pair: z.number(),
  pattern: z.number(),
  position: z.number()
});

export const predictionPositionBreakdownSchema = z.object({
  digit: z.string(),
  hot: z.number(),
  overdue: z.number(),
  position: z.number(),
  positionIndex: z.number(),
  reasons: z.array(z.string()),
  score: z.number(),
  tone: z.enum(["hot", "warm", "neutral", "cold"])
});

export const predictionRequestSchema = z.object({
  count: z.coerce.number().int().min(1).max(20).optional().default(5),
  lotteryType: lotteryTypeSchema.optional().default("THAI_GOVERNMENT"),
  numberLength: z.coerce.number().pipe(numberLengthSchema).optional().default(2),
  prizeType: lotteryPrizeTypeSchema.optional().default("TWO_DIGIT"),
  strategyId: predictionStrategyIdSchema.optional().default("balanced"),
  windowSize: z.coerce.number().int().min(1).max(2000).optional().default(120)
});

export const predictionResultSchema = z.object({
  id: z.string(),
  inputWindow: z.number(),
  number: z.string(),
  numberLength: z.number(),
  positionBreakdown: z.array(predictionPositionBreakdownSchema),
  rank: z.number(),
  reasons: z.array(z.string()),
  score: z.number(),
  scoreBreakdown: predictionScoreBreakdownSchema,
  strategyId: predictionStrategyIdSchema,
  strategyName: z.string(),
  version: z.string()
});

export const predictionResponseSchema = z.object({
  generatedAt: z.string(),
  input: predictionRequestSchema.required(),
  results: z.array(predictionResultSchema),
  source: z.literal("api")
});

export type PredictionRequest = z.infer<typeof predictionRequestSchema>;
export type PredictionResponse = z.infer<typeof predictionResponseSchema>;
export type PredictionResult = z.infer<typeof predictionResultSchema>;
export type PredictionPositionBreakdown = z.infer<typeof predictionPositionBreakdownSchema>;
export type PredictionScoreBreakdown = z.infer<typeof predictionScoreBreakdownSchema>;
export type PredictionStrategyId = z.infer<typeof predictionStrategyIdSchema>;
