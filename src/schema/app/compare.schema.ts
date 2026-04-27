import { z } from "zod";
import { filterContextSchema } from "@/schema/app/query.schema";

export const scoreBreakdownSchema = z.object({
  hot: z.number(),
  overdue: z.number(),
  position: z.number(),
  pair: z.number(),
  pattern: z.number()
});

export const compareRequestSchema = filterContextSchema.extend({
  numbers: z.array(z.string()).min(1).max(20)
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
  candidates: z.array(compareCandidateSchema),
  strongestSignal: z.string().optional(),
  sampleSize: z.number()
});

export type ScoreBreakdown = z.infer<typeof scoreBreakdownSchema>;
export type CompareRequest = z.infer<typeof compareRequestSchema>;
export type CompareCandidate = z.infer<typeof compareCandidateSchema>;
export type CompareReadModel = z.infer<typeof compareReadModelSchema>;
