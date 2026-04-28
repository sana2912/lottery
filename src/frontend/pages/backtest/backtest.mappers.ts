import type {
  BacktestHistoryResponse,
  BacktestReadModel,
  BacktestRequest
} from "@/schema/app/backtest.schema";

export type BacktestFormState = {
  candidateCount: string;
  endDate: string;
  lotteryType: BacktestRequest["lotteryType"];
  numberLength: string;
  prizeType: BacktestRequest["prizeType"];
  startDate: string;
  strategyId: BacktestRequest["strategyId"];
  windowSize: string;
};

export const defaultBacktestFormState: BacktestFormState = {
  candidateCount: "5",
  endDate: "2026-04-16",
  lotteryType: "THAI_GOVERNMENT",
  numberLength: "2",
  prizeType: "TWO_DIGIT",
  startDate: "2025-01-01",
  strategyId: "balanced",
  windowSize: "120"
};

export function toBacktestPayload(formState: BacktestFormState) {
  return {
    candidateCount: formState.candidateCount,
    endDate: formState.endDate || undefined,
    lotteryType: formState.lotteryType,
    numberLength: formState.numberLength,
    params: {
      windowSize: formState.windowSize
    },
    prizeType: formState.prizeType,
    startDate: formState.startDate || undefined,
    strategyId: formState.strategyId,
    windowSize: formState.windowSize
  };
}

export function toBacktestChartPoints(backtest: BacktestReadModel) {
  return backtest.results.map((result, index) => ({
    id: result.id,
    label: `${index + 1}`,
    value: result.isHit ? 100 : Math.max(15, 30 - (result.rankOfHit ?? 0) * 5)
  }));
}

export function mergeBacktestHistory(
  history: BacktestHistoryResponse,
  backtest: BacktestReadModel
): BacktestHistoryResponse {
  return {
    ...history,
    items: [
      {
        candidateCount: backtest.run.candidateCount,
        computedAt: backtest.run.computedAt,
        coverage: backtest.run.coverage,
        hitRate: backtest.run.hitRate,
        id: backtest.run.id,
        longestMissStreak: backtest.run.longestMissStreak,
        lotteryType: backtest.run.lotteryType,
        numberLength: backtest.run.numberLength,
        prizeType: backtest.run.prizeType,
        strategyId: backtest.run.strategyId,
        strategyName: backtest.run.strategyName,
        version: backtest.run.version
      },
      ...history.items.filter((item) => item.id !== backtest.run.id)
    ].slice(0, 8)
  };
}
