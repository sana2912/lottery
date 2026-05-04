import { getPredictionNumberLength } from "@/lib/app/prediction";
import type {
  PredictionRequest,
  PredictionResponse,
  PredictionResult
} from "@/schema/app/prediction.schema";

export type PredictionFormState = {
  count: string;
  prizeType: PredictionRequest["prizeType"];
  strategyId: PredictionRequest["strategyId"];
  windowSize: string;
};

export const defaultPredictionFormState: PredictionFormState = {
  count: "5",
  prizeType: "TWO_DIGIT",
  strategyId: "balanced",
  windowSize: "120"
};

export function toPredictionPayload(formState: PredictionFormState) {
  return {
    count: formState.count,
    lotteryType: "THAI_GOVERNMENT" as const,
    numberLength: getPredictionNumberLength(formState.prizeType),
    prizeType: formState.prizeType,
    strategyId: formState.strategyId,
    windowSize: formState.windowSize
  };
}

export function toPredictionWatchlistPayload(result: PredictionResult) {
  return {
    note: `Saved from Prediction Lab using ${result.strategyName}. Score: ${result.score}.`,
    number: result.number,
    source: "PREDICTION" as const,
    tags: ["prediction", result.strategyId]
  };
}

export function getTopPredictionScore(prediction: null | PredictionResponse) {
  return prediction?.results[0]?.score.toString() ?? "-";
}

export { getPredictionNumberLength };
