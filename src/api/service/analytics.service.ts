import { buildOnDemandAnalysisReadModel } from "@/api/service/analysis-snapshot/on-demand-read-model";
import {
  getAnalysisContextForFilterQuery,
  getAnalysisSnapshotAnalyticsReadModel,
  getAnalysisSnapshotDigitStats,
  getAnalysisSnapshotNumberStats
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

  return getOnDemandOrEmptyReadModel(query);
}

export async function getDigitStats(query: AnalyticsQuery) {
  const snapshotStats = await timeAsync("analytics.digits snapshot lookup", () =>
    getAnalysisSnapshotDigitStats(query)
  );

  if (snapshotStats) {
    return snapshotStats;
  }

  return (await getOnDemandOrEmptyReadModel(query)).digitStats;
}

export async function getNumberStats(query: AnalyticsQuery) {
  const snapshotStats = await timeAsync("analytics.numbers snapshot lookup", () =>
    getAnalysisSnapshotNumberStats(query)
  );

  if (snapshotStats) {
    return snapshotStats;
  }

  return (await getOnDemandOrEmptyReadModel(query)).numberStats;
}

async function getOnDemandOrEmptyReadModel(query: AnalyticsQuery): Promise<ApiAnalyticsReadModel> {
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
