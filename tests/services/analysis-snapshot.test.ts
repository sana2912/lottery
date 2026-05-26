import { afterEach, describe, expect, test } from "bun:test";
import { createAnalysisContext } from "@/api/service/analysis-snapshot/analysis-context";
import { buildAnalysisCalendarHeatmapReadModel } from "@/api/service/analysis-snapshot/calendar-heatmap-read-model";
import { recomputeAnalysisSnapshot } from "@/api/service/analysis-snapshot/compute-analysis-snapshot";
import { buildOnDemandAnalysisReadModel } from "@/api/service/analysis-snapshot/on-demand-read-model";
import { buildAnalysisPatternReadModel } from "@/api/service/analysis-snapshot/pattern-read-model";
import { resolveAnalysisSample } from "@/api/service/analysis-snapshot/sample-resolver";
import {
  getAnalysisSnapshotDigitStats,
  getAnalysisSnapshotNumberStats,
  getAnalysisSnapshotNumberStatsForNumbers,
  getAnalysisSnapshotPatternReadModel
} from "@/api/service/analysis-snapshot/snapshot-reader";
import type { ApiAnalyticsReadModel } from "@/schema/api/analytics";

afterEach(() => {
  delete (globalThis as { prisma?: unknown }).prisma;
});

describe("analysis snapshot engine", () => {
  test("resolves monthly samples, preserves prize type, and skips invalid number lengths", async () => {
    const queryCalls: string[] = [];

    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async (...args: unknown[]) => {
        const sql = getSqlText(args[0]);
        queryCalls.push(sql);

        if (sql.includes("SELECT DISTINCT")) {
          return drawRows();
        }

        return prizeRows();
      }
    };

    const sample = await resolveAnalysisSample(
      createAnalysisContext({
        month: 4,
        prizeType: "TWO_DIGIT",
        scope: "MONTH"
      })
    );

    expect(queryCalls[0]).toContain('prize."type" IN');
    expect(queryCalls[0]).toContain("AND (?)");
    expect(queryCalls[1]).toContain('prize."drawId" IN');
    expect(sample.drawCount).toBe(2);
    expect(sample.prizeCount).toBe(3);
    expect(sample.invalidPrizeCount).toBe(1);
    expect(sample.prizes.map((prize) => prize.number)).toEqual(["09", "11", "22"]);
  });

  test("resolves grouped six-digit samples from all six-digit prize sources", async () => {
    const queryCalls: string[] = [];

    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async (...args: unknown[]) => {
        const sql = getSqlText(args[0]);
        queryCalls.push(sql);

        if (sql.includes("SELECT DISTINCT")) {
          return drawRows();
        }

        return sixDigitPrizeRows();
      }
    };

    const sample = await resolveAnalysisSample(
      createAnalysisContext({
        prizeType: "SIX_DIGIT_ALL",
        scope: "ALL_TIME"
      })
    );

    expect(queryCalls[0]).toContain('prize."type" IN');
    expect(sample.prizeCount).toBe(3);
    expect(sample.invalidPrizeCount).toBe(1);
    expect(sample.prizes.map((prize) => prize.type)).toEqual([
      "SIX_DIGIT_ALL",
      "SIX_DIGIT_ALL",
      "SIX_DIGIT_ALL"
    ]);
    expect(sample.prizes.map((prize) => prize.number)).toEqual(["123456", "654321", "222222"]);
  });

  test("builds pattern and calendar read models from the same sample shape", () => {
    const analytics = analyticsReadModel();
    const patternReadModel = buildAnalysisPatternReadModel(analytics);
    const calendarPrizes = prizeRows()
      .filter((prize) => prize.number.length === 2)
      .map((prize) => ({
        draw: {
          drawDate: prize.drawDate,
          lotteryType: prize.lotteryType
        },
        drawId: prize.drawId,
        number: prize.number,
        position: prize.position,
        type: prize.type
      }));
    const calendarReadModel = buildAnalysisCalendarHeatmapReadModel(
      createAnalysisContext({
        month: 4,
        prizeType: "TWO_DIGIT",
        scope: "MONTH"
      }),
      calendarPrizes,
      {
        drawCount: 2,
        invalidPrizeCount: 0,
        prizeCount: calendarPrizes.length
      }
    );

    expect(patternReadModel.sampleSize).toBe(7);
    expect(patternReadModel.examples[0]).toMatchObject({ number: "11", prizeType: "TWO_DIGIT" });
    expect(patternReadModel.overview[0]?.examples).toContain("11");
    expect(calendarReadModel.scope).toBe("MONTH");
    expect(calendarReadModel.month).toBe(4);
    expect(calendarReadModel.sampleSize).toBe(2);
    expect(calendarReadModel.drawCount).toBe(2);
    expect(calendarReadModel.prizesPerDrawExpected).toBe(1);
    expect(calendarReadModel.heatmapRows).toHaveLength(2);
  });

  test("recomputes one snapshot context and writes all derived snapshot tables", async () => {
    const executedSql: string[] = [];
    const transactionOptions: Array<{ timeout: number }> = [];

    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async (...args: unknown[]) => {
        const sql = getSqlText(args[0]);

        if (sql.includes("SELECT DISTINCT")) {
          return drawRows();
        }

        return prizeRows();
      },
      $transaction: async (
        operation: (transaction: TransactionMock) => Promise<void>,
        options: { timeout: number }
      ) => {
        transactionOptions.push(options);

        return operation({
          $executeRaw: async (...args: unknown[]) => {
            executedSql.push(getSqlText(args[0]));

            return 1;
          }
        });
      }
    };

    const summary = await recomputeAnalysisSnapshot(
      createAnalysisContext({
        month: 4,
        prizeType: "TWO_DIGIT",
        scope: "MONTH"
      })
    );

    expect(summary).toMatchObject({
      invalidPrizeCount: 1,
      prizeType: "TWO_DIGIT",
      sampleDrawCount: 2,
      samplePrizeCount: 3,
      scope: "MONTH"
    });
    expect(transactionOptions[0]?.timeout).toBeGreaterThanOrEqual(120_000);
    expect(executedSql.some((sql) => sql.includes('DELETE FROM "analysis_snapshot_runs"'))).toBe(
      true
    );
    expect(executedSql.some((sql) => sql.includes('INSERT INTO "analysis_snapshot_runs"'))).toBe(
      true
    );
    expect(executedSql.some((sql) => sql.includes('INSERT INTO "analysis_digit_stats"'))).toBe(
      true
    );
    expect(executedSql.some((sql) => sql.includes('INSERT INTO "analysis_number_stats"'))).toBe(
      true
    );
    expect(
      executedSql.some((sql) => sql.includes('INSERT INTO "analysis_pattern_summaries"'))
    ).toBe(true);
    expect(
      executedSql.some((sql) => sql.includes('INSERT INTO "analysis_calendar_heatmaps"'))
    ).toBe(true);
  });

  test("builds on-demand analytics with the selected analysis context", async () => {
    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async (...args: unknown[]) => {
        const sql = getSqlText(args[0]);

        if (sql.includes("SELECT DISTINCT")) {
          return drawRows();
        }

        return prizeRows();
      }
    };

    const model = await buildOnDemandAnalysisReadModel(
      createAnalysisContext({
        prizeType: "TWO_DIGIT",
        scope: "ALL_TIME"
      }),
      new Date("2026-04-29T00:00:00.000Z")
    );

    expect(model.summary.drawCount).toBe(2);
    expect(model.numberStats.map((stat) => stat.number)).toContain("09");
    expect(model.numberStats.every((stat) => stat.prizeType === "TWO_DIGIT")).toBe(true);
  });

  test("reads precomputed pattern snapshots without loading the full analytics payload", async () => {
    const queryCalls: string[] = [];

    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async (...args: unknown[]) => {
        const sql = getSqlText(args[0]);
        queryCalls.push(sql);

        return [
          {
            computedAt: new Date("2026-04-29T00:00:00.000Z"),
            patternReadModel: {
              distribution: [],
              examples: [
                {
                  dna: "O/L E/L O/L E/L O/L E/L",
                  flags: ["has_repeat"],
                  number: "121212",
                  prizeType: "SIX_DIGIT_ALL"
                }
              ],
              overview: [
                {
                  examples: ["121212"],
                  hitCount: 3,
                  id: "has_repeat",
                  label: "has_repeat",
                  pattern: "has_repeat",
                  percent: 100,
                  sampleSize: 3
                }
              ],
              sampleSize: 3
            },
            sampleDrawCount: 2,
            samplePrizeCount: 3
          }
        ];
      }
    };

    const model = await getAnalysisSnapshotPatternReadModel({
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 6,
      page: 1,
      pageSize: 20,
      prizeType: "SIX_DIGIT_ALL",
      scope: "ALL_TIME"
    });

    expect(queryCalls[0]).toContain('"patternReadModel"');
    expect(queryCalls[0]).not.toContain('"analyticsReadModel"');
    expect(model?.source).toBe("snapshot");
    expect(model?.context).toMatchObject({
      numberLength: 6,
      prizeType: "SIX_DIGIT_ALL",
      scope: "ALL_TIME"
    });
    expect(model?.pattern.sampleSize).toBe(3);
  });

  test("reads derived digit and number snapshots without loading analytics payload", async () => {
    const queryCalls: string[] = [];

    (globalThis as { prisma?: unknown }).prisma = {
      $queryRaw: async (...args: unknown[]) => {
        const sql = getSqlText(args[0]);
        queryCalls.push(sql);

        if (sql.includes('FROM "analysis_snapshot_runs"')) {
          return [
            {
              runId: "00000000-0000-7000-8000-000000000001",
              sampleDrawCount: 2,
              samplePrizeCount: 3
            }
          ];
        }

        if (sql.includes('FROM "analysis_digit_stats"')) {
          return [
            {
              computedAt: new Date("2026-04-29T00:00:00.000Z"),
              digit: "1",
              drawCount: 2,
              frequencyPercent: 50,
              hitCount: 1,
              lastSeenDrawDate: new Date("2026-04-16T00:00:00.000Z"),
              lotteryType: "THAI_GOVERNMENT",
              missingDrawCount: 0,
              position: 1,
              prizeType: "TWO_DIGIT",
              trendDirection: "flat"
            }
          ];
        }

        if (sql.includes('FROM "analysis_number_stats"')) {
          return [
            {
              averageGap: null,
              computedAt: new Date("2026-04-29T00:00:00.000Z"),
              drawCount: 2,
              frequencyPercent: 33.33,
              hitCount: 1,
              lastSeenDrawDate: new Date("2026-04-16T00:00:00.000Z"),
              lotteryType: "THAI_GOVERNMENT",
              maxGap: null,
              missingDrawCount: 0,
              number: "11",
              numberLength: 2,
              patternFlags: ["double", "has_repeat"],
              prizeType: "TWO_DIGIT",
              trendScore: 67.5
            }
          ];
        }

        return [];
      }
    };

    const query = {
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      page: 1,
      pageSize: 20,
      prizeType: "TWO_DIGIT",
      scope: "ALL_TIME"
    } as const;
    const digitStats = await getAnalysisSnapshotDigitStats(query);
    const numberStats = await getAnalysisSnapshotNumberStats(query);

    expect(queryCalls.some((sql) => sql.includes('"analyticsReadModel"'))).toBe(false);
    expect(queryCalls.some((sql) => sql.includes('FROM "analysis_digit_stats"'))).toBe(true);
    expect(queryCalls.some((sql) => sql.includes('FROM "analysis_number_stats"'))).toBe(true);
    expect(digitStats?.[0]).toMatchObject({
      digit: "1",
      sampleEventCount: 2
    });
    expect(numberStats?.[0]).toMatchObject({
      frequencyPerDrawPercent: 50,
      frequencyPerPrizeRowPercent: 33.33,
      number: "11",
      samplePrizeCount: 3
    });
  });

  test("reads filtered number snapshots by run id and requested numbers only", async () => {
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
              samplePrizeCount: 120
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

    const result = await getAnalysisSnapshotNumberStatsForNumbers(
      {
        lotteryType: "THAI_GOVERNMENT",
        numberLength: 2,
        page: 1,
        pageSize: 20,
        prizeType: "TWO_DIGIT",
        scope: "ALL_TIME"
      },
      ["09", "22", "09"]
    );

    expect(queryCalls.some((sql) => sql.includes('"analyticsReadModel"'))).toBe(false);
    expect(queryCalls.some((sql) => sql.includes('FROM "analysis_number_stats"'))).toBe(true);
    expect(queryCalls.some((sql) => sql.includes('"number" IN'))).toBe(true);
    expect(result?.sampleDrawCount).toBe(50);
    expect(result?.samplePrizeCount).toBe(120);
    expect(result?.stats).toHaveLength(1);
    expect(result?.stats[0]).toMatchObject({
      frequencyPerDrawPercent: 6,
      frequencyPerPrizeRowPercent: 2.5,
      number: "09",
      samplePrizeCount: 120
    });
  });
});

