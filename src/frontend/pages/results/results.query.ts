import { type SearchQuery, searchQuerySchema } from "@/schema/app/query.schema";

export type { SearchQuery } from "@/schema/app/query.schema";

type SearchParamsInput =
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | undefined;

export function parseResultsSearchParams(searchParams?: SearchParamsInput): SearchQuery {
  return searchQuerySchema.parse(toSearchParamRecord(searchParams));
}

export function buildResultsHref(query: SearchQuery, overrides: Partial<SearchQuery> = {}): string {
  const next = { ...query, ...overrides };
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(next)) {
    if (value === undefined || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const queryString = searchParams.toString();

  return queryString ? `/results?${queryString}` : "/results";
}

export function getResultsFilterPills(query: SearchQuery) {
  return [
    query.q ? `Query: ${query.q}` : null,
    query.prizeType ? `Prize: ${query.prizeType}` : null,
    query.year ? `Year: ${query.year}` : null,
    query.month ? `Month: ${query.month}` : null
  ].flatMap((value) => (value ? [value] : []));
}

export function toResultsApiQuery(query: SearchQuery) {
  return {
    endDate: query.endDate,
    lotteryType: query.lotteryType,
    month: query.month,
    page: query.page,
    pageSize: query.pageSize,
    prizeType: query.prizeType,
    q: query.q,
    startDate: query.startDate,
    year: query.year
  };
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
