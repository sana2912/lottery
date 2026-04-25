import { z } from "zod";

export const analyticsSummarySchema = z.object({
  drawCount: z.number(),
  generatedAt: z.string()
});

export type AnalyticsSummary = z.infer<typeof analyticsSummarySchema>;
