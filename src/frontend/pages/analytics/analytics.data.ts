import {
  type FilterContext,
  toAnalyticsApiQuery
} from "@/frontend/pages/analytics/analytics.query";
import { apiGet } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import { type AnalyticsReadModel, analyticsReadModelSchema } from "@/schema/app/analytics.schema";

const analyticsShell = analyticsReadModelSchema.parse({
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

export type AnalyticsPageData =
  | { model: AnalyticsReadModel; state: "error" }
  | { model: AnalyticsReadModel; state: "ready" }
  | { model: AnalyticsReadModel; state: "empty" };

export async function getAnalyticsPageData(query: FilterContext): Promise<AnalyticsPageData> {
  try {
    const model = await apiGet<AnalyticsReadModel>(apiRoutes.analytics, {
      cache: "no-store",
      query: toAnalyticsApiQuery(query),
      schema: analyticsReadModelSchema
    });

    return {
      model,
      state: model.numberStats.length > 0 ? "ready" : "empty"
    };
  } catch {
    return {
      model: {
        ...analyticsShell,
        generatedAt: new Date().toISOString(),
        summary: {
          ...analyticsShell.summary,
          generatedAt: new Date().toISOString()
        }
      },
      state: "error"
    };
  }
}

export async function getAnalyticsModel(query?: FilterContext): Promise<AnalyticsReadModel> {
  return (
    await getAnalyticsPageData(
      query ?? {
        lotteryType: "THAI_GOVERNMENT",
        page: 1,
        pageSize: 20,
        windowSize: 120
      }
    )
  ).model;
}
