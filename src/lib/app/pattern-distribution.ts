import { getDigitSum } from "@/lib/app/number-shape";
import type { ApiNumberStat, ApiPatternFlag } from "@/schema/api/analytics";

export type PatternDistributionItem = {
  id: string;
  label: string;
  value: string;
};

export type PatternDistributionCounts = {
  averageUniqueDigits: number;
  balancedHighLowCount: number;
  balancedOddEvenCount: number;
  digitSums: readonly number[];
  repeatCount: number;
  totalHits: number;
  uniqueCount: number;
};

type HitStat = {
  hitCount: number;
  number: string;
};

export function buildPatternDistributionItems(
  counts: PatternDistributionCounts
): PatternDistributionItem[] {
  const { totalHits } = counts;

  return [
    {
      id: "repeat",
      label: "Repeat shape",
      value: `Repeat digits: ${counts.repeatCount} of ${totalHits} records`
    },
    {
      id: "unique",
      label: "Unique shape",
      value: `All-unique digits: ${counts.uniqueCount} of ${totalHits} records`
    },
    {
      id: "odd-even",
      label: "Odd/even balance",
      value: `Balanced in ${formatPercent(counts.balancedOddEvenCount, totalHits)}%`
    },
    {
      id: "high-low",
      label: "High/low balance",
      value: `Balanced in ${formatPercent(counts.balancedHighLowCount, totalHits)}%`
    },
    {
      id: "sum-range",
      label: "Digit sum range",
      value:
        counts.digitSums.length > 0
          ? `${Math.min(...counts.digitSums)} to ${Math.max(...counts.digitSums)}`
          : "-"
    },
    {
      id: "unique-distribution",
      label: "Unique digit distribution",
      value: `${counts.averageUniqueDigits} unique digits on average`
    }
  ];
}

export function buildPatternDistributionCountsFromApiStats(
  stats: readonly ApiNumberStat[],
  totalHits: number
): PatternDistributionCounts {
  return {
    averageUniqueDigits: getAverageUniqueDigits(stats, totalHits),
    balancedHighLowCount: sumFlagHits(stats, "balanced_high_low"),
    balancedOddEvenCount: sumFlagHits(stats, "balanced_odd_even"),
    digitSums: stats.map((stat) => getDigitSum(stat.number)),
    repeatCount: sumFlagHits(stats, "has_repeat"),
    totalHits,
    uniqueCount: sumFlagHits(stats, "all_unique")
  };
}

function sumFlagHits(stats: readonly ApiNumberStat[], flag: ApiPatternFlag) {
  return stats
    .filter((stat) => stat.patternFlags.includes(flag))
    .reduce((total, stat) => total + stat.hitCount, 0);
}

export function buildPatternDistributionCountsFromHits(
  stats: readonly HitStat[],
  totalHits: number,
  matchers: {
    balancedHighLow: (number: string) => boolean;
    balancedOddEven: (number: string) => boolean;
    hasRepeat: (number: string) => boolean;
    allUnique: (number: string) => boolean;
  }
): PatternDistributionCounts {
  return {
    averageUniqueDigits: getAverageUniqueDigits(stats, totalHits),
    balancedHighLowCount: sumHits(stats, matchers.balancedHighLow),
    balancedOddEvenCount: sumHits(stats, matchers.balancedOddEven),
    digitSums: stats.map((stat) => getDigitSum(stat.number)),
    repeatCount: sumHits(stats, matchers.hasRepeat),
    totalHits,
    uniqueCount: sumHits(stats, matchers.allUnique)
  };
}

function sumHits(stats: readonly HitStat[], matches: (number: string) => boolean) {
  return stats
    .filter((stat) => matches(stat.number))
    .reduce((total, stat) => total + stat.hitCount, 0);
}

function getAverageUniqueDigits(stats: readonly HitStat[], totalHits: number) {
  if (totalHits <= 0) {
    return 0;
  }

  const weightedUniqueDigits = stats.reduce(
    (total, stat) => total + new Set([...stat.number]).size * stat.hitCount,
    0
  );

  return round(weightedUniqueDigits / totalHits);
}

function formatPercent(value: number, total: number) {
  return total > 0 ? round((value / total) * 100) : 0;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
