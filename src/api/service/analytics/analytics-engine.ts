import { toApiAnalyticsReadModel } from "@/api/model/dto/analytics.dto";
import { extractDigitEvents } from "@/api/service/analytics/digit-events";
import {
  calculateDigitStats,
  calculateNumberStats,
  summarizePatterns
} from "@/api/service/analytics/number-stats";
import type { DateTimeFilter } from "@/generated/prisma/commonInputTypes";
import type { LotteryDrawWhereInput } from "@/generated/prisma/models/LotteryDraw";
import type { LotteryPrizeWhereInput } from "@/generated/prisma/models/LotteryPrize";
import type { ApiAnalyticsReadModel } from "@/schema/api/analytics";
import type { FilterContext } from "@/schema/app/query.schema";

export type AnalyticsQuery = FilterContext;

export async function getPrizeWindow(
  prisma: {
    lotteryDraw: {
      findMany: (args: {
        orderBy: { drawDate: "desc" };
        select: { id: true };
        take: number;
        where: LotteryDrawWhereInput;
      }) => Promise<Array<{ id: string }>>;
    };
    lotteryPrize: {
      findMany: (args: {
        include: { draw: true };
        orderBy: Array<{ draw: { drawDate: "desc" } } | { position: "asc" } | { number: "asc" }>;
        where: LotteryPrizeWhereInput;
      }) => Promise<
        Array<{
          draw: { drawDate: Date | string; lotteryType: string };
          drawId: string;
          number: string;
          position?: number | null;
          type: string;
        }>
      >;
    };
  },
  query: AnalyticsQuery
) {
  const draws = await prisma.lotteryDraw.findMany({
    orderBy: {
      drawDate: "desc"
    },
    select: {
      id: true
    },
    take: query.windowSize,
    where: buildDrawWhere(query)
  });

  if (draws.length === 0) {
    return [];
  }

  const drawIds = draws.map((draw) => draw.id);

  return prisma.lotteryPrize.findMany({
    include: {
      draw: true
    },
    orderBy: [
      {
        draw: {
          drawDate: "desc"
        }
      },
      {
        position: "asc"
      },
      {
        number: "asc"
      }
    ],
    where: buildPrizeWhere(query, drawIds)
  });
}

export function buildAnalyticsReadModelFromPrizes(
  prizes: Awaited<ReturnType<typeof getPrizeWindow>>,
  query: AnalyticsQuery,
  computedAt: Date
): ApiAnalyticsReadModel {
  const drawCount = getDrawCount(prizes);
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

function buildPrizeWhere(
  query: AnalyticsQuery,
  drawIds: readonly string[]
): LotteryPrizeWhereInput {
  return {
    drawId: {
      in: [...drawIds]
    },
    type: query.prizeType
  };
}

function buildDrawWhere(query: AnalyticsQuery): LotteryDrawWhereInput {
  const where: LotteryDrawWhereInput = {
    lotteryType: query.lotteryType
  };
  const drawDate = buildDrawDateFilter(query);

  if (drawDate) {
    where.drawDate = drawDate;
  }

  return where;
}

function buildDrawDateFilter(query: AnalyticsQuery): DateTimeFilter<"LotteryDraw"> | undefined {
  const filter: DateTimeFilter<"LotteryDraw"> = {};
  const yearMonthRange = buildYearMonthRange(query.year, query.month);

  if (yearMonthRange) {
    filter.gte = yearMonthRange.start;
    filter.lt = yearMonthRange.end;
  }

  if (query.startDate) {
    filter.gte = new Date(query.startDate);
  }

  if (query.endDate) {
    filter.lte = new Date(query.endDate);
  } else {
    filter.lte = new Date();
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}

function buildYearMonthRange(
  year: number | undefined,
  month: number | undefined
): { end: Date; start: Date } | undefined {
  if (!year) {
    return undefined;
  }

  if (!month) {
    return {
      end: new Date(Date.UTC(year + 1, 0, 1)),
      start: new Date(Date.UTC(year, 0, 1))
    };
  }

  return {
    end: new Date(Date.UTC(year, month, 1)),
    start: new Date(Date.UTC(year, month - 1, 1))
  };
}

function getDrawCount(prizes: Awaited<ReturnType<typeof getPrizeWindow>>) {
  return new Set(prizes.map((prize) => prize.drawId)).size;
}
