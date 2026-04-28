import type { ApiPredictionResponse, ApiPredictionResult } from "@/schema/api/prediction";

type PredictionResultDtoInput = Omit<ApiPredictionResult, "reasons"> & {
  reasons: readonly string[];
};

type PredictionResponseDtoInput = Omit<ApiPredictionResponse, "generatedAt" | "results"> & {
  generatedAt: Date | string;
  results: readonly PredictionResultDtoInput[];
};

export function toApiPredictionResult(result: PredictionResultDtoInput): ApiPredictionResult {
  return {
    id: result.id,
    inputWindow: result.inputWindow,
    number: result.number,
    numberLength: result.numberLength,
    rank: result.rank,
    reasons: [...result.reasons],
    score: result.score,
    scoreBreakdown: { ...result.scoreBreakdown },
    strategyId: result.strategyId,
    strategyName: result.strategyName,
    version: result.version
  };
}

export function toApiPredictionResponse(input: PredictionResponseDtoInput): ApiPredictionResponse {
  return {
    generatedAt:
      input.generatedAt instanceof Date ? input.generatedAt.toISOString() : input.generatedAt,
    input: input.input,
    results: input.results.map(toApiPredictionResult),
    source: input.source
  };
}
