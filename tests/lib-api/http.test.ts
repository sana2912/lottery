import { describe, expect, test } from "bun:test";
import { ApiHttpError, apiGet, apiPost, apiRequest } from "@/lib/api/http";

function createFetcher(
  implementation: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
): typeof fetch {
  return Object.assign(implementation, {
    preconnect(_url: string | URL) {
      return undefined;
    }
  }) as typeof fetch;
}

describe("apiRequest", () => {
  test("appends query params, skips empty values, and serializes dates", async () => {
    let requestUrl = "";

    const response = await apiRequest<{ ok: boolean }>("/api/test", {
      fetcher: createFetcher(async (input, init) => {
        requestUrl = String(input);

        expect(init?.method).toBe("GET");

        return new Response(JSON.stringify({ ok: true }), {
          headers: {
            "content-type": "application/json"
          },
          status: 200
        });
      }),
      method: "GET",
      query: {
        archived: false,
        empty: "",
        endDate: undefined,
        page: 2,
        startDate: new Date("2026-04-29T00:00:00.000Z"),
        tags: ["hot", null, "cold"]
      }
    });

    expect(response).toEqual({ ok: true });
    expect(requestUrl).toBe(
      "/api/test?archived=false&page=2&startDate=2026-04-29T00%3A00%3A00.000Z&tags=hot&tags=cold"
    );
  });

  test("parses JSON response with the provided schema", async () => {
    const parsedPayload = await apiRequest("/api/schema", {
      fetcher: createFetcher(
        async () =>
          new Response(JSON.stringify({ count: 3, scope: "global" }), {
            headers: {
              "content-type": "application/json"
            },
            status: 200
          })
      ),
      schema: {
        parse(value) {
          expect(value).toEqual({ count: 3, scope: "global" });

          return { parsed: true, value };
        }
      }
    });

    expect(parsedPayload).toEqual({
      parsed: true,
      value: { count: 3, scope: "global" }
    });
  });

  test("uses JSON body and default headers for apiPost", async () => {
    const payload = { count: 5, strategy: "frequency" };

    const response = await apiPost<{ saved: boolean }>("/api/predictions", payload, {
      fetcher: createFetcher(async (_input, init) => {
        expect(init?.method).toBe("POST");
        expect(init?.body).toBe(JSON.stringify(payload));

        const headers = new Headers(init?.headers);

        expect(headers.get("accept")).toBe("application/json");
        expect(headers.get("content-type")).toBe("application/json");

        return new Response(JSON.stringify({ saved: true }), {
          headers: {
            "content-type": "application/json"
          },
          status: 200
        });
      })
    });

    expect(response).toEqual({ saved: true });
  });

  test("returns null for 204 responses", async () => {
    const response = await apiRequest("/api/watchlist/123", {
      fetcher: createFetcher(
        async () =>
          new Response(null, {
            status: 204
          })
      )
    });

    expect(response).toBeNull();
  });

  test("throws ApiHttpError on non-2xx responses with parsed payload", async () => {
    const failingRequest = apiGet("/api/failure", {
      fetcher: createFetcher(
        async () =>
          new Response(JSON.stringify({ error: "Bad request" }), {
            headers: {
              "content-type": "application/json"
            },
            status: 400,
            statusText: "Bad Request"
          })
      )
    });

    try {
      await failingRequest;
      throw new Error("Expected request to throw ApiHttpError");
    } catch (error) {
      if (error instanceof Error && error.message === "Expected request to throw ApiHttpError") {
        throw error;
      }

      expect(error).toBeInstanceOf(ApiHttpError);

      const apiError = error as ApiHttpError;

      expect(apiError.message).toBe("API request failed with 400 Bad Request");
      expect(apiError.status).toBe(400);
      expect(apiError.statusText).toBe("Bad Request");
      expect(apiError.payload).toEqual({ error: "Bad request" });
    }
  });
});
