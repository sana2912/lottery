import { randomUUID } from "node:crypto";
import { calculateNumberStats } from "@/api/service/analytics/number-stats";
import { scoreNumber } from "@/api/service/prediction/scoring-engine";
import type { PredictionStrategy } from "@/api/service/prediction/strategy-registry";
import type { ApiNumberStat } from "@/schema/api/analytics";
import type { ApiBacktestResult } from "@/schema/api/backtest";

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
  windowSize: number;
};

export function runWalkForwardBacktest({
  candidateCount,
  draws,
  numberLength,
  prizeType,
  runId,
  strategy,
  windowSize
}: WalkForwardBacktestInput): ApiBacktestResult[] {
  const sortedDraws = [...draws].sort(
    (left, right) =>
      normalizeDate(left.drawDate).getTime() - normalizeDate(right.drawDate).getTime()
  );

  return sortedDraws.flatMap((targetDraw, targetIndex) => {
    const historyDraws = sortedDraws.slice(0, targetIndex).slice(-windowSize);
    const historyPrizes = historyDraws.flatMap(withDrawContext).filter(matchesPrizeContext);
    const actualNumbers = targetDraw.prizes
      .filter(matchesPrizeContext)
      .map((prize) => prize.number);

    if (historyPrizes.length === 0 || actualNumbers.length === 0) {
      return [];
    }

    const drawCount = new Set(historyPrizes.map((prize) => prize.drawId)).size;
    const numberStats = calculateNumberStats(
      historyPrizes,
      {
        computedAt: normalizeDate(targetDraw.drawDate),
        drawCount,
        windowSize
      },
      numberLength
    );
    const generatedNumbers = rankCandidates(numberStats, strategy, windowSize, candidateCount);
    const hitNumbers = generatedNumbers.filter((number) => actualNumbers.includes(number));
    const firstHit = hitNumbers[0];

    return [
      {
        actualNumbers,
        drawDate: normalizeDate(targetDraw.drawDate).toISOString(),
        drawId: targetDraw.id,
        generatedNumbers,
        hitNumbers,
        id: randomUUID(),
        isHit: hitNumbers.length > 0,
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

export function getBacktestSummary(results: readonly ApiBacktestResult[]) {
  const hitResults = results.filter((result) => result.isHit);
  const hitRanks = hitResults.flatMap((result) =>
    result.rankOfHit === undefined ? [] : [result.rankOfHit]
  );

  return {
    averageHitRank:
      hitRanks.length > 0
        ? round(hitRanks.reduce((total, rank) => total + rank, 0) / hitRanks.length)
        : undefined,
    hitRate: results.length > 0 ? round((hitResults.length / results.length) * 100) : 0,
    longestMissStreak: getLongestMissStreak(results)
  };
}

function rankCandidates(
  numberStats: readonly ApiNumberStat[],
  strategy: PredictionStrategy,
  windowSize: number,
  candidateCount: number
) {
  return numberStats
    .map((stat, index) =>
      scoreNumber({
        inputWindow: windowSize,
        rank: index + 1,
        stat,
        strategy
      })
    )
    .sort((left, right) => right.score - left.score)
    .slice(0, candidateCount)
    .map((result) => result.number);
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
