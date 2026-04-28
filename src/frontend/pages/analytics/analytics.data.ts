import { apiGet } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import { type AnalyticsReadModel, analyticsReadModelSchema } from "@/schema/app/analytics.schema";

export const analyticsFallback = analyticsReadModelSchema.parse({
  digitStats: [],
  generatedAt: "2026-04-28T00:00:00.000Z",
  numberStats: [],
  patternSummaries: [],
  source: "mock",
  summary: {
    drawCount: 0,
    generatedAt: "2026-04-28T00:00:00.000Z"
  }
});

export async function getAnalyticsModel(): Promise<AnalyticsReadModel> {
  try {
    return await apiGet<AnalyticsReadModel>(apiRoutes.analytics, {
      cache: "no-store",
      schema: analyticsReadModelSchema
    });
  } catch {
    return analyticsFallback;
  }
}
