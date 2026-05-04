import type { ApiLotteryPrizeType } from "@/schema/api/query";

export type PredictionPrizeOption = {
  label: string;
  numberLength: 2 | 3 | 6;
  value: ApiLotteryPrizeType;
};

export const predictionPrizeOptions = [
  { label: "First prize", numberLength: 6, value: "FIRST" },
  { label: "Near first", numberLength: 6, value: "NEAR_FIRST" },
  { label: "Prize 2", numberLength: 6, value: "PRIZE2" },
  { label: "Prize 3", numberLength: 6, value: "PRIZE3" },
  { label: "Prize 4", numberLength: 6, value: "PRIZE4" },
  { label: "Prize 5", numberLength: 6, value: "PRIZE5" },
  { label: "Three digit", numberLength: 3, value: "THREE_DIGIT" },
  { label: "Three front", numberLength: 3, value: "THREE_FRONT" },
  { label: "Three back", numberLength: 3, value: "THREE_BACK" },
  { label: "Two digit", numberLength: 2, value: "TWO_DIGIT" },
  { label: "Other", numberLength: 6, value: "OTHER" }
] satisfies ReadonlyArray<PredictionPrizeOption>;

export function getPredictionNumberLength(prizeType: ApiLotteryPrizeType): 2 | 3 | 6 {
  return predictionPrizeOptions.find((option) => option.value === prizeType)?.numberLength ?? 6;
}
