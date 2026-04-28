type QueryPrimitive = boolean | Date | number | string | null | undefined;
export type QueryValue = QueryPrimitive | readonly QueryPrimitive[];
export type QueryInput = Record<string, QueryValue>;

type Parser<T> = {
  parse: (value: unknown) => T;
};

export function toSearchParams(query?: QueryInput): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (!query) {
    return searchParams;
  }

  for (const [key, value] of Object.entries(query)) {
    appendQueryValue(searchParams, key, value);
  }

  return searchParams;
}

export function appendQueryString(path: string, query?: QueryInput): string {
  const searchParams = toSearchParams(query);
  const queryString = searchParams.toString();

  if (!queryString) {
    return path;
  }

  return `${path}${path.includes("?") ? "&" : "?"}${queryString}`;
}

export function getSearchParams(input: Request | URL | string): URLSearchParams {
  if (typeof input === "string") {
    return new URL(input, "http://localhost").searchParams;
  }

  if (input instanceof URL) {
    return input.searchParams;
  }

  return new URL(input.url).searchParams;
}

export function searchParamsToObject(
  searchParams: URLSearchParams
): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {};

  for (const key of new Set(searchParams.keys())) {
    const values = searchParams.getAll(key);
    query[key] = values.length > 1 ? values : (values[0] ?? "");
  }

  return query;
}

export function parseQuery<T>(
  input: Request | URL | string | URLSearchParams,
  parser: Parser<T>
): T {
  const searchParams = input instanceof URLSearchParams ? input : getSearchParams(input);

  return parser.parse(searchParamsToObject(searchParams));
}

export const apiQuery = {
  appendQueryString,
  getSearchParams,
  parseQuery,
  searchParamsToObject,
  toSearchParams
} as const;

function appendQueryValue(searchParams: URLSearchParams, key: string, value: QueryValue) {
  if (isQueryValueArray(value)) {
    for (const item of value) {
      appendQueryPrimitive(searchParams, key, item);
    }

    return;
  }

  appendQueryPrimitive(searchParams, key, value);
}

function appendQueryPrimitive(searchParams: URLSearchParams, key: string, value: QueryPrimitive) {
  if (value === null || value === undefined || value === "") {
    return;
  }

  searchParams.append(key, value instanceof Date ? value.toISOString() : String(value));
}

function isQueryValueArray(value: QueryValue): value is readonly QueryPrimitive[] {
  return Array.isArray(value);
}
