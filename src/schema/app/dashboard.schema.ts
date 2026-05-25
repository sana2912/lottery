import { z } from "zod";

export const dashboardMetricToneSchema = z.enum([
  "default",
  "hot",
  "cold",
  "overdue",
  "prediction",
  "backtest"
]);

const dashboardPrizeSchema = z.object({
  label: z.string(),
  value: z.string()
});

export const dashboardReadModelSchema = z.object({
  generatedAt: z.string(),
  source: z.enum(["mock", "api"]),
  hero: z.object({
    eyebrow: z.string(),
    title: z.string(),
    description: z.string(),
    primaryActionLabel: z.string(),
    primaryActionHref: z.string()
  }),
  metrics: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      hint: z.string(),
      tone: dashboardMetricToneSchema,
      trend: z.string().optional()
    })
  ),
  latestDraw: z.object({
    id: z.string(),
    drawDate: z.string(),
    drawDateIso: z.string(),
    drawNo: z.string(),
    lotteryType: z.string(),
    statusLabel: z.string(),
    primaryPrize: dashboardPrizeSchema,
    secondaryPrizes: z.array(dashboardPrizeSchema)
  }),
  signals: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      number: z.string(),
      score: z.number(),
      tone: dashboardMetricToneSchema,
      reason: z.string()
    })
  ),
  predictionSummary: z.object({
    title: z.string(),
    generatedAt: z.string(),
    candidates: z.array(
      z.object({
        number: z.string(),
        score: z.number(),
        reasons: z.array(z.string())
      })
    ),
    disclaimer: z.string()
  }),
  contractRows: z.array(
    z.object({
      field: z.string(),
      source: z.string(),
      purpose: z.string()
    })
  )
});

export type DashboardReadModel = z.infer<typeof dashboardReadModelSchema>;
export type DashboardMetric = DashboardReadModel["metrics"][number];
