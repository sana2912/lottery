import { afterEach, describe, expect, test } from "bun:test";
import { analyticsService } from "@/api/service/analytics.service";
import {
  getLatestPrediction,
  getLatestPredictionSummary,
  getPredictionById,
  predictionService
} from "@/api/service/prediction.service";
import { hasNumberShapeFlag } from "@/lib/app/number-shape";
import { predictionResponseSchema } from "@/schema/app/prediction.schema";

const mutableAnalyticsService = analyticsService as {
  getDigitStats: typeof analyticsService.getDigitStats;
  getNumberStats: typeof analyticsService.getNumberStats;
};
const originalGetDigitStats = analyticsService.getDigitStats;
const originalGetNumberStats = analyticsService.getNumberStats;

afterEach(() => {
  mutableAnalyticsService.getDigitStats = originalGetDigitStats;
  mutableAnalyticsService.getNumberStats = originalGetNumberStats;
  delete (globalThis as { prisma?: unknown }).prisma;
});

describe("prediction.service", () => {
  test("ranks candidates by score, limits by count, and returns a schema-valid response", async () => {
    const store = createPredictionStore();

    (globalThis as { prisma?: unknown }).prisma = createPredictionPrismaStub(store);
    mutableAnalyticsService.getDigitStats = async () => [
      digitStat("1", 1, 18, 90, 0, "up"),
      digitStat("0", 1, 6, 30, 12, "down"),
      digitStat("9", 1, 1, 5, 20, "flat"),
      digitStat("1", 2, 17, 85, 0, "up"),
      digitStat("0", 2, 5, 25, 10, "down"),
      digitStat("9", 2, 2, 10, 18, "flat")
    ];

    const response = await predictionService.generate({
      count: 2,
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      prizeType: "TWO_DIGIT",
      strategyId: "balanced",
      windowSize: 120
    });

    expect(predictionResponseSchema.parse(response)).toEqual(response);
    expect(response.results).toHaveLength(2);
    expect(new Set(response.results.map((item) => item.number)).size).toBe(2);
    expect(response.results.map((item) => item.rank)).toEqual([1, 2]);
    expect(response.results[0]?.positionBreakdown).toHaveLength(2);
  });

  test("filters generated candidates by selected pattern ids", async () => {
    const store = createPredictionStore();

    (globalThis as { prisma?: unknown }).prisma = createPredictionPrismaStub(store);
    mutableAnalyticsService.getDigitStats = async () => [
      digitStat("1", 1, 18, 90, 0, "up"),
      digitStat("0", 1, 6, 30, 12, "down"),
      digitStat("9", 1, 1, 5, 20, "flat"),
      digitStat("1", 2, 17, 85, 0, "up"),
      digitStat("0", 2, 5, 25, 10, "down"),
      digitStat("9", 2, 2, 10, 18, "flat")
    ];

    const response = await predictionService.generate({
      count: 5,
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      patternIds: ["ascending"],
      prizeType: "TWO_DIGIT",
      strategyId: "balanced",
      windowSize: 120
    });

    expect(predictionResponseSchema.parse(response)).toEqual(response);
    expect(response.results.length).toBeGreaterThan(0);
    expect(response.results.every((result) => hasNumberShapeFlag(result.number, "ascending"))).toBe(
      true
    );
    expect(response.input.patternIds).toEqual(["ascending"]);
  });

  test("returns an empty result set when analytics has no candidates", async () => {
    const store = createPredictionStore();

    (globalThis as { prisma?: unknown }).prisma = createPredictionPrismaStub(store);
    mutableAnalyticsService.getDigitStats = async () => [];

    const response = await predictionService.generate({
      count: 5,
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      prizeType: "TWO_DIGIT",
      strategyId: "balanced",
      windowSize: 120
    });

    expect(predictionResponseSchema.parse(response)).toEqual(response);
    expect(response.results).toEqual([]);
  });

  test("returns only available candidates when analytics returns fewer than requested", async () => {
    const store = createPredictionStore();

    (globalThis as { prisma?: unknown }).prisma = createPredictionPrismaStub(store);
    mutableAnalyticsService.getDigitStats = async () => [
      digitStat("1", 1, 18, 90, 0, "up"),
      digitStat("0", 1, 6, 30, 12, "down"),
      digitStat("1", 2, 17, 85, 0, "up"),
      digitStat("0", 2, 5, 25, 10, "down")
    ];

    const response = await predictionService.generate({
      count: 5,
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      prizeType: "TWO_DIGIT",
      strategyId: "balanced",
      windowSize: 120
    });

    expect(predictionResponseSchema.parse(response)).toEqual(response);
    expect(response.results).toHaveLength(5);
    expect(response.results.map((item) => item.rank)).toEqual([1, 2, 3, 4, 5]);
  });

  test("persists generated runs and reloads the latest persisted prediction response", async () => {
    const store = createPredictionStore();

    (globalThis as { prisma?: unknown }).prisma = createPredictionPrismaStub(store);
    mutableAnalyticsService.getDigitStats = async () => [
      digitStat("1", 1, 18, 90, 0, "up"),
      digitStat("1", 2, 17, 85, 0, "up")
    ];

    const generated = await predictionService.generate({
      count: 1,
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      prizeType: "TWO_DIGIT",
      strategyId: "balanced",
      windowSize: 120
    });
    const latest = await getLatestPrediction();
    const summary = await getLatestPredictionSummary();

    expect(predictionResponseSchema.parse(generated)).toEqual(generated);
    expect(latest && predictionResponseSchema.parse(latest)).toEqual(latest);
    expect(latest?.results[0]?.number).toBe(generated.results[0]?.number);
    expect(summary?.candidates[0]?.number).toBe(generated.results[0]?.number);
  });

  test("keeps reading legacy persisted prediction snapshots for older runs", async () => {
    const legacyResponse = predictionResponseSchema.parse(
      predictionResponse({
        count: 2,
        lotteryType: "THAI_GOVERNMENT",
        numberLength: 2,
        prizeType: "TWO_DIGIT",
        strategyId: "balanced",
        windowSize: 120
      })
    );
    const store = createPredictionStore({
      items: [],
      run: {
        count: null,
        generatedAt: null,
        id: "legacy-run",
        lotteryType: null,
        numberLength: null,
        params: {
          response: legacyResponse
        },
        prizeType: null,
        strategy: "balanced",
        updatedAt: new Date("2026-04-29T00:00:00.000Z"),
        version: null,
        windowSize: null
      }
    });

    (globalThis as { prisma?: unknown }).prisma = createPredictionPrismaStub(store);

    const response = await getPredictionById("legacy-run");

    expect(response).toEqual(legacyResponse);
  });
});

