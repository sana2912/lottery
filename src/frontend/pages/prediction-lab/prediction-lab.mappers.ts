import type {
  PredictionRequest,
  PredictionResponse,
  PredictionResult
} from "@/schema/app/prediction.schema";

export type PredictionFormState = {
  count: string;
  numberLength: string;
  strategyId: PredictionRequest["strategyId"];
  windowSize: string;
};

export const defaultPredictionFormState: PredictionFormState = {
  count: "5",
  numberLength: "2",
  strategyId: "balanced",
  windowSize: "120"
};

export function toPredictionPayload(formState: PredictionFormState) {
  return {
    count: formState.count,
    lotteryType: "THAI_GOVERNMENT" as const,
    numberLength: formState.numberLength,
    prizeType: "TWO_DIGIT" as const,
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
