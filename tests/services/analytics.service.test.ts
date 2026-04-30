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
  test("queries the expected prize window and returns a schema-valid read model", async () => {
    let drawArgsSeen: unknown;
    let prizeArgsSeen: unknown;

    (globalThis as { prisma?: unknown }).prisma = {
      lotteryDraw: {
        findMany: async (args: unknown) => {
          drawArgsSeen = args;
          return [{ id: "draw-2" }, { id: "draw-1" }];
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
      include: { draw: true },
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

  test("limits analytics by distinct draws instead of raw prize row count", async () => {
    let drawArgsSeen: unknown;
    let prizeArgsSeen: unknown;

    (globalThis as { prisma?: unknown }).prisma = {
      lotteryDraw: {
        findMany: async (args: unknown) => {
          drawArgsSeen = args;
          return [{ id: "draw-3" }, { id: "draw-2" }];
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
