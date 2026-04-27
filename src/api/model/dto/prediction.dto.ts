import type { ApiPrediction } from "@/schema/api/prediction";

type PredictionDtoInput = {
  id: string;
  strategy: string;
  numbers: readonly string[];
};

export function toApiPrediction(prediction: PredictionDtoInput): ApiPrediction {
  return {
    id: prediction.id,
    strategy: prediction.strategy,
    numbers: [...prediction.numbers]
  };
}
