import { getDigitSum, getMiniDna } from "@/lib/app/number-shape";
import type { ApiAnalyticsReadModel, ApiNumberStat, ApiPatternFlag } from "@/schema/api/analytics";

export type AnalysisPatternReadModel = {
  distribution: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  examples: Array<{
    dna: string;
    flags: ApiPatternFlag[];
    number: string;
    prizeType: string;
  }>;
  overview: Array<{
    examples: string[];
    hitCount: number;
    id: string;
    label: string;
    percent: number;
    sampleSize: number;
  }>;
  sampleSize: number;
};

export function buildAnalysisPatternReadModel(
  analytics: ApiAnalyticsReadModel
): AnalysisPatternReadModel {
  const stats = analytics.numberStats;
  const sampleSize = getTotalHits(stats);

  return {
    distribution: buildPatternDistribution(stats, sampleSize),
    examples: stats.slice(0, 24).map((stat) => ({
      dna: getMiniDna(stat.number),
      flags: stat.patternFlags.slice(0, 6),
      number: stat.number,
      prizeType: stat.prizeType
    })),
    overview: analytics.patternSummaries.map((summary) => ({
      examples: getPatternExamples(stats, summary.pattern),
      hitCount: summary.hitCount,
      id: summary.id,
      label: summary.label,
      percent: summary.frequencyPercent,
      sampleSize: summary.sampleSize
    })),
    sampleSize
  };
}

function buildPatternDistribution(stats: readonly ApiNumberStat[], totalHits: number) {
  const repeatCount = getFlagHitCount(stats, "has_repeat");
  const uniqueCount = getFlagHitCount(stats, "all_unique");
  const balancedOddEvenCount = getFlagHitCount(stats, "balanced_odd_even");
  const balancedHighLowCount = getFlagHitCount(stats, "balanced_high_low");
  const digitSums = stats.map((stat) => getDigitSum(stat.number));

  return [
    {
      id: "repeat",
      label: "Repeat shape",
      value: `Repeat digits: ${repeatCount} of ${totalHits} records`
    },
    {
      id: "unique",
      label: "Unique shape",
      value: `All-unique digits: ${uniqueCount} of ${totalHits} records`
    },
    {
      id: "odd-even",
      label: "Odd/even balance",
      value: `Balanced in ${getPercent(balancedOddEvenCount, totalHits)}%`
    },
    {
      id: "high-low",
      label: "High/low balance",
      value: `Balanced in ${getPercent(balancedHighLowCount, totalHits)}%`
    },
    {
      id: "sum-range",
      label: "Digit sum range",
      value: digitSums.length > 0 ? `${Math.min(...digitSums)} to ${Math.max(...digitSums)}` : "-"
    }
  ];
}

function getPatternExamples(stats: readonly ApiNumberStat[], flag: ApiPatternFlag) {
  return stats
    .filter((stat) => stat.patternFlags.includes(flag))
    .slice(0, 5)
    .map((stat) => stat.number);
}

function getFlagHitCount(stats: readonly ApiNumberStat[], flag: ApiPatternFlag) {
  return getTotalHits(stats.filter((stat) => stat.patternFlags.includes(flag)));
}

function getTotalHits(stats: readonly ApiNumberStat[]) {
  return stats.reduce((total, stat) => total + stat.hitCount, 0);
}

function getPercent(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 10_000) / 100 : 0;
}
