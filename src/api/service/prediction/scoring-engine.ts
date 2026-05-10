import type { PredictionStrategy } from "@/api/service/prediction/strategy-registry";
import {
  getShapeNaturalnessScore,
  getShapePatternScore,
  getShapeReasons
} from "@/lib/app/number-shape";
import type { ApiNumberStat } from "@/schema/api/analytics";
import type { ApiPredictionResult, ApiPredictionScoreBreakdown } from "@/schema/api/prediction";

export const PREDICTION_ENGINE_VERSION = "prediction-engine-v1";

type ScoreNumberInput = {
  inputWindow: number;
  rank: number;
  stat: ApiNumberStat;
  strategy: PredictionStrategy;
};

export function scoreNumber({
  inputWindow,
  rank,
  stat,
  strategy
}: ScoreNumberInput): ApiPredictionResult {
  const scoreBreakdown = getScoreBreakdown(stat);
  const score = getWeightedScore(scoreBreakdown, strategy.weights);

  return {
    id: `${strategy.id}-${stat.prizeType}-${stat.number}`,
    inputWindow,
    number: stat.number,
    numberLength: stat.numberLength,
    positionBreakdown: [],
    rank,
    reasons: getReasons(stat),
    score,
    scoreBreakdown,
    strategyId: strategy.id,
    strategyName: strategy.name,
    version: PREDICTION_ENGINE_VERSION
  };
}

function getScoreBreakdown(stat: ApiNumberStat): ApiPredictionScoreBreakdown {
  return {
    hot: clamp(stat.frequencyPercent * 4),
    overdue: clamp(stat.missingDrawCount * 8),
    pair: getShapeNaturalnessScore(stat.number),
    pattern: getShapePatternScore(stat.number),
    position: clamp(stat.trendScore)
  };
}

function getWeightedScore(
  scoreBreakdown: ApiPredictionScoreBreakdown,
  weights: ApiPredictionScoreBreakdown
) {
  return round(
    scoreBreakdown.hot * weights.hot +
      scoreBreakdown.overdue * weights.overdue +
      scoreBreakdown.pair * weights.pair +
      scoreBreakdown.pattern * weights.pattern +
      scoreBreakdown.position * weights.position
  );
}

function getReasons(stat: ApiNumberStat) {
  const reasons = [
    `Historical frequency is ${stat.frequencyPercent}% in the selected window.`,
    `Missing draw count is ${stat.missingDrawCount}.`,
    `Trend score is ${stat.trendScore}.`
  ];

  if (stat.patternFlags.length > 0) {
    reasons.push(`Pattern flags: ${stat.patternFlags.join(", ")}.`);
  }

  reasons.push(...getShapeReasons(stat.number));

  if (stat.lastSeenDrawDate) {
    reasons.push(`Last seen at ${stat.lastSeenDrawDate}.`);
  }

  return reasons;
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, round(value)));
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
