import { buildOnDemandAnalysisReadModel } from "@/api/service/analysis-snapshot/on-demand-read-model";
import {
  getAnalysisContextForFilterQuery,
  getAnalysisSnapshotAnalyticsReadModel
} from "@/api/service/analysis-snapshot/snapshot-reader";
import {
  type AnalyticsQuery,
  buildEmptyAnalyticsReadModel
} from "@/api/service/analytics/analytics-engine";
import type { ApiAnalyticsReadModel } from "@/schema/api/analytics";

export async function getAnalyticsReadModel(query: AnalyticsQuery): Promise<ApiAnalyticsReadModel> {
  const analysisSnapshot = await timeAsync("analytics.analysis snapshot lookup", () =>
    getAnalysisSnapshotAnalyticsReadModel(query)
  );

  if (analysisSnapshot) {
    return {
      ...analysisSnapshot,
      source: "snapshot"
    };
  }

  const analysisContext = getAnalysisContextForFilterQuery(query);

  if (analysisContext) {
    console.warn(
      `analytics.snapshot miss for ${analysisContext.engineVersion}/${analysisContext.lotteryType}/${analysisContext.prizeType}/${analysisContext.scope}/${analysisContext.month ?? "ALL_MONTHS"}/${analysisContext.year ?? "ALL_YEARS"}; using on-demand fallback.`
    );

    const readModel = await timeAsync("analytics.analysis on-demand fallback", () =>
      buildOnDemandAnalysisReadModel(analysisContext)
    );

    return {
      ...readModel,
      source: "on-demand"
    };
  }

  return {
    ...buildEmptyAnalyticsReadModel(query),
    source: "empty" as const
  };
}

export async function getDigitStats(query: AnalyticsQuery) {
  return (await getAnalyticsReadModel(query)).digitStats;
}

export async function getNumberStats(query: AnalyticsQuery) {
  return (await getAnalyticsReadModel(query)).numberStats;
}

export const analyticsService = {
  getAnalyticsReadModel,
  getDigitStats,
  getNumberStats
} as const;

async function timeAsync<T>(label: string, operation: () => Promise<T>) {
  console.time(label);

  try {
    return await operation();
  } finally {
    console.timeEnd(label);
  }
}
