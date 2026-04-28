import type { AnalyticsReadModel } from "@/schema/app/analytics.schema";

export function getFlaggedNumbers(analytics: AnalyticsReadModel) {
  return analytics.numberStats.filter((stat) => stat.patternFlags.length > 0).slice(0, 12);
}

export function toPatternHeatmapCells(analytics: AnalyticsReadModel) {
  return analytics.patternSummaries.map((summary) => ({
    id: summary.id,
    label: summary.pattern,
    value: summary.hitCount
  }));
}
