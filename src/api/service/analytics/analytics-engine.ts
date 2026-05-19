import { toApiAnalyticsReadModel } from "@/api/model/dto/analytics.dto";
import {
  getAnalysisPrizeSourceTypes,
  isAnalysisPrizeType,
  isGroupedAnalysisPrizeType
} from "@/api/service/analysis-snapshot/analysis-context";
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
        orderBy: { drawDate: "desc" } | { drawDate: "asc" };
        select: { drawDate: true; id: true; lotteryType: true };
        take: number;
        where: LotteryDrawWhereInput;
      }) => Promise<Array<{ drawDate: Date; id: string; lotteryType: string }>>;
    };
    lotteryPrize: {
      findMany: (args: {
        orderBy: Array<{ drawId: "asc" } | { position: "asc" } | { number: "asc" }>;
        where: LotteryPrizeWhereInput;
      }) => Promise<
        Array<{
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
  console.time("analytics.draw id query");
  const draws = await prisma.lotteryDraw.findMany({
    orderBy: {
      drawDate: "desc"
    },
    select: {
      drawDate: true,
      id: true,
      lotteryType: true
    },
    take: query.windowSize,
    where: buildDrawWhere(query)
  });
  console.timeEnd("analytics.draw id query");

  if (draws.length === 0) {
    return [];
  }

  const drawIds = draws.map((draw) => draw.id);
  console.time("analytics.prize rows query");
  const prizes = await prisma.lotteryPrize.findMany({
    orderBy: [
      {
        drawId: "asc"
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
  console.timeEnd("analytics.prize rows query");

  const drawById = new Map(
    draws.map((draw) => [
      draw.id,
      {
        drawDate: draw.drawDate,
        lotteryType: draw.lotteryType
      }
    ])
  );
  const drawOrderById = new Map(draws.map((draw, index) => [draw.id, index]));

  return prizes
    .map((prize) => {
      const draw = drawById.get(prize.drawId);

      if (!draw) {
        return undefined;
      }

      return {
        ...prize,
        draw,
        type: isGroupedAnalysisPrizeType(query.prizeType) ? query.prizeType : prize.type
      };
    })
    .flatMap((prize) => (prize ? [prize] : []))
    .sort((left, right) => {
      const leftDrawOrder = drawOrderById.get(left.drawId) ?? 0;
      const rightDrawOrder = drawOrderById.get(right.drawId) ?? 0;

      return (
        leftDrawOrder - rightDrawOrder ||
        (left.position ?? 0) - (right.position ?? 0) ||
        left.number.localeCompare(right.number)
      );
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
  const sourcePrizeTypes =
    query.prizeType && isAnalysisPrizeType(query.prizeType)
      ? getAnalysisPrizeSourceTypes(query.prizeType)
      : undefined;
  const sourcePrizeType = sourcePrizeTypes?.[0];

  return {
    drawId: {
      in: [...drawIds]
    },
    type:
      sourcePrizeTypes && sourcePrizeTypes.length > 1
        ? { in: [...sourcePrizeTypes] }
        : sourcePrizeType
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
