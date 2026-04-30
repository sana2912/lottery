import { afterEach, describe, expect, test } from "bun:test";
import { analyticsService } from "@/api/service/analytics.service";
import {
  createWatchlistItem,
  deleteWatchlistItem,
  getWatchlist,
  updateWatchlistItem
} from "@/api/service/watchlist.service";
import {
  deleteWatchlistItemResponseSchema,
  watchlistItemSchema,
  watchlistReadModelSchema
} from "@/schema/app/watchlist.schema";

afterEach(() => {
  delete (globalThis as { prisma?: unknown }).prisma;
  mutableAnalyticsService.getNumberStats = originalGetNumberStats;
});

const mutableAnalyticsService = analyticsService as {
  getNumberStats: typeof analyticsService.getNumberStats;
};
const originalGetNumberStats = analyticsService.getNumberStats;

describe("watchlist.service", () => {
  test("lists items ordered by updatedAt desc and returns schema-valid read model", async () => {
    let receivedArgs: unknown;
    const numberStatsCalls: unknown[] = [];

    (globalThis as { prisma?: unknown }).prisma = {
      userWatchlistItem: {
        findMany: async (args: unknown) => {
          receivedArgs = args;
          return [
            watchItem("watch-1", "09", "MANUAL", ["hot"], undefined),
            watchItem("watch-2", "123456", "PREDICTION", ["six"], "tracked")
          ];
        }
      }
    };
    mutableAnalyticsService.getNumberStats = async (query) => {
      numberStatsCalls.push(query);

      if (query.prizeType === "TWO_DIGIT") {
        return [numberStat("09", "TWO_DIGIT", 2, 4, 12.5)];
      }

      if (query.prizeType === "PRIZE4") {
        return [numberStat("123456", "PRIZE4", 6, 2, 4)];
      }

      return [];
    };

    const response = await getWatchlist();

    expect(receivedArgs).toEqual({
      orderBy: {
        updatedAt: "desc"
      }
    });
    expect(numberStatsCalls).toEqual([
      {
        lotteryType: "THAI_GOVERNMENT",
        numberLength: 2,
        page: 1,
        pageSize: 1000,
        prizeType: "TWO_DIGIT",
        windowSize: 120
      },
      {
        lotteryType: "THAI_GOVERNMENT",
        numberLength: 6,
        page: 1,
        pageSize: 5000,
        prizeType: "FIRST",
        windowSize: 120
      },
      {
        lotteryType: "THAI_GOVERNMENT",
        numberLength: 6,
        page: 1,
        pageSize: 5000,
        prizeType: "PRIZE2",
        windowSize: 120
      },
      {
        lotteryType: "THAI_GOVERNMENT",
        numberLength: 6,
        page: 1,
        pageSize: 5000,
        prizeType: "PRIZE3",
        windowSize: 120
      },
      {
        lotteryType: "THAI_GOVERNMENT",
        numberLength: 6,
        page: 1,
        pageSize: 5000,
        prizeType: "PRIZE4",
        windowSize: 120
      },
      {
        lotteryType: "THAI_GOVERNMENT",
        numberLength: 6,
        page: 1,
        pageSize: 5000,
        prizeType: "PRIZE5",
        windowSize: 120
      }
    ]);
    expect(watchlistReadModelSchema.parse(response)).toEqual(response);
    expect(response.items[0]?.stats).toEqual({
      frequencyPercent: 12.5,
      hitCount: 4,
      lastSeenDrawDate: "2026-04-16T00:00:00.000Z",
      missingDrawCount: 3,
      prizeType: "TWO_DIGIT"
    });
    expect(response.items[1]?.stats).toEqual({
      frequencyPercent: 4,
      hitCount: 2,
      lastSeenDrawDate: "2026-04-16T00:00:00.000Z",
      missingDrawCount: 3,
      prizeType: "PRIZE4"
    });
  });

  test("creates, updates, and deletes watchlist items with the expected payloads", async () => {
    const calls: Record<string, unknown> = {};

    (globalThis as { prisma?: unknown }).prisma = {
      userWatchlistItem: {
        create: async (args: unknown) => {
          calls.create = args;
          return watchItem("watch-1", "09", "MANUAL", ["hot"], "note");
        },
        delete: async (args: unknown) => {
          calls.delete = args;
          return null;
        },
        update: async (args: unknown) => {
          calls.update = args;
          return watchItem("watch-1", "09", "PREDICTION", ["pair"], "updated");
        }
      }
    };

    const created = await createWatchlistItem({
      note: "note",
      number: "09",
      source: "MANUAL",
      tags: ["hot"]
    });
    const updated = await updateWatchlistItem("watch-1", {
      note: "updated",
      source: "PREDICTION",
      tags: ["pair"]
    });
    const deleted = await deleteWatchlistItem("watch-1");

    expect(calls.create).toEqual({
      data: {
        note: "note",
        number: "09",
        source: "MANUAL",
        tags: ["hot"]
      }
    });
    expect(calls.update).toEqual({
      data: {
        note: "updated",
        source: "PREDICTION",
        tags: ["pair"]
      },
      where: {
        id: "watch-1"
      }
    });
    expect(calls.delete).toEqual({
      where: {
        id: "watch-1"
      }
    });
    expect(watchlistItemSchema.parse(created)).toEqual(created);
    expect(watchlistItemSchema.parse(updated)).toEqual(updated);
    expect(deleteWatchlistItemResponseSchema.parse(deleted)).toEqual(deleted);
  });
});

function watchItem(
  id: string,
  number: string,
  source: "MANUAL" | "NOTEBOOK" | "PREDICTION",
  tags: string[],
  note: string | undefined
) {
  return {
    createdAt: new Date("2026-04-01T00:00:00.000Z"),
    id,
    note,
    number,
    source,
    tags,
    updatedAt: new Date("2026-04-29T00:00:00.000Z")
  };
}

function numberStat(
  number: string,
  prizeType: "FIRST" | "THREE_DIGIT" | "TWO_DIGIT" | "PRIZE2" | "PRIZE3" | "PRIZE4" | "PRIZE5",
  numberLength: 2 | 3 | 6,
  hitCount: number,
  frequencyPercent: number
) {
  return {
    computedAt: "2026-04-29T00:00:00.000Z",
    drawCount: 24,
    frequencyPercent,
    hitCount,
    lastSeenDrawDate: "2026-04-16T00:00:00.000Z",
    lotteryType: "THAI_GOVERNMENT" as const,
    missingDrawCount: 3,
    number,
    numberLength,
    patternFlags: [],
    prizeType,
    trendScore: 50,
    windowSize: 120
  };
}
