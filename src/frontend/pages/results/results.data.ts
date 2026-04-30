import { resultsContent } from "@/frontend/pages/results/results.content";
import { toResultsModel, toResultsShellModel } from "@/frontend/pages/results/results.mappers";
import resultsMockJson from "@/frontend/pages/results/results.mock.json";
import { type SearchQuery, toResultsApiQuery } from "@/frontend/pages/results/results.query";
import { ApiHttpError, apiGet } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import {
  type Draw,
  type DrawDetailResponse,
  type DrawListResponse,
  drawDetailResponseSchema,
  drawListResponseSchema
} from "@/schema/app/draw.schema";
import { type ResultsReadModel, resultsReadModelSchema } from "@/schema/app/results.schema";

const resultsShell = resultsReadModelSchema.parse(resultsMockJson);

export type ResultsPageData =
  | { model: ResultsReadModel; state: "error" }
  | { model: ResultsReadModel; state: "ready" }
  | { model: ResultsReadModel; state: "empty" };
export type ResultsDetailData =
  | { draw: Draw; state: "ready" }
  | { draw: null; state: "error" }
  | { draw: null; state: "notFound" };

export async function getResultsPageData(query: SearchQuery): Promise<ResultsPageData> {
  try {
    const response = await apiGet<DrawListResponse>(apiRoutes.draws, {
      cache: "no-store",
      query: toResultsApiQuery(query),
      schema: drawListResponseSchema
    });
    const model = resultsReadModelSchema.parse(
      toResultsModel(response, resultsShell, resultsContent)
    );

    return {
      model,
      state: model.draws.length > 0 ? "ready" : "empty"
    };
  } catch {
    return {
      model: toResultsShellModel(resultsShell, resultsContent.fallbackNotes.error),
      state: "error"
    };
  }
}

export async function getDrawDetail(id: string): Promise<ResultsDetailData> {
  try {
    const response = await apiGet<DrawDetailResponse>(`${apiRoutes.draws}/${id}`, {
      cache: "no-store",
      schema: drawDetailResponseSchema
    });

    return {
      draw: response.draw,
      state: "ready"
    };
  } catch (error) {
    if (error instanceof ApiHttpError && error.status === 404) {
      return {
        draw: null,
        state: "notFound"
      };
    }

    return {
      draw: null,
      state: "error"
    };
  }
}
