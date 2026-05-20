import { getMiniDna } from "@/lib/app/number-shape";
import {
  buildPatternDistributionCountsFromApiStats,
  buildPatternDistributionItems
} from "@/lib/app/pattern-distribution";
import type { ApiAnalyticsReadModel, ApiNumberStat, ApiPatternFlag } from "@/schema/api/analytics";
import type { ApiAnalysisPatternReadModel } from "@/schema/api/patterns";

export function buildAnalysisPatternReadModel(
  analytics: ApiAnalyticsReadModel
): ApiAnalysisPatternReadModel {
  const stats = analytics.numberStats;
  const sampleSize = getTotalHits(stats);

  return {
    distribution: buildPatternDistributionItems(
      buildPatternDistributionCountsFromApiStats(stats, sampleSize)
    ),
    examples: stats.slice(0, 24).map((stat) => ({
      dna: getMiniDna(stat.number),
      flags: stat.patternFlags.slice(0, 6),
      number: stat.number,
      prizeType: stat.prizeType
    })),
    overview: analytics.patternSummaries.map((summary) => ({
      examples: getPatternExamples(stats, summary.pattern),
      hitCount: summary.hitCount,
      id: summary.pattern,
      label: summary.label,
      pattern: summary.pattern,
      percent: summary.frequencyPercent,
      sampleSize: summary.sampleSize
    })),
    sampleSize
  };
}

function getPatternExamples(stats: readonly ApiNumberStat[], flag: ApiPatternFlag) {
  return stats
    .filter((stat) => stat.patternFlags.includes(flag))
    .slice(0, 5)
    .map((stat) => stat.number);
}

function getTotalHits(stats: readonly ApiNumberStat[]) {
  return stats.reduce((total, stat) => total + stat.hitCount, 0);
}
