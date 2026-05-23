import { beforeEach, describe, expect, mock, test } from "bun:test";
import { ApiHttpError } from "@/lib/api/http";
import type { PatternsApiReadModel } from "@/schema/app/patterns.schema";

const apiGet = mock<() => Promise<PatternsApiReadModel>>(async () => createPatternsSnapshot());

mock.module("@/lib/api/http", () => ({
  ApiHttpError,
  apiGet,
  apiPost: mock()
}));

describe("prediction-lab.data", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiGet.mockImplementation(async () => createPatternsSnapshot());
  });

  test("getPatternPlaygroundOptions loads patterns snapshot for prize type", async () => {
    const { getPatternPlaygroundOptions } = await import(
      "@/frontend/pages/prediction-lab/prediction-lab.data"
    );

    const options = await getPatternPlaygroundOptions("TWO_DIGIT");

    expect(apiGet).toHaveBeenCalled();
    expect(options.some((option) => option.id === "ascending")).toBe(true);
    expect(options[0]?.percent).toBeGreaterThanOrEqual(0);
  });

  test("getLatestPredictionRun returns null on 404", async () => {
    const { getLatestPredictionRun } = await import(
      "@/frontend/pages/prediction-lab/prediction-lab.data"
    );

    apiGet.mockImplementation(async () => {
      throw new ApiHttpError(
        new Response("Not found", {
          status: 404,
          statusText: "Not Found"
        }),
        { error: "Not found" }
      );
    });

    await expect(getLatestPredictionRun()).resolves.toBeNull();
  });
});

function createPatternsSnapshot(): PatternsApiReadModel {
  return {
    context: {
      lotteryType: "THAI_GOVERNMENT",
      numberLength: 2,
      prizeType: "TWO_DIGIT",
      scope: "ALL_TIME",
      windowPreset: "ALL",
      windowSize: 4
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
