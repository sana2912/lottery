import type { PredictionStrategy } from "@/api/service/prediction/strategy-registry";
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
    rank,
    reasons: getReasons(stat, scoreBreakdown),
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
    pair: getPairScore(stat.number),
    pattern: getPatternScore(stat),
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

function getReasons(stat: ApiNumberStat, scoreBreakdown: ApiPredictionScoreBreakdown) {
  const reasons = [
    `Historical frequency is ${stat.frequencyPercent}% in the selected window.`,
    `Missing draw count is ${stat.missingDrawCount}.`,
    `Trend score is ${stat.trendScore}.`
  ];

  if (scoreBreakdown.pattern > 0) {
    reasons.push(`Pattern flags: ${stat.patternFlags.join(", ")}.`);
  }

  if (stat.lastSeenDrawDate) {
    reasons.push(`Last seen at ${stat.lastSeenDrawDate}.`);
  }

  return reasons;
}

function getPairScore(number: string) {
  if (number.length < 2) {
    return 0;
  }

  const uniqueDigits = new Set([...number]).size;

  return clamp((1 - uniqueDigits / number.length) * 100);
}

function getPatternScore(stat: ApiNumberStat) {
  return clamp(stat.patternFlags.length * 18);
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, round(value)));
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
