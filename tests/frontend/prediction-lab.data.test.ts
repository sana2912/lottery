import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  getLatestPredictionRun,
  getPatternPlaygroundOptions
} from "@/frontend/pages/prediction-lab/prediction-lab.data";
import type { PatternsApiReadModel } from "@/schema/app/patterns.schema";

const originalFetch = globalThis.fetch;

describe("prediction-lab.data", () => {
  beforeEach(() => {
    globalThis.fetch = createFetcher(
      async () =>
        new Response(JSON.stringify(createPatternsSnapshot()), {
          headers: {
            "content-type": "application/json"
          },
          status: 200
        })
    );
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("getPatternPlaygroundOptions loads patterns snapshot for prize type", async () => {
    let requestCount = 0;

    globalThis.fetch = createFetcher(async () => {
      requestCount += 1;

      return new Response(JSON.stringify(createPatternsSnapshot()), {
        headers: {
          "content-type": "application/json"
        },
        status: 200
      });
    });

    const options = await getPatternPlaygroundOptions("TWO_DIGIT");
    const cachedOptions = await getPatternPlaygroundOptions("TWO_DIGIT");

    expect(options.some((option) => option.id === "ascending")).toBe(true);
    expect(cachedOptions).toEqual(options);
    expect(options[0]?.percent).toBeGreaterThanOrEqual(0);
    expect(requestCount).toBe(1);
  });

  test("getLatestPredictionRun returns null on 404", async () => {
    globalThis.fetch = createFetcher(
      async () =>
        new Response(JSON.stringify({ error: "Not found" }), {
          headers: {
            "content-type": "application/json"
          },
          status: 404,
          statusText: "Not Found"
        })
    );

    await expect(getLatestPredictionRun()).resolves.toBeNull();
  });
});

function createFetcher(
  implementation: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
): typeof fetch {
  return Object.assign(implementation, {
    preconnect(_url: string | URL) {
      return undefined;
    }
  }) as typeof fetch;
}

function createPatternsSnapshot(): PatternsApiReadModel {
  return {
    context: {
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      prizeType: "TWO_DIGIT",
      scope: "ALL_TIME"
    },
    generatedAt: "2026-04-28T00:00:00.000Z",
    pattern: {
      distribution: [],
      examples: [],
      overview: [
        {
          examples: ["12"],
          hitCount: 1,
          id: "ascending",
          label: "ascending",
          pattern: "ascending",
          percent: 25,
          sampleSize: 4
        }
      ],
      sampleSize: 4
    },
    source: "snapshot",
    summary: {
      drawCount: 2,
      generatedAt: "2026-04-28T00:00:00.000Z"
    }
  };
}
