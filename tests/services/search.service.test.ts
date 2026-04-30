import { afterEach, describe, expect, test } from "bun:test";
import { analyticsService } from "@/api/service/analytics.service";
import { searchService } from "@/api/service/search.service";
import { searchReadModelSchema } from "@/schema/app/search.schema";

const mutableAnalyticsService = analyticsService as {
  getNumberStats: typeof analyticsService.getNumberStats;
};
const originalGetNumberStats = analyticsService.getNumberStats;

afterEach(() => {
  delete (globalThis as { prisma?: unknown }).prisma;
  mutableAnalyticsService.getNumberStats = originalGetNumberStats;
});

describe("search.service", () => {
  test("returns grouped search results from draws, prizes, stats, and watchlist", async () => {
    mutableAnalyticsService.getNumberStats = async () => [
      {
        computedAt: "2026-04-29T00:00:00.000Z",
        drawCount: 24,
        frequencyPercent: 12.5,
        hitCount: 3,
        lastSeenDrawDate: "2026-04-16T00:00:00.000Z",
        lotteryType: "THAI_GOVERNMENT",
        missingDrawCount: 2,
        number: "09",
        numberLength: 2,
        patternFlags: [],
        prizeType: "TWO_DIGIT",
        trendScore: 50,
        windowSize: 120
      }
    ];
    (globalThis as { prisma?: unknown }).prisma = {
      lotteryDraw: {
        findMany: async () => [
          {
            drawDate: new Date("2026-04-16T00:00:00.000Z"),
            drawNo: "08/2026",
            id: "draw-1",
            sourceStatus: "VERIFIED"
          }
        ]
      },
      lotteryPrize: {
        findMany: async () => [
          {
            draw: {
              drawDate: new Date("2026-04-16T00:00:00.000Z"),
              drawNo: "08/2026"
            },
            drawId: "draw-1",
            id: "prize-1",
            number: "09",
            type: "TWO_DIGIT"
          }
        ]
      },
      userWatchlistItem: {
        findMany: async () => [
          {
            id: "watch-1",
            note: "keep",
            number: "09",
            source: "MANUAL",
            tags: ["hot"],
            updatedAt: new Date("2026-04-29T00:00:00.000Z")
          }
        ]
      }
    };

    const response = await searchService.search({
      endDate: undefined,
      lotteryType: "THAI_GOVERNMENT",
      month: undefined,
      page: 1,
      pageSize: 20,
      q: "09",
      startDate: undefined,
      year: undefined
    });

    expect(searchReadModelSchema.parse(response)).toEqual(response);
    expect(response.groups.draws[0]?.id).toBe("draw-1");
    expect(response.groups.prizes[0]?.number).toBe("09");
    expect(response.groups.stats[0]?.number).toBe("09");
    expect(response.groups.watchlist[0]?.id).toBe("watch-1");
  });
});
