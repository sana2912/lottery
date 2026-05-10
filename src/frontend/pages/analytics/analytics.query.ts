import { type FilterContext, filterContextSchema } from "@/schema/app/query.schema";

export type { FilterContext } from "@/schema/app/query.schema";

type SearchParamsInput =
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | undefined;

export function parseAnalyticsSearchParams(searchParams?: SearchParamsInput): FilterContext {
  const record = toSearchParamRecord(searchParams);
  const query = filterContextSchema.parse(record);

  return {
    ...query,
    numberLength: query.numberLength ?? getDefaultNumberLength(query.prizeType),
    prizeType: query.prizeType ?? "TWO_DIGIT",
    windowSize: record.windowSize === undefined ? 30 : query.windowSize
  };
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

function getDefaultNumberLength(prizeType: FilterContext["prizeType"]) {
  switch (prizeType) {
    case "THREE_DIGIT":
    case "THREE_FRONT":
    case "THREE_BACK":
      return 3;
    case "FIRST":
    case "NEAR_FIRST":
    case "PRIZE2":
    case "PRIZE3":
    case "PRIZE4":
    case "PRIZE5":
      return 6;
    default:
      return 2;
  }
}
