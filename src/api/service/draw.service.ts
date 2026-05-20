import { toApiDrawDetailResponse, toApiDrawListResponse } from "@/api/model/dto/draw.dto";
import { getPrisma } from "@/api/service/prisma";
import type { LotteryDrawWhereInput } from "@/generated/prisma/models/LotteryDraw";
import type { SearchQuery } from "@/schema/app/query.schema";
import { buildDrawDateFilter } from "@/util/api/draw-date-filter";

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
  const drawDate = buildDrawDateFilterForQuery(query);

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

function buildDrawDateFilterForQuery(query: GetDrawsQuery) {
  return buildDrawDateFilter({
    endDate: query.endDate,
    month: query.month,
    startDate: query.startDate,
    year: query.year
  });
}