type TransactionMock = {
  $executeRaw: (...args: unknown[]) => Promise<number>;
};

function drawRows() {
  return [
    {
      drawDate: new Date("2026-04-01T00:00:00.000Z"),
      id: "00000000-0000-7000-8000-000000000001",
      lotteryType: "THAI_GOVERNMENT"
    },
    {
      drawDate: new Date("2026-04-16T00:00:00.000Z"),
      id: "00000000-0000-7000-8000-000000000002",
      lotteryType: "THAI_GOVERNMENT"
    }
  ];
}

function prizeRows() {
  return [
    prizeRow("00000000-0000-7000-8000-000000000001", "2026-04-01T00:00:00.000Z", "09", 1),
    prizeRow("00000000-0000-7000-8000-000000000001", "2026-04-01T00:00:00.000Z", "123", 2),
    prizeRow("00000000-0000-7000-8000-000000000002", "2026-04-16T00:00:00.000Z", "11", 1),
    prizeRow("00000000-0000-7000-8000-000000000002", "2026-04-16T00:00:00.000Z", "22", 2)
  ];
}

function sixDigitPrizeRows() {
  return [
    prizeRowWithType(
      "00000000-0000-7000-8000-000000000001",
      "2026-04-01T00:00:00.000Z",
      "123456",
      1,
      "FIRST"
    ),
    prizeRowWithType(
      "00000000-0000-7000-8000-000000000001",
      "2026-04-01T00:00:00.000Z",
      "654321",
      1,
      "PRIZE2"
    ),
    prizeRowWithType(
      "00000000-0000-7000-8000-000000000002",
      "2026-04-16T00:00:00.000Z",
      "222222",
      2,
      "PRIZE5"
    ),
    prizeRowWithType(
      "00000000-0000-7000-8000-000000000002",
      "2026-04-16T00:00:00.000Z",
      "1234567",
      1,
      "FIRST"
    )
  ];
}

