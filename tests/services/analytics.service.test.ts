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
          samplePrizeCount: 4,
          trendScore: 39.33,
          windowSize: 50
        }
      ],
      patternSummaries: [],
      source: "api",
      summary: {
        drawCount: 50,
        generatedAt: "2026-04-29T00:00:00.000Z",
        prizeCount: 4
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
              sampleDrawCount: 50,
              samplePrizeCount: 4,
              windowSize: 50
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
      windowPreset: "ALL"
    });

    expect(queryCalls.some((sql) => sql.includes('FROM "analysis_snapshot_runs"'))).toBe(true);
    expect(queryCalls.some((sql) => sql.includes("engineVersion"))).toBe(true);
    expect(model.source).toBe("snapshot");
    expect(analyticsReadModelSchema.parse(model)).toEqual(model);
    expect(model.summary.drawCount).toBe(50);
    expect(model.numberStats[0]?.number).toBe("09");
  });

  test("reads digit stats from derived snapshot rows without loading analytics JSON", async () => {
    const queryCalls: string[] = [];

    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async (...args: unknown[]) => {
        const sql = getSqlText(args[0]);
        queryCalls.push(sql);

        if (sql.includes('FROM "analysis_snapshot_runs"')) {
          return [
            {
              runId: "00000000-0000-7000-8000-000000000001",
              sampleDrawCount: 50,
              samplePrizeCount: 4,
              windowSize: 50
            }
          ];
        }

        if (sql.includes('FROM "analysis_digit_stats"')) {
          return [
            {
              computedAt: new Date("2026-04-29T00:00:00.000Z"),
              digit: "0",
              drawCount: 50,
              frequencyPercent: 20,
              hitCount: 10,
              lastSeenDrawDate: new Date("2026-04-16T00:00:00.000Z"),
              lotteryType: "THAI_GOVERNMENT",
              missingDrawCount: 1,
              position: 1,
              prizeType: "TWO_DIGIT",
              trendDirection: "up"
            }
          ];
        }

        return [];
      }
    };

    const stats = await getDigitStats({
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      page: 1,
      pageSize: 20,
      prizeType: "TWO_DIGIT",
      windowPreset: "ALL"
    });

    expect(queryCalls.some((sql) => sql.includes('"analyticsReadModel"'))).toBe(false);
    expect(queryCalls.some((sql) => sql.includes('FROM "analysis_digit_stats"'))).toBe(true);
    expect(stats).toEqual([
      {
        computedAt: "2026-04-29T00:00:00.000Z",
        digit: "0",
        drawCount: 50,
        expectedFrequencyPercent: 10,
        frequencyPercent: 20,
        hitCount: 10,
        lastSeenDrawDate: "2026-04-16T00:00:00.000Z",
        lift: 2,
        lotteryType: "THAI_GOVERNMENT",
        missingDrawCount: 1,
        position: 1,
        prizeType: "TWO_DIGIT",
        sampleEventCount: 50,
        trendDirection: "up",
        windowSize: 50
      }
    ]);
  });

  test("reads number stats from derived snapshot rows without loading analytics JSON", async () => {
    const queryCalls: string[] = [];

    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async (...args: unknown[]) => {
        const sql = getSqlText(args[0]);
        queryCalls.push(sql);

        if (sql.includes('FROM "analysis_snapshot_runs"')) {
          return [
            {
              runId: "00000000-0000-7000-8000-000000000001",
              sampleDrawCount: 50,
              samplePrizeCount: 4,
              windowSize: 50
            }
          ];
        }

        if (sql.includes('FROM "analysis_number_stats"')) {
          return [
            {
              averageGap: 15,
              computedAt: new Date("2026-04-29T00:00:00.000Z"),
              drawCount: 50,
              frequencyPercent: 8,
              hitCount: 4,
              lastSeenDrawDate: new Date("2026-04-16T00:00:00.000Z"),
              lotteryType: "THAI_GOVERNMENT",
              maxGap: 21,
              missingDrawCount: 1,
              number: "09",
              numberLength: 2,
              patternFlags: ["odd", "high"],
              prizeType: "TWO_DIGIT",
              trendScore: 39.33
            }
          ];
        }

        return [];
      }
    };

    const stats = await getNumberStats({
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      page: 1,
      pageSize: 20,
      prizeType: "TWO_DIGIT",
      windowPreset: "ALL"
    });

    expect(queryCalls.some((sql) => sql.includes('"analyticsReadModel"'))).toBe(false);
    expect(queryCalls.some((sql) => sql.includes('FROM "analysis_number_stats"'))).toBe(true);
    expect(stats[0]).toMatchObject({
      frequencyPerDrawPercent: 8,
      frequencyPerPrizeRowPercent: 8,
      number: "09",
      samplePrizeCount: 4,
      windowSize: 50
    });
  });

  test("falls back on-demand when snapshot metadata is stale", async () => {
    const queryCalls: string[] = [];
    const staleAnalyticsReadModel = {
      digitStats: [],
      generatedAt: "2026-04-29T00:00:00.000Z",
      numberStats: [],
      patternSummaries: [],
      source: "api",
      summary: {
        drawCount: 50,
        generatedAt: "2026-04-29T00:00:00.000Z",
        prizeCount: 50
      }
    };

    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async (...args: unknown[]) => {
        const sql = getSqlText(args[0]);
        queryCalls.push(sql);

        if (sql.includes('FROM "analysis_snapshot_runs"')) {
          return [
            {
              analyticsReadModel: staleAnalyticsReadModel,
              sampleDrawCount: 2,
              samplePrizeCount: 2,
              windowSize: 2
            }
          ];
        }

        if (sql.includes("SELECT DISTINCT")) {
          return [
            {
              drawDate: new Date("2026-04-01T00:00:00.000Z"),
              id: "draw-1",
              lotteryType: "THAI_GOVERNMENT"
            },
            {
              drawDate: new Date("2026-04-16T00:00:00.000Z"),
              id: "draw-2",
              lotteryType: "THAI_GOVERNMENT"
            }
          ];
        }

        return [
          {
            drawDate: new Date("2026-04-01T00:00:00.000Z"),
            drawId: "draw-1",
            lotteryType: "THAI_GOVERNMENT",
            number: "09",
            position: 1,
            type: "TWO_DIGIT"
          },
          {
            drawDate: new Date("2026-04-16T00:00:00.000Z"),
            drawId: "draw-2",
            lotteryType: "THAI_GOVERNMENT",
            number: "11",
            position: 1,
            type: "TWO_DIGIT"
          }
        ];
      }
    };

    const model = await getAnalyticsReadModel({
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      page: 1,
      pageSize: 20,
      prizeType: "TWO_DIGIT",
      windowPreset: "ALL"
    });

    expect(queryCalls.some((sql) => sql.includes("SELECT DISTINCT"))).toBe(true);
    expect(model.source).toBe("on-demand");
    expect(model.summary.drawCount).toBe(2);
    expect(model.summary.prizeCount).toBe(2);
    expect(model.numberStats.map((stat) => stat.number).sort()).toEqual(["09", "11"]);
  });

  test("returns an empty safe read model when query is outside snapshot context", async () => {
    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async () => []
    };

    const model = await getAnalyticsReadModel({
      endDate: "2026-04-30",
      lotteryType: "THAI_GOVERNMENT",
      page: 1,
      pageSize: 20,
      prizeType: "TWO_DIGIT",
      startDate: "2026-04-01"
    });

    expect(analyticsReadModelSchema.parse(model)).toEqual(model);
    expect(model.source).toBe("empty");
    expect(model.summary.drawCount).toBe(0);
    expect(model.digitStats).toEqual([]);
    expect(model.numberStats).toEqual([]);
    expect(model.patternSummaries).toEqual([]);
  });

  test("uses on-demand resolveAnalysisSample when snapshot misses eligible context", async () => {
    const queryCalls: string[] = [];

    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async (...args: unknown[]) => {
        const sql = getSqlText(args[0]);
        queryCalls.push(sql);

        if (sql.includes('FROM "analysis_snapshot_runs"')) {
          return [];
        }

        if (sql.includes("SELECT DISTINCT")) {
          return [
            {
              drawDate: new Date("2026-04-16T00:00:00.000Z"),
              id: "draw-2",
              lotteryType: "THAI_GOVERNMENT"
            }
          ];
        }

        return [
          {
            drawDate: new Date("2026-04-16T00:00:00.000Z"),
            drawId: "draw-2",
            lotteryType: "THAI_GOVERNMENT",
            number: "09",
            position: 1,
            type: "TWO_DIGIT"
          }
        ];
      }
    };

    const model = await getAnalyticsReadModel({
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      page: 1,
      pageSize: 20,
      prizeType: "TWO_DIGIT",
      windowPreset: "ALL"
    });

    expect(queryCalls.some((sql) => sql.includes("SELECT DISTINCT"))).toBe(true);
    expect(model.source).toBe("on-demand");
    expect(model.summary.drawCount).toBe(1);
    expect(model.numberStats[0]?.number).toBe("09");
    expect(
      (
        await getDigitStats({
          lotteryType: "THAI_GOVERNMENT",
          numberLength: 2,
          page: 1,
          pageSize: 20,
          prizeType: "TWO_DIGIT",
          windowPreset: "ALL"
        })
      ).length
    ).toBeGreaterThan(0);
    expect(
      (
        await getNumberStats({
          lotteryType: "THAI_GOVERNMENT",
          numberLength: 2,
          page: 1,
          pageSize: 20,
          prizeType: "TWO_DIGIT",
          windowPreset: "ALL"
        })
      )[0]?.number
    ).toBe("09");
  });

  test("returns empty read model when query uses date range outside snapshot context", async () => {
    const model = await getAnalyticsReadModel({
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      page: 1,
      pageSize: 20,
      prizeType: "TWO_DIGIT",
      startDate: "2026-01-01"
    });

    expect(model.source).toBe("empty");
  });
});

function getSqlText(template: unknown) {
  return Array.isArray(template) ? template.join("?") : String(template);
}
