import { toApiWatchlistItem, toApiWatchlistReadModel } from "@/api/model/dto/watchlist.dto";
import { analyticsService } from "@/api/service/analytics.service";
import { getPrisma } from "@/api/service/prisma";
import type {
  ApiDeleteWatchlistItemResponse,
  ApiWatchlistPrizeType,
  ApiWatchlistStatSummary
} from "@/schema/api/watchlist";
import type { CreateWatchlistItem, UpdateWatchlistItem } from "@/schema/app/watchlist.schema";

export async function getWatchlist() {
  const prisma = getPrisma();
  const items = await prisma.userWatchlistItem.findMany({
    orderBy: {
      updatedAt: "desc"
    }
  });
  const enrichedItems = await enrichWatchlistItems(items);

  return toApiWatchlistReadModel(enrichedItems);
}

export async function createWatchlistItem(input: CreateWatchlistItem) {
  const prisma = getPrisma();
  const item = await prisma.userWatchlistItem.create({
    data: {
      note: input.note,
      number: input.number,
      source: input.source,
      tags: input.tags
    }
  });

  return toApiWatchlistItem(item);
}

export async function updateWatchlistItem(id: string, input: UpdateWatchlistItem) {
  const prisma = getPrisma();
  const item = await prisma.userWatchlistItem.update({
    data: {
      note: input.note,
      source: input.source,
      tags: input.tags
    },
    where: {
      id
    }
  });

  return toApiWatchlistItem(item);
}

export async function deleteWatchlistItem(id: string): Promise<ApiDeleteWatchlistItemResponse> {
  const prisma = getPrisma();
  await prisma.userWatchlistItem.delete({
    where: {
      id
    }
  });

  return {
    deleted: true,
    id,
    scope: "global" as const
  };
}

export const watchlistService = {
  createWatchlistItem,
  deleteWatchlistItem,
  getWatchlist,
  updateWatchlistItem
} as const;

async function enrichWatchlistItems(
  items: Awaited<ReturnType<ReturnType<typeof getPrisma>["userWatchlistItem"]["findMany"]>>
) {
  const numbersByLength = new Map<number, Set<string>>();

  for (const item of items) {
    const length = item.number.length;

    if (!numbersByLength.has(length)) {
      numbersByLength.set(length, new Set());
    }

    numbersByLength.get(length)?.add(item.number);
  }

  const statsByNumber = await getWatchlistStatsByNumber(numbersByLength);

  return items.map((item) => ({
    ...item,
    stats: statsByNumber.get(item.number)
  }));
}

async function getWatchlistStatsByNumber(numbersByLength: Map<number, Set<string>>) {
  const statsByNumber = new Map<string, ApiWatchlistStatSummary>();
  const twoDigitNumbers = [...(numbersByLength.get(2) ?? [])];
  const threeDigitNumbers = [...(numbersByLength.get(3) ?? [])];
  const sixDigitNumbers = [...(numbersByLength.get(6) ?? [])];
  const sixDigitPrizeTypes = [
    "FIRST",
    "PRIZE2",
    "PRIZE3",
    "PRIZE4",
    "PRIZE5"
  ] as const satisfies readonly ApiWatchlistPrizeType[];

  await Promise.all([
    enrichStatsForPrizeType(statsByNumber, twoDigitNumbers, "TWO_DIGIT", 2),
    enrichStatsForPrizeType(statsByNumber, threeDigitNumbers, "THREE_DIGIT", 3),
    ...sixDigitPrizeTypes.map((prizeType) =>
      enrichStatsForPrizeType(statsByNumber, sixDigitNumbers, prizeType, 6)
    )
  ]);

  return statsByNumber;
}

async function enrichStatsForPrizeType(
  statsByNumber: Map<string, ApiWatchlistStatSummary>,
  numbers: readonly string[],
  prizeType: ApiWatchlistStatSummary["prizeType"],
  numberLength: 2 | 3 | 6
) {
  if (numbers.length === 0) {
    return;
  }

  const stats = await analyticsService.getNumberStats({
    lotteryType: "THAI_GOVERNMENT",
    numberLength,
    page: 1,
    pageSize: numberLength === 6 ? 5000 : 1000,
    prizeType,
    windowSize: 120
  });

  for (const stat of stats) {
    if (!numbers.includes(stat.number)) {
      continue;
    }

    const current = statsByNumber.get(stat.number);

    if (
      !current ||
      stat.hitCount > current.hitCount ||
      (stat.hitCount === current.hitCount && stat.frequencyPercent > current.frequencyPercent)
    ) {
      statsByNumber.set(stat.number, {
        frequencyPercent: stat.frequencyPercent,
        hitCount: stat.hitCount,
        lastSeenDrawDate: stat.lastSeenDrawDate,
        missingDrawCount: stat.missingDrawCount,
        prizeType
      });
    }
  }
}
