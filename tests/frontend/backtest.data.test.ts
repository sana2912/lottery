import { describe, expect, test } from "bun:test";
import { emptyHistory, isBacktestNotFoundError } from "@/frontend/pages/backtest/backtest.data";
import { ApiHttpError } from "@/lib/api/http";

describe("backtest data helpers", () => {
  test("exports a schema-valid empty history", () => {
    expect(emptyHistory).toEqual({
      generatedAt: "1970-01-01T00:00:00.000Z",
      items: [],
      source: "api"
    });
  });

  test("recognizes a 404 API error as not found", () => {
    const notFoundError = new ApiHttpError(
      new Response("Not found", {
        status: 404,
        statusText: "Not Found"
      }),
      { error: "Not found" }
    );

    expect(isBacktestNotFoundError(notFoundError)).toBe(true);
    expect(
      isBacktestNotFoundError(
        new ApiHttpError(
          new Response("Server error", {
            status: 500,
            statusText: "Internal Server Error"
          }),
          { error: "Server error" }
        )
      )
    ).toBe(false);
  });
});
