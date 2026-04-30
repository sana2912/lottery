import { ApiHttpError, apiGet } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import { type SearchQuery, searchQuerySchema } from "@/schema/app/query.schema";
import { type SearchReadModel, searchReadModelSchema } from "@/schema/app/search.schema";

type SearchParamsInput =
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | undefined;

export type SearchPageData =
  | { model: SearchReadModel; query: SearchQuery; state: "error" }
  | { model: SearchReadModel; query: SearchQuery; state: "ready" }
  | { model: SearchReadModel; query: SearchQuery; state: "empty" };

const searchShell = searchReadModelSchema.parse({
  generatedAt: "2026-04-29T00:00:00.000Z",
  groups: {
    draws: [],
    prizes: [],
    stats: [],
    watchlist: []
  },
  q: "",
  source: "api"
});

export async function getSearchPageData(searchParams?: SearchParamsInput): Promise<SearchPageData> {
  const query = searchQuerySchema.parse(toSearchParamRecord(searchParams));

  try {
    const model = await apiGet<SearchReadModel>(apiRoutes.search, {
      cache: "no-store",
      query: {
        endDate: query.endDate,
        lotteryType: query.lotteryType,
        month: query.month,
        page: query.page,
        pageSize: query.pageSize,
        q: query.q,
        startDate: query.startDate,
        year: query.year
      },
      schema: searchReadModelSchema
    });

    return {
      model,
      query,
      state: hasAnyResults(model) ? "ready" : "empty"
    };
  } catch (error) {
    if (error instanceof ApiHttpError) {
      return {
        model: {
          ...searchShell,
          generatedAt: new Date().toISOString(),
          q: query.q ?? ""
        },
        query,
        state: "error"
      };
    }

    return {
      model: {
        ...searchShell,
        generatedAt: new Date().toISOString(),
        q: query.q ?? ""
      },
      query,
      state: "error"
    };
  }
}

function hasAnyResults(model: SearchReadModel) {
  return (
    model.groups.draws.length > 0 ||
    model.groups.prizes.length > 0 ||
    model.groups.stats.length > 0 ||
    model.groups.watchlist.length > 0
  );
}

function toSearchParamRecord(searchParams?: SearchParamsInput) {
  if (!searchParams) {
    return {};
  }

  if (searchParams instanceof URLSearchParams) {
    return Object.fromEntries(searchParams.entries());
  }

  return searchParams;
}
