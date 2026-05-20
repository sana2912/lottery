import { toApiCompareReadModel } from "@/api/model/dto/compare.dto";
import { analyticsService } from "@/api/service/analytics.service";
import { scoreNumber } from "@/api/service/prediction/scoring-engine";
import { getPredictionStrategy } from "@/api/service/prediction/strategy-registry";
import { getNumberShapeFlags } from "@/lib/app/number-shape";
import type { ApiNumberStat, ApiPatternFlag } from "@/schema/api/analytics";
import type { ApiScoreBreakdown } from "@/schema/api/compare";
import type { CompareRequest } from "@/schema/app/compare.schema";

export async function compareNumbers(input: CompareRequest) {
  const strategy = getPredictionStrategy(input.strategyId);
  const numbers = getUniqueNumbers(input.numbers);
  const numberLength = input.numberLength ?? numbers[0]?.length ?? 2;
  const numberStats = await analyticsService.getNumberStats({
    endDate: input.endDate,
    lotteryType: input.lotteryType,
    numberLength,
    page: 1,
    pageSize: 100,
    prizeType: input.prizeType,
    q: input.q,
    startDate: input.startDate,
    windowSize: input.windowSize
  });
  const statsByNumber = new Map(numberStats.map((stat) => [stat.number, stat]));
  const computedAt = new Date();
  const candidates = numbers
    .filter((number) => number.length === numberLength)
    .map((number, index) =>
      scoreNumber({
        inputWindow: input.windowSize,
        rank: index + 1,
        stat:
          statsByNumber.get(number) ??
          createEmptyNumberStat({
            computedAt,
            input,
            number,
            numberLength,
            sampleStat: numberStats[0]
          }),
        strategy
      })
    )
    .sort((left, right) => right.score - left.score)
    .map((result, index) => ({
      number: result.number,
      numberLength: result.numberLength,
      rank: index + 1,
      reasons: result.reasons,
      score: result.score,
      scoreBreakdown: result.scoreBreakdown
    }));

  return toApiCompareReadModel({
    candidates,
    generatedAt: computedAt,
    sampleSize: getSampleSize(numberStats),
    source: "api",
    strategyId: strategy.id,
    strongestSignal: getStrongestSignal(candidates.map((candidate) => candidate.scoreBreakdown))
  });
}

export const compareService = {
  compareNumbers
} as const;

function getUniqueNumbers(numbers: readonly string[]) {
  return [...new Set(numbers.map((number) => number.trim()).filter(Boolean))];
}

function createEmptyNumberStat({
  computedAt,
  input,
  number,
  numberLength,
  sampleStat
}: {
  computedAt: Date;
  input: CompareRequest;
  number: string;
  numberLength: number;
  sampleStat?: ApiNumberStat;
}): ApiNumberStat {
  return {
    computedAt: computedAt.toISOString(),
    drawCount: sampleStat?.drawCount ?? 0,
    frequencyPercent: 0,
    frequencyPerDrawPercent: 0,
    frequencyPerPrizeRowPercent: 0,
    hitCount: 0,
    lotteryType: input.lotteryType,
    maxGap: undefined,
    missingDrawCount: sampleStat?.drawCount ?? input.windowSize,
    number,
    numberLength,
    patternFlags: getPatternFlags(number),
    prizeType: input.prizeType ?? "TWO_DIGIT",
    samplePrizeCount: sampleStat?.samplePrizeCount ?? sampleStat?.drawCount ?? 0,
    trendScore: 0,
    windowSize: input.windowSize
  };
}

function getPatternFlags(number: string): ApiPatternFlag[] {
  return getNumberShapeFlags(number);
}

function getSampleSize(numberStats: readonly ApiNumberStat[]) {
  return Math.max(0, ...numberStats.map((stat) => stat.samplePrizeCount ?? stat.drawCount));
}

function getStrongestSignal(breakdowns: readonly ApiScoreBreakdown[]) {
  const totals: Record<keyof ApiScoreBreakdown, number> = {
    hot: 0,
    overdue: 0,
    pair: 0,
    pattern: 0,
    position: 0
  };

  for (const breakdown of breakdowns) {
    totals.hot += breakdown.hot;
    totals.overdue += breakdown.overdue;
    totals.pair += breakdown.pair;
    totals.pattern += breakdown.pattern;
    totals.position += breakdown.position;
  }

  return Object.entries(totals).sort((left, right) => right[1] - left[1])[0]?.[0];
}
