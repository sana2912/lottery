import { afterEach, describe, expect, test } from "bun:test";
import { analyticsService } from "@/api/service/analytics.service";
import { compareService } from "@/api/service/compare.service";
import { compareReadModelSchema } from "@/schema/app/compare.schema";

const mutableAnalyticsService = analyticsService as {
  getNumberStats: typeof analyticsService.getNumberStats;
};
const originalGetNumberStats = analyticsService.getNumberStats;

afterEach(() => {
  mutableAnalyticsService.getNumberStats = originalGetNumberStats;
  delete (globalThis as { prisma?: unknown }).prisma;
});

describe("compare.service", () => {
  test("scores unique candidate numbers, fills missing stats safely, and returns schema-valid output", async () => {
    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async () => []
    };

    mutableAnalyticsService.getNumberStats = async () => [
      stat("09", 12.5, 20, 80, ["odd", "high", "ascending"]),
      stat("11", 12.5, 20, 80, ["odd", "low", "double", "mirror"])
    ];

    const response = await compareService.compareNumbers({
      endDate: undefined,
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      numbers: ["09", "11", "11", "22", "  "],
      page: 1,
      pageSize: 20,
      prizeType: "TWO_DIGIT",
      q: undefined,
      startDate: undefined,
      strategyId: "balanced",
      windowSize: 120
    });

    expect(compareReadModelSchema.parse(response)).toEqual(response);
    expect(response.candidates.map((candidate) => candidate.number)).toEqual(["09", "11", "22"]);
    expect(response.candidates.at(-1)).toMatchObject({
      number: "22",
      numberLength: 2,
      reasons: expect.any(Array)
    });
    expect(response.sampleSize).toBe(24);
    expect(response.strongestSignal).toBeTruthy();
  });

  test("uses filtered number snapshot stats when the compare query matches a cached context", async () => {
    const queryCalls: string[] = [];
    let fallbackCalled = false;

    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async (...args: unknown[]) => {
        const sql = getSqlText(args[0]);
        queryCalls.push(sql);

        if (sql.includes('FROM "analysis_snapshot_runs"')) {
          return [
            {
              runId: "00000000-0000-7000-8000-000000000001",
              sampleDrawCount: 50,
              samplePrizeCount: 120,
              windowSize: 50
            }
          ];
        }

        if (sql.includes('FROM "analysis_number_stats"')) {
          return [
            {
              averageGap: null,
              computedAt: new Date("2026-04-29T00:00:00.000Z"),
              drawCount: 50,
              frequencyPercent: 2.5,
              hitCount: 3,
              lastSeenDrawDate: new Date("2026-04-16T00:00:00.000Z"),
              lotteryType: "THAI_GOVERNMENT",
              maxGap: null,
              missingDrawCount: 4,
              number: "09",
              numberLength: 2,
              patternFlags: ["odd", "high"],
              prizeType: "TWO_DIGIT",
              trendScore: 42
            }
          ];
        }

        return [];
      }
    };
    mutableAnalyticsService.getNumberStats = async () => {
      fallbackCalled = true;
      return [];
    };

    const response = await compareService.compareNumbers({
      endDate: undefined,
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      numbers: ["09", "22"],
      page: 1,
      pageSize: 20,
      prizeType: "TWO_DIGIT",
      q: undefined,
      startDate: undefined,
      strategyId: "balanced",
      windowSize: 120
    });

    expect(fallbackCalled).toBe(false);
    expect(queryCalls.some((sql) => sql.includes('"analyticsReadModel"'))).toBe(false);
    expect(queryCalls.some((sql) => sql.includes('"number" IN'))).toBe(true);
    expect(response.sampleSize).toBe(120);
    expect(response.candidates.map((candidate) => candidate.number).sort()).toEqual(["09", "22"]);
  });
});

function stat(
  number: string,
  frequencyPercent: number,
  missingDrawCount: number,
  trendScore: number,
  patternFlags: ("odd" | "even" | "high" | "low" | "double" | "ascending" | "mirror")[]
) {
  return {
    computedAt: "2026-04-29T00:00:00.000Z",
    drawCount: 24,
    frequencyPercent,
    hitCount: 3,
    lotteryType: "THAI_GOVERNMENT",
    missingDrawCount,
    number,
    numberLength: 2,
    patternFlags,
    prizeType: "TWO_DIGIT",
    trendScore,
    windowSize: 120
  };
}

function getSqlText(template: unknown) {
  return Array.isArray(template) ? template.join("?") : String(template);
}
