import { randomUUID } from "node:crypto";
import { toApiPredictionResponse } from "@/api/model/dto/prediction.dto";
import { analyticsService } from "@/api/service/analytics.service";
import { PREDICTION_ENGINE_VERSION, scoreNumber } from "@/api/service/prediction/scoring-engine";
import { getPredictionStrategy } from "@/api/service/prediction/strategy-registry";
import { getPrisma } from "@/api/service/prisma";
import type { Prisma } from "@/generated/prisma/client";
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
  const strategy = getPredictionStrategy(input.strategyId);
  const numberStats = await analyticsService.getNumberStats({
    lotteryType: input.lotteryType,
    numberLength: input.numberLength,
    page: 1,
    pageSize: 20,
    prizeType: input.prizeType,
    windowSize: input.windowSize
  });
  const rankedResults = numberStats
    .map((stat, index) =>
      scoreNumber({
        inputWindow: input.windowSize,
        rank: index + 1,
        stat,
        strategy
      })
    )
    .sort((left, right) => right.score - left.score)
    .slice(0, input.count)
    .map((result, index) => ({
      ...result,
      id: randomUUID(),
      rank: index + 1
    }));
  const runId = randomUUID();
  const response = toApiPredictionResponse({
    generatedAt,
    input,
    results: rankedResults,
    source: "api"
  });

  await prisma.$transaction(async (transaction) => {
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
        params: toPredictionRunParams(generatedAt, input, rankedResults),
        strategy: strategy.id
      }
    });

    await transaction.$executeRaw`
      UPDATE "prediction_runs"
      SET
        "lotteryType" = ${input.lotteryType}::"LotteryType",
        "prizeType" = ${input.prizeType}::"LotteryPrizeType",
        "numberLength" = ${input.numberLength},
        "windowSize" = ${input.windowSize},
        "count" = ${input.count},
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
  });

  return response;
}

export async function getLatestPrediction() {
  const prisma = getPrisma();
  const [run] = await prisma.$queryRaw<PredictionRunRecord[]>`
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
  `;

  if (!run) {
    return null;
  }

  return getPredictionResponseForRun(run);
}

export async function getPredictionById(id: string) {
  const prisma = getPrisma();
  const [run] = await prisma.$queryRaw<PredictionRunRecord[]>`
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
  `;

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
  const items = await prisma.$queryRaw<PredictionResultRecord[]>`
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
  `;
  const parsed = toStructuredPredictionResponse(run, items);

  if (parsed) {
    return parsed;
  }

  return toLegacyPredictionResponse(run.params);
}

function toPredictionRunParams(
  generatedAt: Date,
  input: PredictionRequest,
  results: PredictionResponse["results"]
): Prisma.InputJsonValue {
  return {
    generatedAt: generatedAt.toISOString(),
    input,
    resultsMeta: results.map((result) => ({
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
  items: PredictionResultRecord[]
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

  const results = items
    .map((item) => toStructuredPredictionResult(item))
    .flatMap((item) => (item ? [item] : []))
    .sort((left, right) => left.rank - right.rank);

  if (results.length !== items.length) {
    return null;
  }

  return predictionResponseSchema.parse({
    generatedAt: run.generatedAt.toISOString(),
    input: {
      count: run.count,
      lotteryType: run.lotteryType,
      numberLength: run.numberLength,
      prizeType: run.prizeType,
      strategyId: run.strategy as PredictionRequest["strategyId"],
      windowSize: run.windowSize
    },
    results,
    source: "api"
  });
}

function toStructuredPredictionResult(item: PredictionResultRecord) {
  const scoreBreakdown =
    predictionResponseSchema.shape.results.element.shape.scoreBreakdown.safeParse(
      item.scoreBreakdown
    );

  if (
    item.inputWindow === null ||
    item.numberLength === null ||
    item.rank === null ||
    !item.strategyId ||
    !item.strategyName ||
    !item.version ||
    !scoreBreakdown.success
  ) {
    return null;
  }

  return predictionResponseSchema.shape.results.element.parse({
    id: item.id,
    inputWindow: item.inputWindow,
    number: item.number,
    numberLength: item.numberLength,
    rank: item.rank,
    reasons: item.reasons,
    score: item.score,
    scoreBreakdown: scoreBreakdown.data,
    strategyId: item.strategyId,
    strategyName: item.strategyName,
    version: item.version
  });
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
