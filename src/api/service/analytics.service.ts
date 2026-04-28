import { toApiAnalyticsReadModel } from "@/api/model/dto/analytics.dto";
import { extractDigitEvents } from "@/api/service/analytics/digit-events";
import {
  calculateDigitStats,
  calculateNumberStats,
  summarizePatterns
} from "@/api/service/analytics/number-stats";
import { getPrisma } from "@/api/service/prisma";
import type { DateTimeFilter } from "@/generated/prisma/commonInputTypes";
import type { LotteryPrizeWhereInput } from "@/generated/prisma/models/LotteryPrize";
import type { FilterContext } from "@/schema/app/query.schema";

export type AnalyticsQuery = FilterContext;

export async function getAnalyticsReadModel(query: AnalyticsQuery) {
  const prizes = await getPrizeWindow(query);
  const drawCount = getDrawCount(prizes);
  const computedAt = new Date();
  const context = {
    computedAt,
    drawCount,
    windowSize: query.windowSize
  };
  const digitStats = calculateDigitStats(extractDigitEvents(prizes), context);
  const numberStats = calculateNumberStats(prizes, context, query.numberLength);

  return toApiAnalyticsReadModel({
    digitStats,
    generatedAt: computedAt,
    numberStats,
    patternSummaries: summarizePatterns(numberStats, drawCount),
    source: "api",
    summary: {
      drawCount,
      generatedAt: computedAt
    }
  });
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

async function getPrizeWindow(query: AnalyticsQuery) {
  const prisma = getPrisma();

  return prisma.lotteryPrize.findMany({
    include: {
      draw: true
    },
    orderBy: {
      draw: {
        drawDate: "desc"
      }
    },
    take: query.windowSize,
    where: buildPrizeWhere(query)
  });
}

function buildPrizeWhere(query: AnalyticsQuery): LotteryPrizeWhereInput {
  const drawDate = buildDrawDateFilter(query);
  const draw: LotteryPrizeWhereInput["draw"] = {
    is: {
      lotteryType: query.lotteryType
    }
  };

  if (drawDate && "is" in draw && draw.is) {
    draw.is.drawDate = drawDate;
  }

  return {
    draw,
    type: query.prizeType
  };
}

function buildDrawDateFilter(query: AnalyticsQuery): DateTimeFilter<"LotteryDraw"> | undefined {
  const filter: DateTimeFilter<"LotteryDraw"> = {};

  if (query.startDate) {
    filter.gte = new Date(query.startDate);
  }

  if (query.endDate) {
    filter.lte = new Date(query.endDate);
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}

function getDrawCount(prizes: Awaited<ReturnType<typeof getPrizeWindow>>) {
  return new Set(prizes.map((prize) => prize.drawId)).size;
}
