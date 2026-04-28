import { afterEach, describe, expect, test } from "bun:test";
import { getBacktestById, listBacktests, runBacktest } from "@/api/service/backtest.service";
import {
  backtestHistoryResponseSchema,
  backtestReadModelSchema
} from "@/schema/app/backtest.schema";

afterEach(() => {
  delete (globalThis as { prisma?: unknown }).prisma;
});

describe("backtest.service", () => {
  test("persists a backtest run and reloads it as a schema-valid read model", async () => {
    const state: {
      resultRows: Array<Record<string, unknown>>;
      runData?: Record<string, unknown>;
    } = {
      resultRows: []
    };

    const prisma = {
      $transaction: async (
        callback: (tx: {
          backtestResult: {
            createMany: (args: { data: Array<Record<string, unknown>> }) => Promise<void>;
          };
          backtestRun: { create: (args: { data: Record<string, unknown> }) => Promise<void> };
        }) => Promise<void>
      ) =>
        callback({
          backtestResult: {
            createMany: async ({ data }) => {
              state.resultRows = data;
            }
          },
          backtestRun: {
            create: async ({ data }) => {
              state.runData = data;
            }
          }
        }),
      backtestRun: {
        findMany: async () => [
          {
            candidateCount: 5,
            computedAt: new Date("2026-04-29T00:00:00.000Z"),
            coverage: 3,
            hitRate: 33.33,
            id: "history-1",
            longestMissStreak: 2,
            lotteryType: "THAI_GOVERNMENT",
            numberLength: 2,
            prizeType: "TWO_DIGIT",
            strategyId: "balanced",
            strategyName: "Balanced",
            version: "prediction-engine-v1"
          }
        ],
        findUnique: async () =>
          state.runData
            ? {
                ...state.runData,
                averageHitRank: state.runData.averageHitRank,
                computedAt: state.runData.computedAt,
                endDrawDate: state.runData.endDrawDate,
                params: state.runData.params,
                results: state.resultRows.map((result) => ({
                  ...result,
                  rankOfHit: result.rankOfHit
                })),
                startDrawDate: state.runData.startDrawDate
              }
            : null
      },
      lotteryDraw: {
        findMany: async () => [
          draw("draw-1", "2026-01-01T00:00:00.000Z", "11"),
          draw("draw-2", "2026-01-16T00:00:00.000Z", "22"),
          draw("draw-3", "2026-02-01T00:00:00.000Z", "11"),
          draw("draw-4", "2026-02-16T00:00:00.000Z", "99")
        ]
      }
    };

    (globalThis as { prisma?: unknown }).prisma = prisma;

    const run = await runBacktest({
      candidateCount: 5,
      endDate: undefined,
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      page: 1,
      pageSize: 20,
      params: {},
      prizeType: "TWO_DIGIT",
      q: undefined,
      startDate: undefined,
      strategyId: "balanced",
      windowSize: 20
    });

    expect(state.runData).toBeDefined();
    expect(state.resultRows.length).toBeGreaterThan(0);
    expect(backtestReadModelSchema.parse(run)).toEqual(run);
    expect(run.results.map((item) => item.drawId)).toEqual(["draw-2", "draw-3", "draw-4"]);
  });

  test("loads persisted run by id and returns compact history", async () => {
    (globalThis as { prisma?: unknown }).prisma = {
      backtestRun: {
        findMany: async () => [
          {
            candidateCount: 5,
            computedAt: new Date("2026-04-29T00:00:00.000Z"),
            coverage: 10,
            hitRate: 20,
            id: "history-1",
            longestMissStreak: 4,
            lotteryType: "THAI_GOVERNMENT",
            numberLength: 2,
            prizeType: "TWO_DIGIT",
            strategyId: "balanced",
            strategyName: "Balanced",
            version: "prediction-engine-v1"
          }
        ],
        findUnique: async ({ where }: { where: { id: string } }) =>
          where.id === "missing"
            ? null
            : {
                averageHitRank: 2,
                candidateCount: 5,
                computedAt: new Date("2026-04-29T00:00:00.000Z"),
                coverage: 10,
                endDrawDate: new Date("2026-04-16T00:00:00.000Z"),
                hitRate: 20,
                id: where.id,
                longestMissStreak: 4,
                lotteryType: "THAI_GOVERNMENT",
                numberLength: 2,
                params: {},
                prizeType: "TWO_DIGIT",
                results: [
                  {
                    actualNumbers: ["09"],
                    drawDate: new Date("2026-04-16T00:00:00.000Z"),
                    drawId: "draw-1",
                    generatedNumbers: ["09", "11"],
                    hitNumbers: ["09"],
                    id: "result-1",
                    isHit: true,
                    rankOfHit: 1,
                    runId: where.id
                  }
                ],
                startDrawDate: new Date("2026-01-01T00:00:00.000Z"),
                strategyId: "balanced",
                strategyName: "Balanced",
                version: "prediction-engine-v1"
              }
      }
    };

    const detail = await getBacktestById("run-1");
    const missing = await getBacktestById("missing");
    const history = await listBacktests();

    expect(detail && backtestReadModelSchema.parse(detail)).toEqual(detail);
    expect(missing).toBeNull();
    expect(backtestHistoryResponseSchema.parse(history)).toEqual(history);
    expect(history.items).toHaveLength(1);
  });
});

function draw(id: string, drawDate: string, number: string) {
  return {
    drawDate: new Date(drawDate),
    id,
    lotteryType: "THAI_GOVERNMENT",
    prizes: [
      {
        drawId: id,
        number,
        type: "TWO_DIGIT"
      }
    ]
  };
}
