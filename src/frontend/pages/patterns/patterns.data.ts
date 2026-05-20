import { apiGet } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import { patternsReadModelSchema } from "@/schema/app/patterns.schema";
import {
  buildEmptyPatternReadModel,
  buildPatternReadModelFromSnapshot,
  type PatternPageQuery,
  type PatternReadModel,
  parsePatternSearchParams,
  toPatternsAnalyticsQuery
} from "./patterns.mappers";

export type PatternsPageData =
  | { model: PatternReadModel; query: PatternPageQuery; state: "error" }
  | { model: PatternReadModel; query: PatternPageQuery; state: "ready" }
  | { model: PatternReadModel; query: PatternPageQuery; state: "empty" };

export async function getPatternsPageData(
  searchParams?: Record<string, string | string[] | undefined> | URLSearchParams
): Promise<PatternsPageData> {
  const query = parsePatternSearchParams(searchParams);

  try {
    const snapshot = await apiGet(apiRoutes.patterns, {
      cache: "no-store",
      query: toPatternsAnalyticsQuery(query),
      schema: patternsReadModelSchema
    });
    const model = buildPatternReadModelFromSnapshot(snapshot, query);

    return {
      model,
      query,
      state: snapshot.source === "snapshot" && model.totalHits > 0 ? "ready" : "empty"
    };
  } catch {
    return {
      model: buildEmptyPatternReadModel(query),
      query,
      state: "error"
    };
  }
}
