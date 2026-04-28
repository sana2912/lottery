import type { ApiPredictionScoreBreakdown, ApiPredictionStrategyId } from "@/schema/api/prediction";

export type PredictionStrategy = {
  id: ApiPredictionStrategyId;
  name: string;
  weights: ApiPredictionScoreBreakdown;
};

export const predictionStrategies = {
  balanced: {
    id: "balanced",
    name: "Balanced",
    weights: {
      hot: 0.3,
      overdue: 0.2,
      pair: 0.1,
      pattern: 0.15,
      position: 0.25
    }
  },
  coldRebound: {
    id: "coldRebound",
    name: "Cold rebound",
    weights: {
      hot: 0.1,
      overdue: 0.45,
      pair: 0.1,
      pattern: 0.15,
      position: 0.2
    }
  },
  hotTrend: {
    id: "hotTrend",
    name: "Hot trend",
    weights: {
      hot: 0.5,
      overdue: 0.05,
      pair: 0.1,
      pattern: 0.1,
      position: 0.25
    }
  }
} satisfies Record<ApiPredictionStrategyId, PredictionStrategy>;

export function getPredictionStrategy(strategyId: ApiPredictionStrategyId) {
  return predictionStrategies[strategyId];
}
