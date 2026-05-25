import { afterEach, describe, expect, test } from "bun:test";
import { getDrawById, getDraws } from "@/api/service/draw.service";
import { drawDetailResponseSchema, drawListResponseSchema } from "@/schema/app/draw.schema";

afterEach(() => {
  delete (globalThis as { prisma?: unknown }).prisma;
});

describe("draw.service", () => {
  test("applies filters, pagination, and returns a schema-valid list response", async () => {
    const calls: { countWhere?: unknown; findManyArgs?: unknown } = {};

    (globalThis as { prisma?: unknown }).prisma = {
      lotteryDraw: {
        count: async ({ where }: { where: unknown }) => {
          calls.countWhere = where;
          return 3;
        },
        findMany: async (args: unknown) => {
          calls.findManyArgs = args;
          return [
            drawRecord("draw-1", "2026-04-16T00:00:00.000Z", "08/2026", [
              prizeRecord("p1", "123456", "FIRST"),
              prizeRecord("p2", "09", "TWO_DIGIT")
            ])
          ];
        }
      }
    };

    const response = await getDraws({
      endDate: "2026-04-30",
      lotteryType: "THAI_GOVERNMENT",
      month: 4,
      page: 2,
      pageSize: 2,
      prizeType: "TWO_DIGIT",
      q: "09",
      startDate: "2026-04-01",
      year: 2026
    });

    expect(calls.findManyArgs).toMatchObject({
      orderBy: { drawDate: "desc" },
      select: drawSelectMatcher(),
      skip: 2,
      take: 2,
      where: {
        OR: [{ drawNo: { contains: "09" } }, { prizes: { some: { number: { contains: "09" } } } }],
        drawDate: {
          gte: new Date("2026-04-01"),
          lte: new Date("2026-04-30")
        },
        lotteryType: "THAI_GOVERNMENT",
        prizes: {
          some: {
            type: "TWO_DIGIT"
          }
        }
      }
    });
    expect(calls.countWhere).toEqual((calls.findManyArgs as { where: unknown }).where);
    expect(drawListResponseSchema.parse(response)).toEqual(response);
    expect(response.pagination).toEqual({
      page: 2,
      pageSize: 2,
      total: 3,
      totalPages: 2
    });
  });

  test("returns draw detail by id and null when missing", async () => {
    let receivedId = "";
    let receivedArgs: unknown;

    (globalThis as { prisma?: unknown }).prisma = {
      lotteryDraw: {
        findUnique: async (args: { where: { id: string } }) => {
          receivedArgs = args;
          const { where } = args;
          receivedId = where.id;

          if (where.id === "missing") {
            return null;
          }

          return drawRecord("draw-1", "2026-04-16T00:00:00.000Z", "08/2026", [
            prizeRecord("p1", "123456", "FIRST")
          ]);
        }
      }
    };

    const detail = await getDrawById("draw-1");
    const missing = await getDrawById("missing");

    expect(receivedId).toBe("missing");
    expect(receivedArgs).toMatchObject({
      select: drawSelectMatcher(),
      where: {
        id: "missing"
      }
    });
    expect(detail && drawDetailResponseSchema.parse(detail)).toEqual(detail);
    expect(missing).toBeNull();
  });

  test("builds year and month range filters when explicit start/end are absent", async () => {
    let receivedWhere: unknown;

    (globalThis as { prisma?: unknown }).prisma = {
      lotteryDraw: {
        count: async () => 0,
        findMany: async ({ where }: { where: unknown }) => {
          receivedWhere = where;
          return [];
        }
      }
    };

    await getDraws({
      lotteryType: "THAI_GOVERNMENT",
      month: 4,
      page: 1,
      pageSize: 20,
      year: 2026
    });

    expect(receivedWhere).toEqual({
      drawDate: {
        gte: new Date(Date.UTC(2026, 3, 1)),
        lt: new Date(Date.UTC(2026, 4, 1))
      },
      lotteryType: "THAI_GOVERNMENT"
    });
  });
});

function drawRecord(
  id: string,
  drawDate: string,
  drawNo: string,
  prizes: ReturnType<typeof prizeRecord>[]
) {
  return {
    drawDate: new Date(drawDate),
    drawNo,
    id,
    lotteryType: "THAI_GOVERNMENT",
    prizes
  };
}

function prizeRecord(id: string, number: string, type: string) {
  return {
    id,
    number,
    position: undefined,
    type
  };
}

function drawSelectMatcher() {
  return {
    drawDate: true,
    drawNo: true,
    id: true,
    lotteryType: true,
    metadata: true,
    prizes: {
      select: {
        id: true,
        number: true,
        position: true,
        type: true
      }
    },
    publishedAt: true,
    sourceStatus: true,
    sourceUrl: true
  };
}
