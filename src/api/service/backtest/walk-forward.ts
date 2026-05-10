import { randomUUID } from "node:crypto";
import { extractDigitEvents } from "@/api/service/analytics/digit-events";
import { calculateDigitStats } from "@/api/service/analytics/number-stats";
import { buildPositionPredictionResults } from "@/api/service/prediction/position-engine";
import { PREDICTION_ENGINE_VERSION } from "@/api/service/prediction/scoring-engine";
import type { PredictionStrategy } from "@/api/service/prediction/strategy-registry";
import type {
  ApiBacktestCandidateExplanation,
  ApiBacktestResult,
  ApiBacktestResultExplanation
} from "@/schema/api/backtest";

type PrizeLike = {
  draw?: DrawContext;
  drawId: string;
  number: string;
  type: string;
};

type DrawContext = {
  drawDate: Date | string;
  lotteryType: string;
};

type DrawLike = {
  drawDate: Date | string;
  id: string;
  lotteryType: string;
  prizes: readonly PrizeLike[];
};

type WalkForwardBacktestInput = {
  candidateCount: number;
  draws: readonly DrawLike[];
  numberLength?: number;
  prizeType?: string;
  runId: string;
  strategy: PredictionStrategy;
  targetDrawCount?: number;
  windowSize: number;
};

export function runWalkForwardBacktest({
  candidateCount,
  draws,
  numberLength,
  prizeType,
  runId,
  strategy,
  targetDrawCount,
  windowSize
}: WalkForwardBacktestInput): ApiBacktestResult[] {
  const sortedDraws = [...draws].sort(
    (left, right) =>
      normalizeDate(left.drawDate).getTime() - normalizeDate(right.drawDate).getTime()
  );
  const resolvedTargetDrawCount = targetDrawCount ?? windowSize;
  const targetDraws = sortedDraws.slice(-resolvedTargetDrawCount);

  return targetDraws.flatMap((targetDraw, targetIndex) => {
    const sourceTargetIndex = sortedDraws.length - targetDraws.length + targetIndex;
    const historyDraws = sortedDraws.slice(0, sourceTargetIndex).slice(-windowSize);
    const historyPrizes = historyDraws.flatMap(withDrawContext).filter(matchesPrizeContext);
    const actualNumbers = targetDraw.prizes
      .filter(matchesPrizeContext)
      .map((prize) => prize.number);

    if (historyPrizes.length === 0 || actualNumbers.length === 0) {
      return [];
    }

    const drawCount = new Set(historyPrizes.map((prize) => prize.drawId)).size;
    const digitStats = calculateDigitStats(extractDigitEvents(historyPrizes), {
      computedAt: normalizeDate(targetDraw.drawDate),
      drawCount,
      windowSize
    });
    const generatedCandidates = buildPositionPredictionResults({
      count: candidateCount,
      digitStats,
      inputWindow: windowSize,
      numberLength: numberLength ?? actualNumbers[0]?.length ?? 2,
      strategy
    });
    const generatedNumbers = generatedCandidates.map((result) => result.number);
    const hitNumbers = generatedNumbers.filter((number) => actualNumbers.includes(number));
    const firstHit = hitNumbers[0];
    const explanation =
      hitNumbers.length > 0
        ? buildBacktestResultExplanation({
            calculationWindow: windowSize,
            candidateCount,
            generatedCandidates,
            hitNumbers,
            strategy
          })
        : undefined;

    return [
      {
        actualNumbers,
        drawDate: normalizeDate(targetDraw.drawDate).toISOString(),
        drawId: targetDraw.id,
        generatedNumbers,
        hitNumbers,
        id: randomUUID(),
        isHit: hitNumbers.length > 0,
        explanation,
        rankOfHit: firstHit ? generatedNumbers.indexOf(firstHit) + 1 : undefined,
        runId
      }
    ];
  });

  function matchesPrizeContext(prize: PrizeLike) {
    if (prizeType && prize.type !== prizeType) {
      return false;
    }

    if (numberLength && prize.number.length !== numberLength) {
      return false;
    }

    return true;
  }
}

