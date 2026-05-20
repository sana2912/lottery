import { z } from "zod";
import { analysisPrizeTypeSchema, lotteryPrizeTypeSchema } from "@/schema/app/query.schema";

export const searchDrawHitSchema = z.object({
  drawDate: z.string(),
  drawNo: z.string(),
  id: z.string(),
  sourceStatus: z.enum(["IMPORTED", "PARTIAL", "VERIFIED"])
});

export const searchPrizeHitSchema = z.object({
  drawDate: z.string(),
  drawId: z.string(),
  drawNo: z.string(),
  id: z.string(),
  number: z.string(),
  prizeType: lotteryPrizeTypeSchema.exclude(["OTHER"])
});

export const searchStatHitSchema = z.object({
  frequencyPercent: z.number(),
  hitCount: z.number().int().nonnegative(),
  lastSeenDrawDate: z.string().optional(),
  missingDrawCount: z.number().int().nonnegative(),
  number: z.string(),
  prizeType: analysisPrizeTypeSchema,
  samplePrizeCount: z.number().int().nonnegative().optional(),
  trendScore: z.number(),
  windowSize: z.number().int().positive()
});

export const searchWatchlistHitSchema = z.object({
  id: z.string(),
  note: z.string().optional(),
  number: z.string(),
  source: z.enum(["MANUAL", "NOTEBOOK", "PREDICTION"]),
  tags: z.array(z.string()),
  updatedAt: z.string()
});

export const searchReadModelSchema = z.object({
  generatedAt: z.string(),
  groups: z.object({
    draws: z.array(searchDrawHitSchema),
    prizes: z.array(searchPrizeHitSchema),
    stats: z.array(searchStatHitSchema),
    watchlist: z.array(searchWatchlistHitSchema)
  }),
  q: z.string(),
  source: z.literal("api")
});

export type SearchReadModel = z.infer<typeof searchReadModelSchema>;
