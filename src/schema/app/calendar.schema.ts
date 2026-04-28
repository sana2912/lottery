import { z } from "zod";

export const calendarDrawSchema = z.object({
  id: z.string(),
  drawDate: z.string(),
  drawDateIso: z.string(),
  drawNo: z.string().optional(),
  status: z.enum(["upcoming", "past"]),
  isNextDraw: z.boolean()
});

export const monthlyInsightSchema = z.object({
  id: z.string(),
  month: z.number(),
  label: z.string(),
  sampleSize: z.number(),
  summary: z.string(),
  hotNumbers: z.array(z.string()),
  coldNumbers: z.array(z.string()),
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
export type MonthlyInsight = z.infer<typeof monthlyInsightSchema>;
export type CalendarReadModel = z.infer<typeof calendarReadModelSchema>;