function withDrawContext(draw: DrawLike): PrizeLikeWithDraw[] {
  return draw.prizes.map((prize) => ({
    ...prize,
    draw: {
      drawDate: draw.drawDate,
      lotteryType: draw.lotteryType
    }
  }));
}

type PrizeLikeWithDraw = PrizeLike & {
  draw: DrawContext;
};

function buildBacktestResultExplanation({
  calculationWindow,
  candidateCount,
  generatedCandidates,
  hitNumbers,
  strategy
}: {
  calculationWindow: number;
  candidateCount: number;
  generatedCandidates: ReturnType<typeof buildPositionPredictionResults>;
  hitNumbers: readonly string[];
  strategy: PredictionStrategy;
}): ApiBacktestResultExplanation {
  return {
    calculationWindow,
    candidateCount,
    generatedCandidates: generatedCandidates.map((candidate, index) =>
      toBacktestCandidateExplanation(candidate, index + 1, hitNumbers)
    ),
    strategyId: strategy.id,
    strategyName: strategy.name,
    version: PREDICTION_ENGINE_VERSION
  };
}

function toBacktestCandidateExplanation(
  candidate: ReturnType<typeof buildPositionPredictionResults>[number],
  rank: number,
  hitNumbers: readonly string[]
): ApiBacktestCandidateExplanation {
  return {
    isHit: hitNumbers.includes(candidate.number),
    number: candidate.number,
    numberLength: candidate.numberLength,
    positionBreakdown: candidate.positionBreakdown,
    rank,
    reasons: candidate.reasons,
    score: candidate.score,
    scoreBreakdown: candidate.scoreBreakdown
  };
}

export function getBacktestSummary(results: readonly ApiBacktestResult[]) {
  const hitResults = results.filter((result) => result.isHit);
  const hitRanks = hitResults.flatMap((result) =>
    result.rankOfHit === undefined ? [] : [result.rankOfHit]
  );
  const expectedRandomHitRate = getExpectedRandomHitRate(results);
  const hitRate = results.length > 0 ? round((hitResults.length / results.length) * 100) : 0;

  return {
    averageHitRank:
      hitRanks.length > 0
        ? round(hitRanks.reduce((total, rank) => total + rank, 0) / hitRanks.length)
        : undefined,
    expectedRandomHitRate,
    hitRate,
    liftVsRandom: round(hitRate - expectedRandomHitRate),
    longestMissStreak: getLongestMissStreak(results)
  };
}

function getExpectedRandomHitRate(results: readonly ApiBacktestResult[]) {
  if (results.length === 0) {
    return 0;
  }

  const expectedRates = results.map((result) => {
    const generatedCount = new Set(result.generatedNumbers).size;
    const actualCount = new Set(result.actualNumbers).size;
    const numberLength = result.actualNumbers[0]?.length ?? result.generatedNumbers[0]?.length ?? 2;
    const universeSize = 10 ** numberLength;

    return getRandomHitProbability(generatedCount, actualCount, universeSize) * 100;
  });

  return round(expectedRates.reduce((total, rate) => total + rate, 0) / expectedRates.length);
}

function getRandomHitProbability(
  generatedCount: number,
  actualCount: number,
  universeSize: number
) {
  if (generatedCount <= 0 || actualCount <= 0 || universeSize <= 0) {
    return 0;
  }

  const safeGeneratedCount = Math.min(generatedCount, universeSize);
  const safeActualCount = Math.min(actualCount, universeSize);
  let missProbability = 1;

  for (let index = 0; index < safeGeneratedCount; index += 1) {
    missProbability *= Math.max(0, universeSize - safeActualCount - index) / (universeSize - index);
  }

  return 1 - missProbability;
}

function getLongestMissStreak(results: readonly ApiBacktestResult[]) {
  let longest = 0;
  let current = 0;

  for (const result of results) {
    if (result.isHit) {
      current = 0;
      continue;
    }

    current += 1;
    longest = Math.max(longest, current);
  }

  return longest;
}

function normalizeDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
