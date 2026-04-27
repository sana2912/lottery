import { toApiDrawDetailResponse, toApiDrawListResponse } from "@/api/model/dto/draw.dto";
import { getPrisma } from "@/api/service/prisma";
import type { DateTimeFilter } from "@/generated/prisma/commonInputTypes";
import type { LotteryDrawWhereInput } from "@/generated/prisma/models/LotteryDraw";
import type { SearchQuery } from "@/schema/app/query.schema";

export type GetDrawsQuery = SearchQuery;

export async function getDraws(query: GetDrawsQuery) {
  const prisma = getPrisma();
  const where = buildDrawWhere(query);
  const page = query.page;
  const pageSize = query.pageSize;
  const skip = (page - 1) * pageSize;

  const [draws, total] = await Promise.all([
    prisma.lotteryDraw.findMany({
      include: {
        prizes: true
      },
      orderBy: {
        drawDate: "desc"
      },
      skip,
      take: pageSize,
      where
    }),
    prisma.lotteryDraw.count({ where })
  ]);

  return toApiDrawListResponse({
    draws,
    filters: {
      endDate: query.endDate,
      lotteryType: query.lotteryType,
      month: query.month,
      prizeType: query.prizeType,
      q: query.q,
      startDate: query.startDate,
      year: query.year
    },
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  });
}

export async function getDrawById(id: string) {
  const prisma = getPrisma();
  const draw = await prisma.lotteryDraw.findUnique({
    include: {
      prizes: true
    },
    where: {
      id
    }
  });

  return draw ? toApiDrawDetailResponse(draw) : null;
}

export const drawService = {
  getDrawById,
  getDraws
} as const;

function buildDrawWhere(query: GetDrawsQuery): LotteryDrawWhereInput {
  const where: LotteryDrawWhereInput = {
    lotteryType: query.lotteryType
  };
  const drawDate = buildDrawDateFilter(query);

  if (drawDate) {
    where.drawDate = drawDate;
  }

  if (query.prizeType) {
    where.prizes = {
      some: {
        type: query.prizeType
      }
    };
  }

  if (query.q) {
    where.OR = [
      {
        drawNo: {
          contains: query.q
        }
      },
      {
        prizes: {
          some: {
            number: {
              contains: query.q
            }
          }
        }
      }
    ];
  }

  return where;
}

function buildDrawDateFilter(query: GetDrawsQuery): DateTimeFilter<"LotteryDraw"> | undefined {
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
