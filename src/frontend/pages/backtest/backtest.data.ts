import { apiGet, apiHttp, apiPost } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import {
  type BacktestHistoryResponse,
  type BacktestReadModel,
  type BacktestRequest,
  backtestHistoryResponseSchema,
  backtestReadModelSchema
} from "@/schema/app/backtest.schema";

export const emptyHistory = backtestHistoryResponseSchema.parse({
  generatedAt: new Date(0).toISOString(),
  items: [],
  source: "api"
});

export async function getBacktestHistory() {
  return apiGet<BacktestHistoryResponse>(apiRoutes.backtests, {
    schema: backtestHistoryResponseSchema
  });
}

export async function getBacktestRun(id: string) {
  return apiGet<BacktestReadModel>(`${apiRoutes.backtests}/${id}`, {
    schema: backtestReadModelSchema
  });
}

export async function getLatestBacktestPageData() {
  const history = await getBacktestHistory();
  const latestRunId = history.items[0]?.id;

  if (!latestRunId) {
    return {
      backtest: null,
      history
    };
  }

  return {
    backtest: await getBacktestRun(latestRunId),
    history
  };
}

export async function runBacktestRequest(payload: BacktestRequest) {
  return apiPost<BacktestReadModel>(apiRoutes.backtests, payload, {
    schema: backtestReadModelSchema
  });
}

export function isBacktestNotFoundError(error: unknown) {
  return error instanceof apiHttp.ApiHttpError && error.status === 404;
}

export type BacktestPageHistory = BacktestHistoryResponse;
export type BacktestPageModel = BacktestReadModel;
