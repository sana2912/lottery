import { randomUUID } from "node:crypto";
import { toApiPredictionResponse } from "@/api/model/dto/prediction.dto";
import { analyticsService } from "@/api/service/analytics.service";
import { buildPositionPredictionResults } from "@/api/service/prediction/position-engine";
import { PREDICTION_ENGINE_VERSION } from "@/api/service/prediction/scoring-engine";
import { getPredictionStrategy } from "@/api/service/prediction/strategy-registry";
import { getPrisma } from "@/api/service/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getPredictionNumberLength } from "@/lib/app/prediction";
import {
  type PredictionRequest,
  type PredictionResponse,
  predictionResponseSchema
} from "@/schema/app/prediction.schema";

type PredictionRunRecord = {
  count: number | null;
  generatedAt: Date | null;
  id: string;
  lotteryType: PredictionRequest["lotteryType"] | null;
  numberLength: number | null;
  params: unknown;
  prizeType: PredictionRequest["prizeType"] | null;
  strategy: string;
  updatedAt: Date;
  version: string | null;
  windowSize: number | null;
};

type PredictionResultRecord = {
  id: string;
  inputWindow: number | null;
  number: string;
  numberLength: number | null;
  rank: number | null;
  reasons: string[];
  runId: string;
  score: number;
  scoreBreakdown: unknown;
  strategyId: string | null;
  strategyName: string | null;
  version: string | null;
};

export async function generate(input: PredictionRequest) {
  const prisma = getPrisma();
  const generatedAt = new Date();
  const normalizedInput: PredictionRequest = {
    ...input,
    numberLength: getPredictionNumberLength(input.prizeType)
  };
  const strategy = getPredictionStrategy(input.strategyId);
  const digitStats = await timeAsync("prediction.generate analytics digits", () =>
    analyticsService.getDigitStats({
      lotteryType: normalizedInput.lotteryType,
      numberLength: normalizedInput.numberLength,
      page: 1,
      pageSize: 20,
      prizeType: normalizedInput.prizeType,
      scope: "ALL_TIME",
      windowPreset: "ALL"
    })
  );
  const rankedResults = timeSync("prediction.generate build results", () =>
    buildPositionPredictionResults({
      count: normalizedInput.count,
      digitStats,
      inputWindow: normalizedInput.windowSize,
      numberLength: normalizedInput.numberLength,
      strategy
    }).map((result, index) => ({
      ...result,
      id: randomUUID(),
      rank: index + 1
    }))
  );
  const runId = randomUUID();
  const response = timeSync("prediction.generate dto mapping", () =>
    toApiPredictionResponse({
      generatedAt,
      input: normalizedInput,
      results: rankedResults,
      source: "api"
    })
  );

  await timeAsync("prediction.generate persist", () =>
    prisma.$transaction(async (transaction) => {
      await transaction.predictionRun.create({
        data: {
          id: runId,
          items: rankedResults.length
            ? {
                create: rankedResults.map((result) => ({
                  id: result.id,
                  number: result.number,
                  reasons: result.reasons,
                  score: result.score
                }))
              }
            : undefined,
          params: toPredictionRunParams(generatedAt, normalizedInput, response),
          strategy: strategy.id
        }
      });

      await transaction.$executeRaw`
        UPDATE "prediction_runs"
        SET
          "lotteryType" = ${input.lotteryType}::"LotteryType",
          "prizeType" = ${input.prizeType}::"LotteryPrizeType",
          "numberLength" = ${normalizedInput.numberLength},
          "windowSize" = ${normalizedInput.windowSize},
          "count" = ${normalizedInput.count},
          "generatedAt" = ${generatedAt},
          "version" = ${PREDICTION_ENGINE_VERSION},
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE "_id" = ${runId}::uuid
      `;

      for (const result of rankedResults) {
        await transaction.$executeRaw`
          UPDATE "prediction_results"
          SET
            "inputWindow" = ${result.inputWindow},
            "numberLength" = ${result.numberLength},
            "rank" = ${result.rank},
            "scoreBreakdown" = ${toJson(result.scoreBreakdown)}::jsonb,
            "strategyId" = ${result.strategyId},
            "strategyName" = ${result.strategyName},
            "version" = ${result.version},
            "updatedAt" = CURRENT_TIMESTAMP
          WHERE "_id" = ${result.id}::uuid
        `;
      }
    })
  );

  return response;
}

