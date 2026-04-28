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
    ...run,
    computedAt: normalizeDateString(run.computedAt),
    endDrawDate: normalizeDateString(run.endDrawDate),
    startDrawDate: normalizeDateString(run.startDrawDate)
  };
}

export function toApiBacktestResult(result: BacktestResultDtoInput): ApiBacktestResult {
  return {
    ...result,
    actualNumbers: [...result.actualNumbers],
    drawDate: normalizeDateString(result.drawDate),
    generatedNumbers: [...result.generatedNumbers],
    hitNumbers: [...result.hitNumbers]
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
    ...item,
    computedAt: normalizeDateString(item.computedAt)
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
