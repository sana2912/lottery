type QueryPrimitive = boolean | Date | number | string | null | undefined;
type QueryValue = QueryPrimitive | readonly QueryPrimitive[];
export type QueryInput = Record<string, QueryValue>;

type Parser<T> = {
  parse: (value: unknown) => T;
};

export type ApiRequestOptions<T> = Omit<RequestInit, "body"> & {
  body?: BodyInit | null;
  fetcher?: typeof fetch;
  json?: unknown;
  query?: QueryInput;
  schema?: Parser<T>;
};

export class ApiHttpError extends Error {
  readonly payload: unknown;
  readonly status: number;
  readonly statusText: string;

  constructor(response: Response, payload: unknown) {
    super(`API request failed with ${response.status} ${response.statusText}`);
    this.name = "ApiHttpError";
    this.payload = payload;
    this.status = response.status;
    this.statusText = response.statusText;
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  { body, fetcher = fetch, headers, json, query, schema, ...init }: ApiRequestOptions<T> = {}
): Promise<T> {
  const response = await fetcher(resolveRequestUrl(appendQueryString(path, query)), {
    ...init,
    body: json === undefined ? body : JSON.stringify(json),
    headers: createHeaders(headers, json !== undefined)
  });

  const payload = await readPayload(response);

  if (!response.ok) {
    throw new ApiHttpError(response, payload);
  }

  return schema ? schema.parse(payload) : (payload as T);
}

export function apiGet<T = unknown>(
  path: string,
  options?: Omit<ApiRequestOptions<T>, "body" | "json" | "method">
) {
  return apiRequest<T>(path, { ...options, method: "GET" });
}

export function apiPost<T = unknown>(
  path: string,
  json?: unknown,
  options?: Omit<ApiRequestOptions<T>, "body" | "json" | "method">
) {
  return apiRequest<T>(path, { ...options, json, method: "POST" });
}

export const apiHttp = {
  ApiHttpError,
  apiGet,
  apiPost,
  apiRequest
} as const;

function createHeaders(headers: HeadersInit | undefined, hasJsonBody: boolean): Headers {
  const nextHeaders = new Headers(headers);

  if (hasJsonBody && !nextHeaders.has("content-type")) {
    nextHeaders.set("content-type", "application/json");
  }

  if (!nextHeaders.has("accept")) {
    nextHeaders.set("accept", "application/json");
  }

  return nextHeaders;
}

function appendQueryString(path: string, query?: QueryInput): string {
  if (!query) {
    return path;
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    appendQueryValue(searchParams, key, value);
  }

  const queryString = searchParams.toString();

  if (!queryString) {
    return path;
  }

  return `${path}${path.includes("?") ? "&" : "?"}${queryString}`;
}

async function readPayload(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

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

function resolveRequestUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");

  return new URL(path, baseUrl).toString();
}
