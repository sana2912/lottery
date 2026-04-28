import { resultsContent } from "@/frontend/pages/results/results.content";
import { getMockDraw, toResultsModel } from "@/frontend/pages/results/results.mappers";
import resultsMockJson from "@/frontend/pages/results/results.mock.json";
import { apiGet } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import {
  type Draw,
  type DrawDetailResponse,
  type DrawListResponse,
  drawDetailResponseSchema,
  drawListResponseSchema
} from "@/schema/app/draw.schema";
import { type ResultsReadModel, resultsReadModelSchema } from "@/schema/app/results.schema";

const resultsFallback = resultsReadModelSchema.parse(resultsMockJson);

export async function getResultsModel(): Promise<ResultsReadModel> {
  try {
    const response = await apiGet<DrawListResponse>(apiRoutes.draws, {
      cache: "no-store",
      schema: drawListResponseSchema
    });

    return resultsReadModelSchema.parse(toResultsModel(response, resultsFallback, resultsContent));
  } catch {
    return resultsFallback;
  }
}

export async function getDrawDetail(id: string): Promise<Draw | null> {
  try {
    const response = await apiGet<DrawDetailResponse>(`${apiRoutes.draws}/${id}`, {
      cache: "no-store",
      schema: drawDetailResponseSchema
    });

    return response.draw;
  } catch {
    return getMockDraw(id, resultsFallback);
  }
}
