import { ApiHttpError, apiGet, apiPost } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import {
  type PredictionRequest,
  type PredictionResponse,
  predictionResponseSchema
} from "@/schema/app/prediction.schema";

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
