import { toApiPredictionResponse } from "@/api/model/dto/prediction.dto";
import { analyticsService } from "@/api/service/analytics.service";
import { scoreNumber } from "@/api/service/prediction/scoring-engine";
import { getPredictionStrategy } from "@/api/service/prediction/strategy-registry";
import { getPrisma } from "@/api/service/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  type PredictionRequest,
  type PredictionResponse,
  predictionResponseSchema
} from "@/schema/app/prediction.schema";

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
      rank: index + 1
    }));
  const response = toApiPredictionResponse({
    generatedAt,
    input,
    results: rankedResults,
    source: "api"
  });

  await prisma.predictionRun.create({
    data: {
      items: rankedResults.length
        ? {
            create: rankedResults.map((result) => ({
              number: result.number,
              reasons: result.reasons,
              score: result.score
            }))
          }
        : undefined,
      params: toPredictionRunParams(response),
      strategy: strategy.id
    }
  });

  return response;
}

export async function getLatestPrediction() {
  const prisma = getPrisma();
  const run = await prisma.predictionRun.findFirst({
    include: {
      items: true
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  return run ? toPredictionResponse(run.params) : null;
}

export async function getPredictionById(id: string) {
  const prisma = getPrisma();
  const run = await prisma.predictionRun.findUnique({
    include: {
      items: true
    },
    where: {
      id
    }
  });

  return run ? toPredictionResponse(run.params) : null;
}

export const predictionService = {
  generate,
  getLatestPrediction,
  getPredictionById
} as const;

function toPredictionRunParams(response: PredictionResponse): Prisma.InputJsonValue {
  return {
    response
  } as Prisma.InputJsonValue;
}

function toPredictionResponse(params: unknown): PredictionResponse | null {
  if (!params || typeof params !== "object" || Array.isArray(params)) {
    return null;
  }

  const response = "response" in params ? (params as { response?: unknown }).response : undefined;
  const parsed = predictionResponseSchema.safeParse(response);

  return parsed.success ? parsed.data : null;
}
