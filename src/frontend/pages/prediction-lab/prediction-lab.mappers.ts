import { getMiniDna } from "@/lib/app/number-shape";
import { getPatternDefinitionsForPrizeType } from "@/lib/app/pattern-playground";
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

export function toPredictionPayload(
  formState: PredictionFormState,
  selectedPatternIds: readonly string[] = []
) {
  return {
    count: formState.count,
    lotteryType: "THAI_GOVERNMENT" as const,
    numberLength: getPredictionNumberLength(formState.prizeType),
    ...(selectedPatternIds.length > 0 ? { patternIds: [...selectedPatternIds] } : {}),
    prizeType: formState.prizeType,
    strategyId: formState.strategyId,
    windowSize: formState.windowSize
  };
}

export function getPatternFlagLabelsForNumber(
  number: string,
  prizeType: PredictionRequest["prizeType"]
) {
  return getPatternDefinitionsForPrizeType(prizeType)
    .filter((definition) => definition.matches(number))
    .slice(0, 4)
    .map((definition) => definition.label);
}

export function getPredictionNumberDna(number: string) {
  return getMiniDna(number);
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

export function getPredictionPositionLabel(positionIndex: number, numberLength: number) {
  if (numberLength === 2) {
    return positionIndex === 1 ? "หลักสิบ" : "หลักหน่วย";
  }

  if (numberLength === 3) {
    return ["หลักร้อย", "หลักสิบ", "หลักหน่วย"][positionIndex - 1] ?? `ตำแหน่งที่ ${positionIndex}`;
  }

  return `ตำแหน่งที่ ${positionIndex}`;
}

export function getPredictionScoreLabel(label: string) {
  const labels: Record<string, string> = {
    hot: "position hot",
    overdue: "position overdue",
    pair: "shape naturalness",
    pattern: "shape pattern",
    position: "trend"
  };

  return labels[label] ?? label;
}

export { getPredictionNumberLength };
