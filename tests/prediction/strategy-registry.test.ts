import { describe, expect, test } from "bun:test";
import {
  getPredictionStrategy,
  predictionStrategies
} from "@/api/service/prediction/strategy-registry";

describe("prediction strategy registry", () => {
  test("returns the expected strategy profiles", () => {
    expect(getPredictionStrategy("balanced")).toEqual({
      id: "balanced",
      name: "Balanced",
      weights: {
        hot: 0.3,
        overdue: 0.2,
        pair: 0.1,
        pattern: 0.15,
        position: 0.25
      }
    });
    expect(getPredictionStrategy("coldRebound")).toEqual({
      id: "coldRebound",
      name: "Cold rebound",
      weights: {
        hot: 0.1,
        overdue: 0.45,
        pair: 0.1,
        pattern: 0.15,
        position: 0.2
      }
    });
    expect(getPredictionStrategy("hotTrend")).toEqual({
      id: "hotTrend",
      name: "Hot trend",
      weights: {
        hot: 0.5,
        overdue: 0.05,
        pair: 0.1,
        pattern: 0.1,
        position: 0.25
      }
    });
  });

  test("exposes a complete registry with weights that sum to one", () => {
    const ids = Object.keys(predictionStrategies).sort();

    expect(ids).toEqual(["balanced", "coldRebound", "hotTrend"]);

    for (const strategy of Object.values(predictionStrategies)) {
      const totalWeight = Object.values(strategy.weights).reduce((sum, value) => sum + value, 0);

      expect(totalWeight).toBe(1);
    }
  });
});
