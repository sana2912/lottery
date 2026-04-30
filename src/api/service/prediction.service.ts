import { toApiPredictionResponse } from "@/api/model/dto/prediction.dto";
import { analyticsService } from "@/api/service/analytics.service";
import { scoreNumber } from "@/api/service/prediction/scoring-engine";
import { getPredictionStrategy } from "@/api/service/prediction/strategy-registry";
import type { PredictionRequest } from "@/schema/app/prediction.schema";

export async function generate(input: PredictionRequest) {
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

  if (numberStats.length === 0) {
    return toApiPredictionResponse({
      generatedAt,
      input,
      results: [],
      source: "api"
    });
  }

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

  return toApiPredictionResponse({
    generatedAt,
    input,
    results: rankedResults,
    source: "api"
  });
}

export const predictionService = {
  generate
} as const;