export async function getLatestPrediction() {
  const prisma = getPrisma();
  const [run] = await timeAsync(
    "prediction.latest run query",
    () =>
      prisma.$queryRaw<PredictionRunRecord[]>`
        SELECT
          "_id" AS "id",
          "strategy",
          "lotteryType",
          "prizeType",
          "numberLength",
          "windowSize",
          "count",
          "generatedAt",
          "version",
          "params",
          "updatedAt"
        FROM "prediction_runs"
        ORDER BY COALESCE("generatedAt", "updatedAt") DESC, "updatedAt" DESC
        LIMIT 1
      `
  );

  if (!run) {
    return null;
  }

  return getPredictionResponseForRun(run);
}

export async function getPredictionById(id: string) {
  const prisma = getPrisma();
  const [run] = await timeAsync(
    "prediction.run by id query",
    () =>
      prisma.$queryRaw<PredictionRunRecord[]>`
        SELECT
          "_id" AS "id",
          "strategy",
          "lotteryType",
          "prizeType",
          "numberLength",
          "windowSize",
          "count",
          "generatedAt",
          "version",
          "params",
          "updatedAt"
        FROM "prediction_runs"
        WHERE "_id" = ${id}::uuid
        LIMIT 1
      `
  );

  if (!run) {
    return null;
  }

  return getPredictionResponseForRun(run);
}

export async function getLatestPredictionSummary() {
  const prediction = await getLatestPrediction();

  if (!prediction) {
    return null;
  }

  return {
    candidates: prediction.results.slice(0, 3).map((result) => ({
      number: result.number,
      reasons: result.reasons,
      score: result.score
    })),
    disclaimer:
      "This summary reflects the latest persisted prediction run generated from the current analytics window.",
    generatedAt: prediction.generatedAt,
    title: `Latest ${prediction.input.strategyId} prediction run`
  };
}

export const predictionService = {
  generate,
  getLatestPrediction,
  getLatestPredictionSummary,
  getPredictionById
} as const;

async function getPredictionResponseForRun(
  run: PredictionRunRecord
): Promise<PredictionResponse | null> {
  const prisma = getPrisma();
  const items = await timeAsync(
    "prediction.run items query",
    () =>
      prisma.$queryRaw<PredictionResultRecord[]>`
        SELECT
          "_id" AS "id",
          "runId",
          "number",
          "score",
          "reasons",
          "inputWindow",
          "numberLength",
          "rank",
          "scoreBreakdown",
          "strategyId",
          "strategyName",
          "version"
        FROM "prediction_results"
        WHERE "runId" = ${run.id}::uuid
        ORDER BY COALESCE("rank", 2147483647) ASC, "createdAt" ASC
      `
  );
  const parsed = toStructuredPredictionResponse(run, items);

  if (parsed) {
    return parsed;
  }

  return toLegacyPredictionResponse(run.params);
}

function toPredictionRunParams(
  generatedAt: Date,
  input: PredictionRequest,
  response: PredictionResponse
): Prisma.InputJsonValue {
  return {
    generatedAt: generatedAt.toISOString(),
    input,
    response,
    resultsMeta: response.results.map((result) => ({
      id: result.id,
      inputWindow: result.inputWindow,
      number: result.number,
      numberLength: result.numberLength,
      rank: result.rank,
      scoreBreakdown: result.scoreBreakdown,
      strategyId: result.strategyId,
      strategyName: result.strategyName,
      version: result.version
    }))
  } as Prisma.InputJsonValue;
}

function toStructuredPredictionResponse(
  run: PredictionRunRecord,
  _items: PredictionResultRecord[]
): PredictionResponse | null {
  if (
    !run.generatedAt ||
    !run.lotteryType ||
    !run.prizeType ||
    !run.numberLength ||
    !run.windowSize ||
    !run.count ||
    !run.version
  ) {
    return null;
  }
  return null;
}

function toLegacyPredictionResponse(params: unknown): PredictionResponse | null {
  if (!params || typeof params !== "object" || Array.isArray(params)) {
    return null;
  }

  const response = "response" in params ? (params as { response?: unknown }).response : undefined;
  const parsed = predictionResponseSchema.safeParse(response);

  return parsed.success ? parsed.data : null;
}

function toJson(value: unknown) {
  return JSON.stringify(value);
}

async function timeAsync<T>(label: string, operation: () => Promise<T>) {
  console.time(label);

  try {
    return await operation();
  } finally {
    console.timeEnd(label);
  }
}

function timeSync<T>(label: string, operation: () => T) {
  console.time(label);

  try {
    return operation();
  } finally {
    console.timeEnd(label);
  }
}
