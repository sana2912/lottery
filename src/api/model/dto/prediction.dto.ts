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
    ...result,
    reasons: [...result.reasons]
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