function _stat(
  number: string,
  hitCount: number,
  patternFlags: ("odd" | "even" | "high" | "low" | "double" | "ascending" | "mirror")[],
  frequencyPercent: number,
  missingDrawCount: number,
  trendScore: number
) {
  return {
    computedAt: "2026-04-29T00:00:00.000Z",
    drawCount: 24,
    frequencyPercent,
    hitCount,
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

function digitStat(
  digit: string,
  position: number,
  hitCount: number,
  frequencyPercent: number,
  missingDrawCount: number,
  trendDirection: "up" | "down" | "flat"
) {
  return {
    computedAt: "2026-04-29T00:00:00.000Z",
    digit,
    drawCount: 24,
    frequencyPercent,
    hitCount,
    lastSeenDrawDate: "2026-04-16T00:00:00.000Z",
    lotteryType: "THAI_GOVERNMENT",
    missingDrawCount,
    position,
    prizeType: "TWO_DIGIT",
    trendDirection,
    windowSize: 120
  };
}

function predictionResponse(input: {
  count: number;
  lotteryType: "THAI_GOVERNMENT";
  numberLength: 2 | 3 | 6;
  patternIds?: string[];
  prizeType:
    | "FIRST"
    | "PRIZE2"
    | "PRIZE3"
    | "PRIZE4"
    | "PRIZE5"
    | "THREE_BACK"
    | "THREE_DIGIT"
    | "THREE_FRONT"
    | "TWO_DIGIT";
  strategyId: "balanced" | "coldRebound" | "hotTrend";
  windowSize: number;
}) {
  return {
    generatedAt: "2026-04-29T00:00:00.000Z",
    input: {
      patternIds: [],
      ...input
    },
    results: [
      {
        id: "result-1",
        inputWindow: input.windowSize,
        number: "09",
        numberLength: input.numberLength,
        positionBreakdown: [
          {
            digit: "0",
            hot: 40,
            overdue: 20,
            position: 50,
            positionIndex: 1,
            reasons: ["Historical frequency is 50% in position 1."],
            score: 0,
            tone: "warm"
          }
        ],
        rank: 1,
        reasons: ["Historical support remains stable."],
        score: 91,
        scoreBreakdown: {
          hot: 30,
          overdue: 18,
          pair: 12,
          pattern: 9,
          position: 22
        },
        strategyId: input.strategyId,
        strategyName: "Balanced",
        version: "prediction-engine-v1"
      }
    ],
    source: "api" as const
  };
}

function createPredictionStore(initial?: {
  items?: Array<Record<string, unknown>>;
  run?: Record<string, unknown>;
}) {
  return {
    items: (initial?.items ?? []) as Array<Record<string, unknown>>,
    run: (initial?.run ?? null) as Record<string, unknown> | null
  };
}

function createPredictionPrismaStub(store: {
  items: Array<Record<string, unknown>>;
  run: Record<string, unknown> | null;
}) {
  return {
    $executeRaw: async (...args: unknown[]) => executePredictionRaw(store, args),
    $queryRaw: async (...args: unknown[]) => queryPredictionRaw(store, args),
    $transaction: async (
      callback: (transaction: {
        $executeRaw: (...args: unknown[]) => Promise<number>;
        predictionRun: {
          create: (args: { data: Record<string, unknown> }) => Promise<{ id: string }>;
        };
      }) => Promise<unknown>
    ) =>
      callback({
        $executeRaw: async (...args: unknown[]) => executePredictionRaw(store, args),
        predictionRun: {
          create: async ({ data }: { data: Record<string, unknown> }) => {
            store.run = {
              count: null,
              generatedAt: null,
              id: data.id,
              lotteryType: null,
              numberLength: null,
              params: data.params,
              prizeType: null,
              strategy: data.strategy,
              updatedAt: new Date("2026-04-29T00:00:00.000Z"),
              version: null,
              windowSize: null
            };
            store.items = (
              (data.items as { create?: Array<Record<string, unknown>> } | undefined)?.create ?? []
            ).map((item) => ({
              id: item.id,
              inputWindow: null,
              number: item.number,
              numberLength: null,
              rank: null,
              reasons: item.reasons,
              runId: data.id,
              score: item.score,
              scoreBreakdown: null,
              strategyId: null,
              strategyName: null,
              version: null
            }));

            return { id: String(data.id) };
          }
        }
      })
  };
}

function executePredictionRaw(
  store: {
    items: Array<Record<string, unknown>>;
    run: Record<string, unknown> | null;
  },
  args: unknown[]
) {
  const sql = getSqlText(args[0]);
  const values = args.slice(1);

  if (sql.includes('UPDATE "prediction_runs"')) {
    if (!store.run) {
      return Promise.resolve(0);
    }

    store.run = {
      ...store.run,
      count: values[4],
      generatedAt: values[5],
      lotteryType: values[0],
      numberLength: values[2],
      prizeType: values[1],
      updatedAt: new Date("2026-04-29T00:00:00.000Z"),
      version: values[6],
      windowSize: values[3]
    };

    return Promise.resolve(1);
  }

  if (sql.includes('UPDATE "prediction_results"')) {
    const [inputWindow, numberLength, rank, scoreBreakdown, strategyId, strategyName, version] =
      values;
    const resultId = values[7];
    const item = store.items.find((entry) => entry.id === resultId);

    if (!item) {
      return Promise.resolve(0);
    }

    Object.assign(item, {
      inputWindow,
      numberLength,
      rank,
      scoreBreakdown: JSON.parse(String(scoreBreakdown)),
      strategyId,
      strategyName,
      version
    });

    return Promise.resolve(1);
  }

  return Promise.resolve(0);
}

function queryPredictionRaw(
  store: {
    items: Array<Record<string, unknown>>;
    run: Record<string, unknown> | null;
  },
  args: unknown[]
) {
  const sql = getSqlText(args[0]);
  const values = args.slice(1);

  if (sql.includes('FROM "prediction_runs"')) {
    if (!store.run) {
      return Promise.resolve([]);
    }

    if (sql.includes('WHERE "_id"')) {
      return Promise.resolve(values[0] === store.run.id ? [store.run] : []);
    }

    return Promise.resolve([store.run]);
  }

  if (sql.includes('FROM "prediction_results"')) {
    return Promise.resolve(store.items.filter((item) => item.runId === values[0]));
  }

  return Promise.resolve([]);
}

function getSqlText(template: unknown) {
  return Array.isArray(template) ? template.join("?") : String(template);
}
