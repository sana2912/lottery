import { ApiHttpError, apiGet, apiPost } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import {
  buildPatternPlaygroundOptions,
  getPatternDefinitionsForPrizeType,
  type PatternPlaygroundOption
} from "@/lib/app/pattern-playground";
import { toPatternStatsQueryForPrize } from "@/lib/app/pattern-playground/query";
import { patternsReadModelSchema } from "@/schema/app/patterns.schema";
import {
  type PredictionRequest,
  type PredictionResponse,
  predictionResponseSchema
} from "@/schema/app/prediction.schema";

export type { PatternPlaygroundOption };

const patternOptionsCache = new Map<
  PredictionRequest["prizeType"],
  Promise<PatternPlaygroundOption[]>
>();

export async function getPatternPlaygroundOptions(prizeType: PredictionRequest["prizeType"]) {
  const cached = patternOptionsCache.get(prizeType);

  if (cached) {
    return cached;
  }

  const promise = loadPatternPlaygroundOptions(prizeType).catch((error) => {
    patternOptionsCache.delete(prizeType);
    throw error;
  });

  patternOptionsCache.set(prizeType, promise);

  return promise;
}

async function loadPatternPlaygroundOptions(prizeType: PredictionRequest["prizeType"]) {
  const snapshot = await apiGet(apiRoutes.patterns, {
    cache: "no-store",
    query: toPatternStatsQueryForPrize(prizeType),
    schema: patternsReadModelSchema
  });
  const definitions = getPatternDefinitionsForPrizeType(prizeType);

  return buildPatternPlaygroundOptions(snapshot.pattern, definitions);
}

export async function getLatestPredictionRun() {
  try {
    return await apiGet<PredictionResponse>(apiRoutes.predictions, {
      cache: "no-store",
      schema: predictionResponseSchema
    });
  } catch (error) {
    if (error instanceof ApiHttpError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function generatePredictionRun(payload: PredictionRequest) {
  return apiPost<PredictionResponse>(apiRoutes.predictions, payload, {
    schema: predictionResponseSchema
  });
}
