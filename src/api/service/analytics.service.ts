import {
  type AnalyticsQuery,
  buildAnalyticsReadModelFromPrizes,
  getPrizeWindow
} from "@/api/service/analytics/analytics-engine";
import { getMaterializedAnalyticsReadModel } from "@/api/service/analytics/materialized-stats";
import { getPrisma } from "@/api/service/prisma";

export async function getAnalyticsReadModel(query: AnalyticsQuery) {
  const materialized = await getMaterializedAnalyticsReadModel(query);

  if (materialized) {
    return materialized;
  }

  const prisma = getPrisma();

  return buildAnalyticsReadModelFromPrizes(await getPrizeWindow(prisma, query), query, new Date());
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
