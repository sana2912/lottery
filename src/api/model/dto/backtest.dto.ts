import type {
  ApiBacktestHistoryItem,
  ApiBacktestHistoryResponse,
  ApiBacktestReadModel,
  ApiBacktestResult,
  ApiBacktestRun
} from "@/schema/api/backtest";

type BacktestRunDtoInput = Omit<ApiBacktestRun, "computedAt" | "endDrawDate" | "startDrawDate"> & {
  computedAt: Date | string;
  endDrawDate: Date | string;
  startDrawDate: Date | string;
};

type BacktestResultDtoInput = Omit<
  ApiBacktestResult,
  "actualNumbers" | "drawDate" | "generatedNumbers" | "hitNumbers"
> & {
  actualNumbers: readonly string[];
  drawDate: Date | string;
  generatedNumbers: readonly string[];
  hitNumbers: readonly string[];
};

type BacktestReadModelDtoInput = Omit<ApiBacktestReadModel, "generatedAt" | "results" | "run"> & {
  generatedAt: Date | string;
  results: readonly BacktestResultDtoInput[];
  run: BacktestRunDtoInput;
};

type BacktestHistoryItemDtoInput = Omit<ApiBacktestHistoryItem, "computedAt"> & {
  computedAt: Date | string;
};

type BacktestHistoryResponseDtoInput = Omit<ApiBacktestHistoryResponse, "generatedAt" | "items"> & {
  generatedAt: Date | string;
  items: readonly BacktestHistoryItemDtoInput[];
};

export function toApiBacktestRun(run: BacktestRunDtoInput): ApiBacktestRun {
  return {
    averageHitRank: run.averageHitRank,
    candidateCount: run.candidateCount,
    computedAt: normalizeDateString(run.computedAt),
    coverage: run.coverage,
    endDrawDate: normalizeDateString(run.endDrawDate),
    hitRate: run.hitRate,
    id: run.id,
    longestMissStreak: run.longestMissStreak,
    lotteryType: run.lotteryType,
    numberLength: run.numberLength,
    params: run.params,
    prizeType: run.prizeType,
    startDrawDate: normalizeDateString(run.startDrawDate),
    strategyId: run.strategyId,
    strategyName: run.strategyName,
    version: run.version
  };
}

export function toApiBacktestResult(result: BacktestResultDtoInput): ApiBacktestResult {
  return {
    actualNumbers: [...result.actualNumbers],
    drawDate: normalizeDateString(result.drawDate),
    drawId: result.drawId,
    generatedNumbers: [...result.generatedNumbers],
    hitNumbers: [...result.hitNumbers],
    id: result.id,
    isHit: result.isHit,
    rankOfHit: result.rankOfHit,
    runId: result.runId
  };
}

export function toApiBacktestReadModel(model: BacktestReadModelDtoInput): ApiBacktestReadModel {
  return {
    generatedAt: normalizeDateString(model.generatedAt),
    results: model.results.map(toApiBacktestResult),
    run: toApiBacktestRun(model.run),
    source: model.source
  };
}

export function toApiBacktestHistoryItem(
  item: BacktestHistoryItemDtoInput
): ApiBacktestHistoryItem {
  return {
    candidateCount: item.candidateCount,
    computedAt: normalizeDateString(item.computedAt),
    coverage: item.coverage,
    hitRate: item.hitRate,
    id: item.id,
    longestMissStreak: item.longestMissStreak,
    lotteryType: item.lotteryType,
    numberLength: item.numberLength,
    prizeType: item.prizeType,
    strategyId: item.strategyId,
    strategyName: item.strategyName,
    version: item.version
  };
}

export function toApiBacktestHistoryResponse(
  response: BacktestHistoryResponseDtoInput
): ApiBacktestHistoryResponse {
  return {
    generatedAt: normalizeDateString(response.generatedAt),
    items: response.items.map(toApiBacktestHistoryItem),
    source: response.source
  };
}

function normalizeDateString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}
