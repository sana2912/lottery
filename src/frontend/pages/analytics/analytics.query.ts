import { type FilterContext, filterContextSchema } from "@/schema/app/query.schema";

export type { FilterContext } from "@/schema/app/query.schema";

type SearchParamsInput =
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | undefined;

export function parseAnalyticsSearchParams(searchParams?: SearchParamsInput): FilterContext {
  return filterContextSchema.parse(toSearchParamRecord(searchParams));
}

export function buildAnalyticsHref(
  query: FilterContext,
  overrides: Partial<FilterContext> = {}
): string {
  const next = { ...query, ...overrides };
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(next)) {
    if (value === undefined || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const queryString = searchParams.toString();

  return queryString ? `/analytics?${queryString}` : "/analytics";
}

export function toAnalyticsApiQuery(query: FilterContext) {
  return {
    endDate: query.endDate,
    lotteryType: query.lotteryType,
    month: query.month,
    numberLength: query.numberLength,
    page: query.page,
    pageSize: query.pageSize,
    prizeType: query.prizeType,
    q: query.q,
    startDate: query.startDate,
    windowSize: query.windowSize,
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
