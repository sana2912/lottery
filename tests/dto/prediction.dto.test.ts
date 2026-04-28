import { describe, expect, test } from "bun:test";
import { toApiPredictionResponse, toApiPredictionResult } from "@/api/model/dto/prediction.dto";
import { predictionResponseSchema } from "@/schema/app/prediction.schema";

describe("prediction.dto", () => {
  test("normalizes generatedAt, copies reasons, and strips unknown fields", () => {
    const reasons = ["Hot trend", "Strong pair support"] as const;
    const scoreBreakdown = {
      hot: 20,
      overdue: 10,
      pair: 15,
      pattern: 8,
      position: 12
    };
    const result = toApiPredictionResult({
      extra: "skip",
      id: "prediction-1",
      inputWindow: 120,
      number: "09",
      numberLength: 2,
      rank: 1,
      reasons,
      score: 65,
      scoreBreakdown,
      strategyId: "balanced",
      strategyName: "Balanced",
      version: "v1"
    } as never);

    expect(result.reasons).toEqual(["Hot trend", "Strong pair support"]);
    expect(result.reasons).not.toBe(reasons);
    expect(result.scoreBreakdown).toEqual(scoreBreakdown);
    expect(result.scoreBreakdown).not.toBe(scoreBreakdown);
    expect(result).not.toHaveProperty("extra");

    const response = toApiPredictionResponse({
      generatedAt: new Date("2026-04-29T00:00:00.000Z"),
      input: {
        count: 5,
        lotteryType: "THAI_GOVERNMENT",
        numberLength: 2,
        prizeType: "TWO_DIGIT",
        strategyId: "balanced",
        windowSize: 120
      },
      results: [result],
      source: "api"
    });

    expect(response.generatedAt).toBe("2026-04-29T00:00:00.000Z");
    expect(predictionResponseSchema.parse(response)).toEqual(response);
  });
});