function prizeRow(drawId: string, drawDate: string, number: string, position: number) {
  return prizeRowWithType(drawId, drawDate, number, position, "TWO_DIGIT");
}

function prizeRowWithType(
  drawId: string,
  drawDate: string,
  number: string,
  position: number,
  type: string
) {
  return {
    drawDate: new Date(drawDate),
    drawId,
    lotteryType: "THAI_GOVERNMENT",
    number,
    position,
    type
  };
}

function analyticsReadModel(): ApiAnalyticsReadModel {
  return {
    digitStats: [],
    generatedAt: "2026-04-29T00:00:00.000Z",
    numberStats: [
      numberStat("11", 4, ["has_repeat", "double"]),
      numberStat("22", 2, ["has_repeat", "double"]),
      numberStat("09", 1, ["odd", "high"])
    ],
    patternSummaries: [
      {
        frequencyPercent: 100,
        hitCount: 6,
        id: "pattern-has-repeat",
        insight: "repeat sample",
        label: "has_repeat",
        pattern: "has_repeat",
        sampleSize: 3
      }
    ],
    source: "api",
    summary: {
      drawCount: 2,
      generatedAt: "2026-04-29T00:00:00.000Z"
    }
  };
}

function numberStat(
  number: string,
  hitCount: number,
  patternFlags: ApiAnalyticsReadModel["numberStats"][number]["patternFlags"]
) {
  return {
    computedAt: "2026-04-29T00:00:00.000Z",
    drawCount: 2,
    frequencyPercent: 50,
    hitCount,
    lastSeenDrawDate: "2026-04-16T00:00:00.000Z",
    lotteryType: "THAI_GOVERNMENT",
    missingDrawCount: 0,
    number,
    numberLength: 2,
    patternFlags,
    prizeType: "TWO_DIGIT",
    trendScore: 50,
    samplePrizeCount: 7
  };
}

function getSqlText(template: unknown) {
  return Array.isArray(template) ? template.join("?") : String(template);
}
