import { z } from "zod";
import { analysisScopeSchema, analysisWindowPresetSchema } from "@/schema/app/query.schema";

const calendarPrizeTypeSchema = z.enum([
  "FIRST",
  "THREE_DIGIT",
  "THREE_FRONT",
  "THREE_BACK",
  "TWO_DIGIT",
  "NEAR_FIRST",
  "PRIZE2",
  "PRIZE3",
  "PRIZE4",
  "PRIZE5"
]);
const optionalCalendarPrizeTypeSchema = z.preprocess(
  (value) => (value === "SIX_DIGIT_ALL" ? undefined : value),
  calendarPrizeTypeSchema.optional()
);

export const calendarHeatmapToneSchema = z.enum(["hot", "warm", "neutral", "cool", "cold"]);

export const calendarHeatmapQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(1900).max(3000).optional(),
  prizeType: optionalCalendarPrizeTypeSchema,
  scope: analysisScopeSchema.optional(),
  windowPreset: analysisWindowPresetSchema.optional()
});

export const calendarDataCompletenessSchema = z.enum(["complete", "partial"]);

export const calendarHeatmapCellSchema = z.object({
  appearanceCount: z.number(),
  digit: z.string(),
  eventCount: z.number().optional(),
  eventRatePercent: z.number().optional(),
  expectedRatePercent: z.number().optional(),
  expectedPresenceRatePercent: z.number().optional(),
  hitCount: z.number().optional(),
  hitRatePercent: z.number().optional(),
  lift: z.number().optional(),
  missingRounds: z.number(),
  opportunityCount: z.number().optional(),
  presenceRatePercent: z.number().optional(),
  sampleEventCount: z.number().optional(),
  score: z.number(),
  tone: calendarHeatmapToneSchema
});

export const calendarHeatmapRowSchema = z.object({
  cells: z.array(calendarHeatmapCellSchema),
  coldDigits: z.array(z.string()),
  hotDigits: z.array(z.string()),
  position: z.number()
});

export const calendarDrawSchema = z.object({
  id: z.string(),
  drawDate: z.string(),
  drawDateIso: z.string(),
  drawNo: z.string().optional(),
  status: z.enum(["upcoming", "past"]),
  isNextDraw: z.boolean()
});

export const monthlyInsightSchema = z.object({
  coldNumbers: z.array(z.string()),
  dataCompleteness: calendarDataCompletenessSchema.optional(),
  drawCount: z.number().int().nonnegative().optional(),
  id: z.string(),
  heatmapRows: z.array(calendarHeatmapRowSchema),
  hotNumbers: z.array(z.string()),
  month: z.number().optional(),
  year: z.number().int().min(1900).max(3000).optional(),
  label: z.string(),
  opportunityCountPerPosition: z.number().int().nonnegative().optional(),
  prizesPerDrawActual: z.number().nonnegative().optional(),
  prizesPerDrawExpected: z.number().int().positive().nullable().optional(),
  sampleSize: z.number(),
  summary: z.string(),
  prizeType: calendarPrizeTypeSchema.optional(),
  scope: analysisScopeSchema.optional(),
  windowPreset: analysisWindowPresetSchema.optional(),
  windowSize: z.number().int().positive().optional(),
  positionInsights: z.array(
    z.object({
      coldNumbers: z.array(
        z.object({
          appearanceCount: z.number(),
          digit: z.string(),
          missingRounds: z.number()
        })
      ),
      hotNumbers: z.array(
        z.object({
          appearanceCount: z.number(),
          digit: z.string(),
          missingRounds: z.number()
        })
      ),
      position: z.number()
    })
  ),
  patternNotes: z.array(z.string())
});

export const calendarReadModelSchema = z.object({
  generatedAt: z.string(),
  source: z.enum(["mock", "api"]),
  nextDraw: calendarDrawSchema,
  draws: z.array(calendarDrawSchema),
  monthlyInsights: z.array(monthlyInsightSchema)
});

export type CalendarDraw = z.infer<typeof calendarDrawSchema>;
export type CalendarHeatmapCell = z.infer<typeof calendarHeatmapCellSchema>;
export type CalendarHeatmapQuery = z.infer<typeof calendarHeatmapQuerySchema>;
export type CalendarHeatmapRow = z.infer<typeof calendarHeatmapRowSchema>;
export type MonthlyInsight = z.infer<typeof monthlyInsightSchema>;
export type CalendarReadModel = z.infer<typeof calendarReadModelSchema>;
