import { afterEach, describe, expect, test } from "bun:test";
import { calendarService } from "@/api/service/calendar.service";
import { calendarReadModelSchema } from "@/schema/app/calendar.schema";

afterEach(() => {
  delete (globalThis as { prisma?: unknown }).prisma;
});

describe("calendar.service", () => {
  test("maps recent draws, builds next draw rhythm, and includes monthly insights", async () => {
    const calls: unknown[] = [];

    (globalThis as { prisma?: unknown }).prisma = {
      lotteryDraw: {
        findMany: async (args: { include?: { prizes: boolean } }) => {
          calls.push(args);

          if (args.include?.prizes) {
            return [
              {
                drawDate: new Date("2026-04-16T00:00:00.000Z"),
                id: "draw-2",
                prizes: [
                  { number: "09", type: "TWO_DIGIT" },
                  { number: "12", type: "TWO_DIGIT" }
                ]
              },
              {
                drawDate: new Date("2026-04-01T00:00:00.000Z"),
                id: "draw-1",
                prizes: [
                  { number: "09", type: "TWO_DIGIT" },
                  { number: "01", type: "TWO_DIGIT" }
                ]
              }
            ];
          }

          return [
            {
              drawDate: new Date("2026-04-16T00:00:00.000Z"),
              drawNo: "08/2026",
              id: "draw-2"
            }
          ];
        }
      }
    };

    const response = await calendarService.getCalendarReadModel();

    expect(calls).toHaveLength(2);
    expect(calendarReadModelSchema.parse(response)).toEqual(response);
    expect(response.nextDraw.status).toBe("upcoming");
    expect(response.nextDraw.isNextDraw).toBe(true);
    expect(response.draws[0]).toEqual(response.nextDraw);
    expect(response.monthlyInsights.length).toBeGreaterThan(0);
  });

  test("returns a safe calendar read model when the database is empty", async () => {
    (globalThis as { prisma?: unknown }).prisma = {
      lotteryDraw: {
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
});
