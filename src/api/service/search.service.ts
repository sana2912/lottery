import { analyticsService } from "@/api/service/analytics.service";
import { getPrisma } from "@/api/service/prisma";
import type {
  ApiSearchPrizeHitPrizeType,
  ApiSearchReadModel,
  ApiSearchStatHit
} from "@/schema/api/search";
import type { SearchQuery } from "@/schema/app/query.schema";

const SEARCHABLE_PRIZE_TYPES = [
  "FIRST",
  "THREE_DIGIT",
  "TWO_DIGIT",
  "PRIZE2",
  "PRIZE3",
  "PRIZE4",
  "PRIZE5"
] as const satisfies readonly ApiSearchPrizeHitPrizeType[];

export async function search(query: SearchQuery): Promise<ApiSearchReadModel> {
  const prisma = getPrisma();
  const q = query.q?.trim() ?? "";
  const generatedAt = new Date().toISOString();

  if (!q) {
    return {
      generatedAt,
      groups: {
        draws: [],
        prizes: [],
        stats: [],
        watchlist: []
      },
      q,
      source: "api"
    };
  }

  const [draws, prizes, stats, watchlist] = await Promise.all([
    prisma.lotteryDraw.findMany({
      orderBy: {
        drawDate: "desc"
      },
      take: 10,
      where: {
        lotteryType: query.lotteryType,
        OR: [
          {
            drawNo: {
              contains: q,
              mode: "insensitive"
            }
          },
          {
            prizes: {
              some: {
                number: {
                  contains: q
                }
              }
            }
          }
        ]
      }
    }),
    prisma.lotteryPrize.findMany({
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
        }
      ],
      take: 20,
      where: {
        draw: {
          lotteryType: query.lotteryType
        },
        number: {
          contains: q
        },
        type: {
          in: [...SEARCHABLE_PRIZE_TYPES]
        }
      }
    }),
    getSearchStats(query),
    prisma.userWatchlistItem.findMany({
      orderBy: {
        updatedAt: "desc"
      },
      take: 20,
      where: {
        OR: [
          {
            number: {
              contains: q
            }
          },
          {
            note: {
              contains: q,
              mode: "insensitive"
            }
          },
          {
            tags: {
              has: q
            }
          }
        ]
      }
    })
  ]);

  return {
    generatedAt,
    groups: {
      draws: draws.map((draw) => ({
        drawDate: draw.drawDate.toISOString(),
        drawNo: draw.drawNo ?? "-",
        id: draw.id,
        sourceStatus: draw.sourceStatus
      })),
      prizes: prizes.map((prize) => ({
        drawDate: prize.draw.drawDate.toISOString(),
        drawId: prize.drawId,
        drawNo: prize.draw.drawNo ?? "-",
        id: prize.id,
        number: prize.number,
        prizeType: prize.type as ApiSearchPrizeHitPrizeType
      })),
      stats,
      watchlist: watchlist.map((item) => ({
        id: item.id,
        note: item.note ?? undefined,
        number: item.number,
        source: item.source,
        tags: [...item.tags],
        updatedAt: item.updatedAt.toISOString()
      }))
    },
    q,
    source: "api"
  };
}

export const searchService = {
  search
} as const;

async function getSearchStats(query: SearchQuery) {
  if (!/^\d+$/.test(query.q ?? "")) {
    return [];
  }

  const digitLength = query.q?.length;

  if (digitLength === 2) {
    return mapSearchStats(
      await analyticsService.getNumberStats({
        lotteryType: query.lotteryType,
        numberLength: 2,
        page: 1,
        pageSize: 100,
        prizeType: "TWO_DIGIT",
        windowPreset: "ALL"
      }),
      query.q ?? ""
    );
  }

  if (digitLength === 3) {
    return mapSearchStats(
      await analyticsService.getNumberStats({
        lotteryType: query.lotteryType,
        numberLength: 3,
        page: 1,
        pageSize: 1000,
        prizeType: "THREE_DIGIT",
        windowPreset: "ALL"
      }),
      query.q ?? ""
    );
  }

  if (digitLength === 6) {
    return mapSearchStats(
      await analyticsService.getNumberStats({
        lotteryType: query.lotteryType,
        numberLength: 6,
        page: 1,
        pageSize: 1000,
        prizeType: "SIX_DIGIT_ALL",
        scope: "ALL_TIME",
        windowPreset: "ALL"
      }),
      query.q ?? ""
    );
  }

  return [];
}

function mapSearchStats(
  stats: Awaited<ReturnType<typeof analyticsService.getNumberStats>>,
  q: string
): ApiSearchStatHit[] {
  return stats
    .filter((stat) => stat.number.includes(q))
    .slice(0, 20)
    .map((stat) => ({
      frequencyPercent: stat.frequencyPercent,
      hitCount: stat.hitCount,
      lastSeenDrawDate: stat.lastSeenDrawDate,
      missingDrawCount: stat.missingDrawCount,
      number: stat.number,
      prizeType: stat.prizeType as ApiSearchStatHit["prizeType"],
      samplePrizeCount: stat.samplePrizeCount,
      trendScore: stat.trendScore,
      windowSize: stat.windowSize
    }));
}
