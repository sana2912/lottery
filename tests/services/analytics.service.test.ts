import { afterEach, describe, expect, test } from "bun:test";
import {
  getAnalyticsReadModel,
  getDigitStats,
  getNumberStats
} from "@/api/service/analytics.service";
import { analyticsReadModelSchema } from "@/schema/app/analytics.schema";

afterEach(() => {
  delete (globalThis as { prisma?: unknown }).prisma;
});

describe("analytics.service", () => {
  test("returns analysis snapshot stats when a cached context exists", async () => {
    const queryCalls: string[] = [];
    const analyticsReadModel = {
      digitStats: [
        {
          computedAt: "2026-04-29T00:00:00.000Z",
          digit: "0",
          drawCount: 50,
          frequencyPercent: 20,
          hitCount: 10,
          lastSeenDrawDate: "2026-04-16T00:00:00.000Z",
          lotteryType: "THAI_GOVERNMENT",
          missingDrawCount: 1,
          position: 1,
          prizeType: "TWO_DIGIT",
          trendDirection: "up",
          windowSize: 50
        }
      ],
      generatedAt: "2026-04-29T00:00:00.000Z",
      numberStats: [
        {
          averageGap: 15,
          computedAt: "2026-04-29T00:00:00.000Z",
          drawCount: 50,
          frequencyPercent: 8,
          hitCount: 4,
          lastSeenDrawDate: "2026-04-16T00:00:00.000Z",
          lotteryType: "THAI_GOVERNMENT",
          maxGap: 21,
          missingDrawCount: 1,
          number: "09",
          numberLength: 2,
          patternFlags: ["odd", "high"],
          prizeType: "TWO_DIGIT",
          trendScore: 39.33,
          windowSize: 50
        }
      ],
      patternSummaries: [],
      source: "api",
      summary: {
        drawCount: 50,
        generatedAt: "2026-04-29T00:00:00.000Z"
      }
    };

    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async (...args: unknown[]) => {
        const sql = getSqlText(args[0]);
        queryCalls.push(sql);

        if (sql.includes('FROM "analysis_snapshot_runs"')) {
          return [
            {
              analyticsReadModel,
              calendarReadModel: null,
              computedAt: new Date("2026-04-29T00:00:00.000Z"),
              patternReadModel: null
            }
          ];
        }

        return [];
      }
    };

    const model = await getAnalyticsReadModel({
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      page: 1,
      pageSize: 20,
      prizeType: "TWO_DIGIT",
      windowPreset: "50",
      windowSize: 50
    });

    expect(queryCalls.some((sql) => sql.includes('FROM "analysis_snapshot_runs"'))).toBe(true);
    expect(analyticsReadModelSchema.parse(model)).toEqual(model);
    expect(model.summary.drawCount).toBe(50);
    expect(model.numberStats[0]?.number).toBe("09");
  });

  test("queries the expected prize window and returns a schema-valid read model", async () => {
    let drawArgsSeen: unknown;
    let prizeArgsSeen: unknown;

    (globalThis as { prisma?: unknown }).prisma = {
      lotteryDraw: {
        findMany: async (args: unknown) => {
          drawArgsSeen = args;
          return [
            {
              drawDate: new Date("2026-04-16T00:00:00.000Z"),
              id: "draw-2",
              lotteryType: "THAI_GOVERNMENT"
            },
            {
              drawDate: new Date("2026-04-01T00:00:00.000Z"),
              id: "draw-1",
              lotteryType: "THAI_GOVERNMENT"
            }
          ];
        }
      },
      lotteryPrize: {
        findMany: async (args: unknown) => {
          prizeArgsSeen = args;
          return [
            prize("draw-2", "2026-04-16T00:00:00.000Z", "09", "TWO_DIGIT"),
            prize("draw-1", "2026-04-01T00:00:00.000Z", "11", "TWO_DIGIT")
          ];
        }
      }
    };

    const query = {
      endDate: "2026-04-30",
      lotteryType: "THAI_GOVERNMENT" as const,
      numberLength: 2 as const,
      page: 1,
      pageSize: 20,
      prizeType: "TWO_DIGIT" as const,
      startDate: "2026-04-01",
      windowSize: 50
    };
    const model = await getAnalyticsReadModel(query);

    expect(drawArgsSeen).toMatchObject({
      orderBy: {
        drawDate: "desc"
      },
      take: 50,
      where: {
        drawDate: {
          gte: new Date("2026-04-01"),
          lte: new Date("2026-04-30")
        },
        lotteryType: "THAI_GOVERNMENT"
      }
    });
    expect(prizeArgsSeen).toMatchObject({
      orderBy: [
        { drawId: "asc" },
        {
          position: "asc"
        },
        {
          number: "asc"
        }
      ],
      where: {
        drawId: {
          in: ["draw-2", "draw-1"]
        },
        type: "TWO_DIGIT"
      }
    });
    expect(analyticsReadModelSchema.parse(model)).toEqual(model);
    expect(model.summary.drawCount).toBe(2);
    expect(model.numberStats).toHaveLength(2);
    expect((await getDigitStats(query)).map((stat) => stat.digit)).toEqual(
      model.digitStats.map((stat) => stat.digit)
    );
    expect((await getNumberStats(query)).map((stat) => stat.number)).toEqual(
      model.numberStats.map((stat) => stat.number)
    );
  });

  test("returns an empty safe read model when no prizes match", async () => {
    (globalThis as { prisma?: unknown }).prisma = {
      lotteryDraw: {
        findMany: async () => []
      },
      lotteryPrize: {
        findMany: async () => []
      }
    };

    const model = await getAnalyticsReadModel({
      lotteryType: "THAI_GOVERNMENT",
      page: 1,
      pageSize: 20,
      windowSize: 20
    });

    expect(analyticsReadModelSchema.parse(model)).toEqual(model);
    expect(model.summary.drawCount).toBe(0);
    expect(model.digitStats).toEqual([]);
    expect(model.numberStats).toEqual([]);
    expect(model.patternSummaries).toEqual([]);
  });

  test("supports grouped six-digit analysis without treating it as a raw prize type", async () => {
    let prizeArgsSeen: unknown;

    (globalThis as { prisma?: unknown }).prisma = {
      lotteryDraw: {
        findMany: async () => [
          {
            drawDate: new Date("2026-04-16T00:00:00.000Z"),
            id: "draw-2",
            lotteryType: "THAI_GOVERNMENT"
          },
          {
            drawDate: new Date("2026-04-01T00:00:00.000Z"),
            id: "draw-1",
            lotteryType: "THAI_GOVERNMENT"
          }
        ]
      },
      lotteryPrize: {
        findMany: async (args: unknown) => {
          prizeArgsSeen = args;
          return [
            prize("draw-2", "2026-04-16T00:00:00.000Z", "123456", "FIRST"),
            prize("draw-2", "2026-04-16T00:00:00.000Z", "654321", "PRIZE2"),
            prize("draw-1", "2026-04-01T00:00:00.000Z", "222222", "PRIZE5")
          ];
        }
      }
    };

    const model = await getAnalyticsReadModel({
      endDate: "2026-04-30",
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 6,
      page: 1,
      pageSize: 20,
      prizeType: "SIX_DIGIT_ALL",
      startDate: "2026-04-01",
      windowSize: 20
    });

    expect(prizeArgsSeen).toMatchObject({
      where: {
        type: {
          in: ["FIRST", "NEAR_FIRST", "PRIZE2", "PRIZE3", "PRIZE4", "PRIZE5"]
        }
      }
    });
    expect(model.numberStats.every((stat) => stat.prizeType === "SIX_DIGIT_ALL")).toBe(true);
    expect(model.digitStats.every((stat) => stat.prizeType === "SIX_DIGIT_ALL")).toBe(true);
  });

  test("limits analytics by distinct draws instead of raw prize row count", async () => {
    let drawArgsSeen: unknown;
    let prizeArgsSeen: unknown;

    (globalThis as { prisma?: unknown }).prisma = {
      lotteryDraw: {
        findMany: async (args: unknown) => {
          drawArgsSeen = args;
          return [
            {
              drawDate: new Date("2026-04-16T00:00:00.000Z"),
              id: "draw-3",
              lotteryType: "THAI_GOVERNMENT"
            },
            {
              drawDate: new Date("2026-04-01T00:00:00.000Z"),
              id: "draw-2",
              lotteryType: "THAI_GOVERNMENT"
            }
          ];
        }
      },
      lotteryPrize: {
        findMany: async (args: unknown) => {
          prizeArgsSeen = args;
          return [
            prize("draw-3", "2026-04-16T00:00:00.000Z", "111", "THREE_DIGIT"),
            prize("draw-3", "2026-04-16T00:00:00.000Z", "222", "THREE_DIGIT"),
            prize("draw-2", "2026-04-01T00:00:00.000Z", "333", "THREE_DIGIT"),
            prize("draw-2", "2026-04-01T00:00:00.000Z", "444", "THREE_DIGIT")
          ];
        }
      }
    };

    const model = await getAnalyticsReadModel({
      lotteryType: "THAI_GOVERNMENT",
      page: 1,
      pageSize: 20,
      prizeType: "THREE_DIGIT",
      windowSize: 2
    });

    expect(drawArgsSeen).toMatchObject({ take: 2 });
    expect(prizeArgsSeen).toMatchObject({
      where: {
        drawId: {
          in: ["draw-3", "draw-2"]
        },
        type: "THREE_DIGIT"
      }
    });
    expect(model.summary.drawCount).toBe(2);
    expect(model.numberStats).toHaveLength(4);
  });

  test("falls back to direct analytics when analysis snapshots do not cover a query", async () => {
    let drawArgsSeen: unknown;

    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async () => [],
      lotteryDraw: {
        findMany: async (args: unknown) => {
          drawArgsSeen = args;
          return [
            {
              drawDate: new Date("2026-04-16T00:00:00.000Z"),
              id: "draw-2",
              lotteryType: "THAI_GOVERNMENT"
            }
          ];
        }
      },
      lotteryPrize: {
        findMany: async () => [prize("draw-2", "2026-04-16T00:00:00.000Z", "09", "TWO_DIGIT")]
      }
    };

    const model = await getAnalyticsReadModel({
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      page: 1,
      pageSize: 20,
      prizeType: "TWO_DIGIT",
      windowSize: 30
    });

    expect(drawArgsSeen).toMatchObject({ take: 30 });
    expect(model.numberStats[0]?.number).toBe("09");
  });

  test("caps analytics windows at the current date when no end date is provided", async () => {
    let drawArgsSeen: unknown;

    (globalThis as { prisma?: unknown }).prisma = {
      lotteryDraw: {
        findMany: async (args: unknown) => {
          drawArgsSeen = args;
          return [];
        }
      },
      lotteryPrize: {
        findMany: async () => []
      }
    };

    await getAnalyticsReadModel({
      lotteryType: "THAI_GOVERNMENT",
      page: 1,
      pageSize: 20,
      windowSize: 20
    });

    expect(drawArgsSeen).toMatchObject({
      where: {
        drawDate: {
          lte: expect.any(Date)
        },
        lotteryType: "THAI_GOVERNMENT"
      }
    });
  });
});

function prize(drawId: string, drawDate: string, number: string, type: string) {
  return {
    draw: {
      drawDate: new Date(drawDate),
      lotteryType: "THAI_GOVERNMENT"
    },
    drawId,
    id: `${drawId}-${number}`,
    number,
    type
  };
}

function getSqlText(template: unknown) {
  return Array.isArray(template) ? template.join("?") : String(template);
}
