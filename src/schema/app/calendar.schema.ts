import { z } from "zod";

export const calendarHeatmapToneSchema = z.enum(["hot", "warm", "neutral", "cool", "cold"]);

export const calendarHeatmapQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  prizeType: z.enum(["FIRST", "PRIZE2", "PRIZE3", "PRIZE4", "PRIZE5", "NEAR_FIRST"]).optional(),
  windowSize: z.coerce.number().int().min(1).max(200).optional()
});

export const calendarHeatmapCellSchema = z.object({
  appearanceCount: z.number(),
  digit: z.string(),
  missingRounds: z.number(),
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
  id: z.string(),
  heatmapRows: z.array(calendarHeatmapRowSchema),
  hotNumbers: z.array(z.string()),
  month: z.number(),
  label: z.string(),
  sampleSize: z.number(),
  summary: z.string(),
  prizeType: z.enum(["FIRST", "PRIZE2", "PRIZE3", "PRIZE4", "PRIZE5", "NEAR_FIRST"]).optional(),
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
