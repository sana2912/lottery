import { buildOnDemandAnalysisReadModel } from "@/api/service/analysis-snapshot/on-demand-read-model";
import {
  getAnalysisContextForFilterQuery,
  getAnalysisSnapshotAnalyticsReadModel
} from "@/api/service/analysis-snapshot/snapshot-reader";
import {
  type AnalyticsQuery,
  buildAnalyticsReadModelFromPrizes,
  getPrizeWindow
} from "@/api/service/analytics/analytics-engine";
import { getPrisma } from "@/api/service/prisma";

export async function getAnalyticsReadModel(query: AnalyticsQuery) {
  const analysisSnapshot = await timeAsync("analytics.analysis snapshot lookup", () =>
    getAnalysisSnapshotAnalyticsReadModel(query)
  );

  if (analysisSnapshot) {
    return analysisSnapshot;
  }

  const analysisContext = getAnalysisContextForFilterQuery(query);

  if (analysisContext) {
    return timeAsync("analytics.analysis on-demand fallback", () =>
      buildOnDemandAnalysisReadModel(analysisContext)
    );
  }

  const prisma = getPrisma();
  const prizes = await timeAsync("analytics.prize window query", () =>
    getPrizeWindow(prisma, query)
  );

  return timeSync("analytics.buildAnalyticsReadModelFromPrizes", () =>
    buildAnalyticsReadModelFromPrizes(prizes, query, new Date())
  );
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

function timeSync<T>(label: string, operation: () => T) {
  console.time(label);

  try {
    return operation();
  } finally {
    console.timeEnd(label);
  }
}
