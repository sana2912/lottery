import { z } from "zod";
import { filterContextSchema } from "@/schema/app/query.schema";

export const backtestRequestSchema = filterContextSchema.extend({
  strategyId: z.string(),
  candidateCount: z.coerce.number().int().min(1).max(100).default(10),
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
  coverage: z.number(),
  computedAt: z.string()
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
  rankOfHit: z.number().optional()
});

export const backtestReadModelSchema = z.object({
  generatedAt: z.string(),
  source: z.enum(["mock", "api"]),
  run: backtestRunSchema,
  results: z.array(backtestResultSchema)
});

export type BacktestRequest = z.infer<typeof backtestRequestSchema>;
export type BacktestRun = z.infer<typeof backtestRunSchema>;
export type BacktestResult = z.infer<typeof backtestResultSchema>;
export type BacktestReadModel = z.infer<typeof backtestReadModelSchema>;
