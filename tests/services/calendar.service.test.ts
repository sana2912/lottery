import { afterEach, describe, expect, test } from "bun:test";
import { calendarService } from "@/api/service/calendar.service";
import { calendarHeatmapQuerySchema, calendarReadModelSchema } from "@/schema/app/calendar.schema";

afterEach(() => {
  delete (globalThis as { prisma?: unknown }).prisma;
});

describe("calendar.service", () => {
  test("maps recent draws, uses future persisted draws as next draw, and includes monthly insights", async () => {
    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async (...args: unknown[]) => {
        const sql = getSqlText(args[0]);

        if (sql.includes("analysis_snapshot_runs")) {
          return [];
        }

        if (sql.includes("SELECT DISTINCT")) {
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

        return [
          {
            drawDate: new Date("2026-04-16T00:00:00.000Z"),
            drawId: "draw-2",
            lotteryType: "THAI_GOVERNMENT",
            number: "123456",
            position: null,
            type: "FIRST"
          },
          {
            drawDate: new Date("2026-04-16T00:00:00.000Z"),
            drawId: "draw-2",
            lotteryType: "THAI_GOVERNMENT",
            number: "654321",
            position: null,
            type: "FIRST"
          },
          {
            drawDate: new Date("2026-04-01T00:00:00.000Z"),
            drawId: "draw-1",
            lotteryType: "THAI_GOVERNMENT",
            number: "111111",
            position: null,
            type: "FIRST"
          },
          {
            drawDate: new Date("2026-04-01T00:00:00.000Z"),
            drawId: "draw-1",
            lotteryType: "THAI_GOVERNMENT",
            number: "222222",
            position: null,
            type: "FIRST"
          }
        ];
      },
      lotteryDraw: {
        findFirst: async () => ({
          drawDate: new Date("2026-05-02T00:00:00.000Z"),
          drawNo: "09/2026",
          id: "draw-3"
        }),
        findMany: async () => [
          {
            drawDate: new Date("2026-04-16T00:00:00.000Z"),
            drawNo: "08/2026",
            id: "draw-2"
          }
        ]
      }
    };

    const response = await calendarService.getCalendarReadModel({
      month: 4,
      prizeType: "FIRST",
      windowPreset: "ALL",
      year: 2026
    });

    expect(calendarReadModelSchema.parse(response)).toEqual(response);
    expect(response.nextDraw.status).toBe("upcoming");
    expect(response.nextDraw.isNextDraw).toBe(true);
    expect(response.draws[0]).toEqual(response.nextDraw);
    expect(response.nextDraw.id).toBe("draw-3");
    expect(response.draws.some((draw) => draw.id === "draw-3" && draw.status === "past")).toBe(
      false
    );
    expect(response.monthlyInsights.length).toBeGreaterThan(0);
    expect(response.monthlyInsights[0]?.drawCount).toBe(2);
    expect(response.monthlyInsights[0]?.heatmapRows).toHaveLength(6);
    expect(response.monthlyInsights[0]?.heatmapRows[0]?.cells).toHaveLength(10);
    expect(response.monthlyInsights[0]?.heatmapRows[0]?.cells[0]).toMatchObject({
      appearanceCount: expect.any(Number),
      digit: expect.any(String),
      hitCount: expect.any(Number),
      missingRounds: expect.any(Number),
      opportunityCount: expect.any(Number),
      score: expect.any(Number),
      tone: expect.any(String)
    });
  });

  test("returns a safe calendar read model when the database is empty", async () => {
    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async () => [],
      lotteryDraw: {
        findFirst: async () => null,
        findMany: async () => []
      }
    };

    const response = await calendarService.getCalendarReadModel();

    expect(calendarReadModelSchema.parse(response)).toEqual(response);
    expect(response.draws).toHaveLength(1);
    expect(response.draws[0]).toEqual(response.nextDraw);
    expect(response.monthlyInsights).toEqual([]);
    expect(response.nextDraw.status).toBe("upcoming");
  });

  test("normalizes SIX_DIGIT_ALL out of calendar queries", () => {
    const parsed = calendarHeatmapQuerySchema.parse({
      prizeType: "SIX_DIGIT_ALL"
    });

    expect(parsed.prizeType).toBeUndefined();
  });
});

function getSqlText(value: unknown) {
  if (!value || typeof value !== "object") {
    return "";
  }

  if ("strings" in value && Array.isArray((value as { strings: string[] }).strings)) {
    return (value as { strings: string[] }).strings.join(" ");
  }

  return String(value);
}
