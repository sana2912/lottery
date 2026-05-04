import {
  type AnalyticsQuery,
  buildAnalyticsReadModelFromPrizes,
  getPrizeWindow
} from "@/api/service/analytics/analytics-engine";
import { getMaterializedAnalyticsReadModel } from "@/api/service/analytics/materialized-stats";
import { getPrisma } from "@/api/service/prisma";

export async function getAnalyticsReadModel(query: AnalyticsQuery) {
  const materialized = await timeAsync("analytics.materialized snapshot lookup", () =>
    getMaterializedAnalyticsReadModel(query)
  );

  if (materialized) {
    return materialized;
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
