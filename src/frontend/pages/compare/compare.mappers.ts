import type { CompareReadModel, CompareRequest } from "@/schema/app/compare.schema";

export type CompareFormState = {
  endDate: string;
  lotteryType: CompareRequest["lotteryType"];
  numberLength: string;
  numbers: string;
  prizeType: CompareRequest["prizeType"];
  startDate: string;
  strategyId: CompareRequest["strategyId"];
  windowSize: string;
};

export const defaultCompareFormState: CompareFormState = {
  endDate: "2026-04-16",
  lotteryType: "THAI_GOVERNMENT",
  numberLength: "2",
  numbers: "47, 91, 24, 03, 18",
  prizeType: "TWO_DIGIT",
  startDate: "2025-01-01",
  strategyId: "balanced",
  windowSize: "120"
};

export function parseCompareNumbers(numbers: string) {
  return numbers
    .split(/[\n,]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function toComparePayload(formState: CompareFormState) {
  return {
    endDate: formState.endDate || undefined,
    lotteryType: formState.lotteryType,
    numberLength: formState.numberLength,
    numbers: parseCompareNumbers(formState.numbers),
    prizeType: formState.prizeType,
    startDate: formState.startDate || undefined,
    strategyId: formState.strategyId,
    windowSize: formState.windowSize
  };
}

export function toCompareChartPoints(compare: CompareReadModel) {
  return compare.candidates.map((candidate) => ({
    id: candidate.number,
    label: candidate.number,
    value: candidate.score
  }));
}
