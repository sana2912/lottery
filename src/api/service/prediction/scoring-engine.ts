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
    hot: getExactNumberHotScore(stat),
    overdue: getExactNumberOverdueScore(stat),
    pair: getShapeNaturalnessScore(stat.number),
    pattern: getShapePatternScore(stat.number),
    position: clamp(stat.trendScore)
  };
}

function getExactNumberHotScore(stat: ApiNumberStat) {
  const frequencyPercent = stat.frequencyPerPrizeRowPercent ?? stat.frequencyPercent;

  if (stat.numberLength >= 6) {
    return clamp(frequencyPercent * 25);
  }

  if (stat.numberLength === 3) {
    return clamp(frequencyPercent * 50);
  }

  return clamp(frequencyPercent * 12.5);
}

function getExactNumberOverdueScore(stat: ApiNumberStat) {
  if (stat.missingDrawCount <= 0) {
    return 0;
  }

  const samplePrizeCount = stat.samplePrizeCount ?? stat.drawCount;
  const rowsPerDraw = stat.drawCount > 0 ? samplePrizeCount / stat.drawCount : 1;
  const universeSize = 10 ** stat.numberLength;
  const expectedPresenceRate = Math.min(1, rowsPerDraw / universeSize);
  const missingProbability = (1 - expectedPresenceRate) ** stat.missingDrawCount;

  return clamp((1 - missingProbability) * 100);
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
