import { z } from "zod";

export const lotteryTypeSchema = z.enum(["THAI_GOVERNMENT"]);

export const lotteryPrizeTypeSchema = z.enum([
  "FIRST",
  "THREE_DIGIT",
  "THREE_FRONT",
  "THREE_BACK",
  "TWO_DIGIT",
  "NEAR_FIRST",
  "PRIZE2",
  "PRIZE3",
  "PRIZE4",
  "PRIZE5",
  "OTHER"
]);

export const analysisPrizeTypeSchema = z.enum([
  "FIRST",
  "THREE_DIGIT",
  "THREE_FRONT",
  "THREE_BACK",
  "TWO_DIGIT",
  "NEAR_FIRST",
  "PRIZE2",
  "PRIZE3",
  "PRIZE4",
  "PRIZE5",
  "SIX_DIGIT_ALL"
]);

export const numberLengthSchema = z.union([z.literal(2), z.literal(3), z.literal(6)]);
export const analysisScopeSchema = z.enum(["ALL_TIME", "MONTH"]);
export const analysisWindowPresetSchema = z.enum(["ALL"]);

const optionalPositiveIntSchema = z.coerce.number().int().positive().optional();

export const lotteryQuerySchema = z.object({
  lotteryType: lotteryTypeSchema.default("THAI_GOVERNMENT"),
  prizeType: lotteryPrizeTypeSchema.optional()
});

export const analysisLotteryQuerySchema = z.object({
  lotteryType: lotteryTypeSchema.default("THAI_GOVERNMENT"),
  prizeType: analysisPrizeTypeSchema.optional()
});

export const drawRangeQuerySchema = lotteryQuerySchema.extend({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  year: z.coerce.number().int().min(1900).max(3000).optional(),
  month: z.coerce.number().int().min(1).max(12).optional()
});

export const analysisDrawRangeQuerySchema = analysisLotteryQuerySchema.extend({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  year: z.coerce.number().int().min(1900).max(3000).optional(),
  month: z.coerce.number().int().min(1).max(12).optional()
});

export const paginationQuerySchema = z.object({
  page: optionalPositiveIntSchema.default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20)
});

export const windowQuerySchema = lotteryQuerySchema.extend({
  windowSize: z.coerce.number().int().min(1).max(2000).optional().default(120),
  numberLength: z.coerce.number().pipe(numberLengthSchema).optional()
});

export const searchQuerySchema = drawRangeQuerySchema.merge(paginationQuerySchema).extend({
  q: z.string().trim().optional()
});

export const lotteryFilterContextSchema = drawRangeQuerySchema.merge(paginationQuerySchema).extend({
  q: z.string().trim().optional(),
  /** Training/scoring window for compare, backtest, prediction — not analysis snapshot scope. */
  windowSize: z.coerce.number().int().min(1).max(2000).optional().default(120),
  windowPreset: analysisWindowPresetSchema.optional(),
  scope: analysisScopeSchema.optional(),
  numberLength: z.coerce.number().pipe(numberLengthSchema).optional()
});

export const filterContextSchema = analysisDrawRangeQuerySchema
  .merge(paginationQuerySchema)
  .extend({
    q: z.string().trim().optional(),
    windowPreset: analysisWindowPresetSchema.optional(),
    scope: analysisScopeSchema.optional(),
    numberLength: z.coerce.number().pipe(numberLengthSchema).optional()
  });

export type LotteryQuery = z.infer<typeof lotteryQuerySchema>;
export type AnalysisLotteryQuery = z.infer<typeof analysisLotteryQuerySchema>;
export type DrawRangeQuery = z.infer<typeof drawRangeQuerySchema>;
export type AnalysisDrawRangeQuery = z.infer<typeof analysisDrawRangeQuerySchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type WindowQuery = z.infer<typeof windowQuerySchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type LotteryFilterContext = z.infer<typeof lotteryFilterContextSchema>;
export type FilterContext = z.infer<typeof filterContextSchema>;
